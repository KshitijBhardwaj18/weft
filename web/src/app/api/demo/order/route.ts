import { ro } from "@/lib/graph";
import { applyOrderWebhook } from "@/lib/integrations/shopify";
import { activeGraph, drop, phase } from "@/lib/plan";

// Demo shop: one order for an in-stock SKU, sent through the same code path as Shopify's orders/create webhook.
export async function POST() {
  if ((await phase()) !== "live") return Response.json({ error: "Switch the clock to Live: the collection isn't on sale yet." }, { status: 400 });
  const g = await activeGraph();
  const d = await drop(g);
  const skus = await ro<{ code: string; label: string; onHand: number }>(
    `MATCH (k:SKU)-[:OF_STYLE]->(s:Style)-[:IN_DROP]->(:Drop {id:$drop}) WHERE k.onHand > 0
     RETURN k.code AS code, s.name + ' · ' + k.colour + ' · ' + k.size AS label, k.onHand AS onHand`,
    { drop: d.id },
    g,
  );
  if (!skus.length) return Response.json({ error: "Everything is sold out." }, { status: 400 });
  const creators = await ro<{ code: string; handle: string }>("MATCH (c:Creator) RETURN c.code AS code, c.handle AS handle", {}, g);
  const k = skus[Math.floor(Math.random() * skus.length)];
  const qty = Math.min(k.onHand, 1 + Math.floor(Math.random() * 2));
  const via = Math.random() < 0.6 ? creators[Math.floor(Math.random() * creators.length)] : undefined;
  await applyOrderWebhook({ line_items: [{ sku: k.code, quantity: qty }], discount_codes: via ? [{ code: via.code }] : [] });
  return Response.json({ sku: k.label, qty, creator: via?.handle ?? null });
}
