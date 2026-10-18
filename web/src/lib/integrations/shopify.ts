import { createHmac, timingSafeEqual } from "node:crypto";
import { q, ro } from "../graph";
import { activeGraph } from "../plan";

type GqlError = { message: string; extensions?: { code?: string } };
type Nodes<T> = { nodes: T[] };
type Page<T> = { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: T[] };

// Admin GraphQL order, shaped by ORDERS_QUERY.
export type ShopifyOrder = {
  id: string;
  name: string;
  createdAt: string;
  customer: { id: string } | null;
  discountCodes: string[];
  lineItems: Nodes<{ quantity: number; sku: string | null }>;
  refunds: { note: string | null; refundLineItems: Nodes<{ quantity: number; lineItem: { sku: string | null } | null }> }[];
};
// Admin GraphQL product variant, shaped by VARIANTS_QUERY.
export type ShopifyVariant = { sku: string | null; inventoryQuantity: number };

// REST orders/create payload (fields we use).
export type RestOrder = {
  line_items: { sku: string | null; quantity: number }[];
  discount_codes: { code: string }[];
};
// REST refunds/create payload (fields we use).
export type RestRefund = {
  note: string | null;
  refund_line_items: { quantity: number; line_item: { sku: string | null } | null }[];
};
// REST inventory_levels/update payload: Shopify sends inventory_item_id, not the SKU.
export type RestInventoryLevel = { inventory_item_id?: number | null; sku?: string | null; available?: number | null };

export type SyncSummary = { orders: number; skusUpdated: number; creatorsUpdated: number; unmatchedSkus: string[] };

// ponytail: first 50 line items and refund lines per order; paginate if orders grow past that.
const ORDERS_QUERY = `
  query Orders($query: String!, $cursor: String) {
    orders(first: 100, query: $query, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id name createdAt
        customer { id }
        discountCodes
        lineItems(first: 50) { nodes { quantity sku } }
        refunds { note refundLineItems(first: 50) { nodes { quantity lineItem { sku } } } }
      }
    }
  }`;

const VARIANTS_QUERY = `
  query Variants($cursor: String) {
    productVariants(first: 250, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes { sku inventoryQuantity }
    }
  }`;

// Reads Shopify settings at call time so env changes apply without a restart.
function cfg() {
  return {
    domain: process.env.SHOPIFY_STORE_DOMAIN?.trim() || null,
    token: process.env.SHOPIFY_ADMIN_TOKEN?.trim() || null,
    version: process.env.SHOPIFY_API_VERSION?.trim() || "2025-10",
    secret: process.env.SHOPIFY_WEBHOOK_SECRET || null,
  };
}

// True when the store domain and Admin token are both set.
export function shopifyConfigured(): boolean {
  const { domain, token } = cfg();
  return !!domain && !!token;
}

// The configured store domain, or null.
export function shopifyStore(): string | null {
  return cfg().domain;
}

// Waits for a number of milliseconds.
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// POSTs one GraphQL operation; retries 429s and THROTTLED errors up to 3 times.
export async function shopifyGraphQL<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const { domain, token, version } = cfg();
  if (!domain || !token) throw new Error("Shopify not configured: set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN");
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (res.status === 429 && attempt < 3) {
      await sleep((Number(res.headers.get("Retry-After")) || 2) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`Shopify HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as { data?: T; errors?: GqlError[] };
    if (attempt < 3 && body.errors?.some((e) => e.extensions?.code === "THROTTLED")) {
      await sleep(2000);
      continue;
    }
    if (body.errors?.length) throw new Error(`Shopify GraphQL: ${body.errors.map((e) => e.message).join("; ")}`);
    return body.data as T;
  }
}

// Walks a connection cursor by cursor and collects every node.
async function paginate<D, T>(query: string, vars: Record<string, unknown>, pick: (d: D) => Page<T>): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | null = null;
  do {
    const page = pick(await shopifyGraphQL<D>(query, { ...vars, cursor }));
    out.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);
  return out;
}

// Every order created since an ISO timestamp.
export function fetchOrdersSince(sinceIso: string): Promise<ShopifyOrder[]> {
  return paginate<{ orders: Page<ShopifyOrder> }, ShopifyOrder>(
    ORDERS_QUERY,
    { query: `created_at:>=${sinceIso}` },
    (d) => d.orders,
  );
}

// Every product variant with its SKU and on-hand quantity.
export function fetchInventory(): Promise<ShopifyVariant[]> {
  return paginate<{ productVariants: Page<ShopifyVariant> }, ShopifyVariant>(VARIANTS_QUERY, {}, (d) => d.productVariants);
}

// Most frequent item in a list, or null when empty.
function mostCommon(xs: string[]): string | null {
  const counts = new Map<string, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best: string | null = null;
  let n = 0;
  for (const [x, c] of counts) if (c > n) [best, n] = [x, c];
  return best;
}

// Upper-cased, de-duplicated discount codes on a GraphQL order.
const codesOf = (o: ShopifyOrder) => [...new Set(o.discountCodes.map((c) => c.toUpperCase()))];

type SkuRow = { sku: string; sold: number; returns: number; onHand: number | null; returnReason: string | null };

// Per Shopify SKU: units sold, units refunded, most common refund note, and on-hand from inventory.
function skuTotals(orders: ShopifyOrder[], variants: ShopifyVariant[]): SkuRow[] {
  const acc = new Map<string, { sold: number; returns: number; onHand: number | null; notes: string[] }>();
  const at = (sku: string) => {
    if (!acc.has(sku)) acc.set(sku, { sold: 0, returns: 0, onHand: null, notes: [] });
    return acc.get(sku)!;
  };
  for (const v of variants) if (v.sku) at(v.sku).onHand = v.inventoryQuantity;
  for (const o of orders) {
    for (const l of o.lineItems.nodes) if (l.sku) at(l.sku).sold += l.quantity;
    for (const r of o.refunds)
      for (const l of r.refundLineItems.nodes) {
        const sku = l.lineItem?.sku;
        if (!sku) continue;
        const a = at(sku);
        a.returns += l.quantity;
        if (r.note) a.notes.push(r.note);
      }
  }
  return [...acc].map(([sku, a]) => ({ sku, sold: a.sold, returns: a.returns, onHand: a.onHand, returnReason: mostCommon(a.notes) }));
}

type CreatorRow = { code: string; orders: number; repeatRate: number };

// Per creator code: orders using it, and the share of its customers who ordered more than once.
function creatorTotals(orders: ShopifyOrder[], codes: string[]): CreatorRow[] {
  const perCustomer = new Map<string, number>();
  for (const o of orders) if (o.customer) perCustomer.set(o.customer.id, (perCustomer.get(o.customer.id) ?? 0) + 1);
  return codes.map((code) => {
    const used = orders.filter((o) => codesOf(o).includes(code));
    const customers = [...new Set(used.flatMap((o) => (o.customer ? [o.customer.id] : [])))];
    const repeat = customers.filter((id) => (perCustomer.get(id) ?? 0) > 1).length;
    const repeatRate = customers.length ? Math.round((100 * repeat) / customers.length) / 100 : 0;
    return { code, orders: used.length, repeatRate };
  });
}

type DriveRow = { code: string; sku: string; orders: number };

// Orders per (creator code, SKU) pair, counting each order once.
function driveTotals(orders: ShopifyOrder[]): DriveRow[] {
  const acc = new Map<string, DriveRow>();
  for (const o of orders) {
    const skus = [...new Set(o.lineItems.nodes.flatMap((l) => (l.sku ? [l.sku] : [])))];
    for (const code of codesOf(o))
      for (const sku of skus) {
        const key = `${code}|${sku}`;
        acc.set(key, { code, sku, orders: (acc.get(key)?.orders ?? 0) + 1 });
      }
  }
  return [...acc.values()];
}

// Recomputes SKU, creator, DROVE and drop numbers in the active graph from Shopify since a date.
export async function syncShop({ since }: { since: string }): Promise<SyncSummary> {
  const sinceIso = new Date(since).toISOString().replace(/\.\d{3}Z$/, "Z");
  const [orders, variants] = await Promise.all([fetchOrdersSince(sinceIso), fetchInventory()]);
  const g = await activeGraph();

  // ponytail: one UNWIND per write; chunk it if a shop has thousands of SKUs.
  const skus = skuTotals(orders, variants);
  const skuHits = await q<{ sku: string }>(
    `UNWIND $rows AS r MATCH (k:SKU {code: r.sku})
     SET k.sold = r.sold, k.returns = r.returns, k.onHand = coalesce(r.onHand, k.onHand),
         k.returnReason = coalesce(r.returnReason, k.returnReason)
     RETURN r.sku AS sku`,
    { rows: skus },
    g,
  );

  const codes = (await ro<{ code: string }>("MATCH (c:Creator) WHERE c.code IS NOT NULL RETURN c.code AS code", {}, g)).map((c) =>
    c.code.toUpperCase(),
  );
  const creatorHits = await q<{ code: string }>(
    `UNWIND $rows AS r MATCH (c:Creator) WHERE toUpper(c.code) = r.code
     SET c.orders = r.orders, c.repeatRate = r.repeatRate
     RETURN c.code AS code`,
    { rows: creatorTotals(orders, codes) },
    g,
  );

  await q("MATCH ()-[d:DROVE]->() DELETE d", {}, g);
  await q(
    `UNWIND $rows AS r MATCH (c:Creator) WHERE toUpper(c.code) = r.code
     MATCH (k:SKU {code: r.sku}) MERGE (c)-[d:DROVE]->(k) SET d.orders = r.orders`,
    { rows: driveTotals(orders) },
    g,
  );
  await q("MATCH (d:Drop) SET d.orders = $n", { n: orders.length }, g);

  const hit = new Set(skuHits.map((r) => r.sku));
  return {
    orders: orders.length,
    skusUpdated: hit.size,
    creatorsUpdated: creatorHits.length,
    unmatchedSkus: skus.map((s) => s.sku).filter((s) => !hit.has(s)),
  };
}

// Incremental update for one orders/create webhook.
export async function applyOrderWebhook(order: RestOrder): Promise<void> {
  const g = await activeGraph();
  const lines = order.line_items.flatMap((l) => (l.sku ? [{ sku: l.sku, qty: l.quantity }] : []));
  const skus = [...new Set(lines.map((l) => l.sku))];
  const codes = [...new Set(order.discount_codes.map((d) => d.code.toUpperCase()))];
  await q(
    `UNWIND $lines AS l MATCH (k:SKU {code: l.sku})
     SET k.sold = coalesce(k.sold, 0) + l.qty, k.onHand = coalesce(k.onHand, 0) - l.qty`,
    { lines },
    g,
  );
  await q(
    `UNWIND $codes AS code MATCH (c:Creator) WHERE toUpper(c.code) = code
     SET c.orders = coalesce(c.orders, 0) + 1`,
    { codes },
    g,
  );
  await q(
    `UNWIND $pairs AS p MATCH (c:Creator) WHERE toUpper(c.code) = p.code
     MATCH (k:SKU {code: p.sku}) MERGE (c)-[d:DROVE]->(k) SET d.orders = coalesce(d.orders, 0) + 1`,
    { pairs: codes.flatMap((code) => skus.map((sku) => ({ code, sku }))) },
    g,
  );
  await q("MATCH (d:Drop) SET d.orders = coalesce(d.orders, 0) + 1", {}, g);
}

// Incremental update for one refunds/create webhook.
export async function applyRefundWebhook(refund: RestRefund): Promise<void> {
  const rows = refund.refund_line_items.flatMap((l) =>
    l.line_item?.sku ? [{ sku: l.line_item.sku, qty: l.quantity, note: refund.note || null }] : [],
  );
  await q(
    `UNWIND $rows AS r MATCH (k:SKU {code: r.sku})
     SET k.returns = coalesce(k.returns, 0) + r.qty, k.returnReason = coalesce(r.note, k.returnReason)`,
    { rows },
    await activeGraph(),
  );
}

// Sets onHand from an inventory webhook; returns false when the SKU cannot be found.
export async function applyInventoryWebhook(level: RestInventoryLevel): Promise<boolean> {
  if (level.available == null) return false;
  const sku = level.sku ?? (level.inventory_item_id ? await skuOfInventoryItem(level.inventory_item_id) : null);
  if (!sku) return false;
  await q("MATCH (k:SKU {code: $sku}) SET k.onHand = $onHand", { sku, onHand: level.available }, await activeGraph());
  return true;
}

async function skuOfInventoryItem(id: number): Promise<string | null> {
  const data = await shopifyGraphQL<{ inventoryItem: { sku: string | null } | null }>(
    "query($id: ID!) { inventoryItem(id: $id) { sku } }",
    { id: `gid://shopify/InventoryItem/${id}` },
  );
  return data.inventoryItem?.sku ?? null;
}

// Checks Shopify's base64 HMAC-SHA256 of the raw body against the webhook secret.
export function verifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  const { secret } = cfg();
  if (!secret || !hmacHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const given = Buffer.from(hmacHeader, "base64");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
