import { LIVE_SNAPSHOT, META, PLAN, q, ro } from "./graph";

export type Phase = "countdown" | "live";

export async function phase(): Promise<Phase> {
  const [row] = await ro<{ v: string }>("MATCH (s:Setting {key:'phase'}) RETURN s.value AS v", {}, META);
  return row?.v === "live" ? "live" : "countdown";
}

/** The graph that currently holds the plan: the Countdown plan or the Live (day 9) snapshot. */
export async function activeGraph(): Promise<string> {
  return (await phase()) === "live" ? LIVE_SNAPSHOT : PLAN;
}

export async function setPhase(p: Phase) {
  await q("MERGE (s:Setting {key:'phase'}) SET s.value = $p", { p }, META);
}

export type Drop = { id: string; name: string; date: string; today: string; orders: number };
export async function drop(graph?: string): Promise<Drop> {
  const g = graph ?? (await activeGraph());
  const [d] = await ro<Drop>(
    "MATCH (d:Drop) RETURN d.id AS id, d.name AS name, d.date AS date, d.today AS today, d.orders AS orders",
    {},
    g,
  );
  return d;
}

export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export type HeatRow = { line: string; style: string; colour: string; cells: { size: string; pct: number; soldOut: boolean }[] };
/** Sell-through by style × colour × size, aggregated from SKU nodes. */
export async function heatmap(): Promise<HeatRow[]> {
  const rows = await ro<{ line: string; style: string; colour: string; size: string; sold: number; planned: number }>(
    `MATCH (k:SKU)-[:OF_STYLE]->(s:Style)
     RETURN k.line AS line, s.name AS style, k.colour AS colour, k.size AS size, k.sold AS sold, k.planned AS planned
     ORDER BY line, size DESC`,
    {},
    await activeGraph(),
  );
  const order = ["LEG-BLK", "LEG-OLV", "BRA-BLK", "TNK-BLK", "TNK-OLV"];
  const sizes = ["S", "M", "L"];
  return order.map((line) => {
    const r = rows.filter((x) => x.line === line);
    return {
      line,
      style: r[0]?.style ?? line,
      colour: r[0]?.colour ?? "",
      cells: sizes.map((size) => {
        const c = r.find((x) => x.size === size)!;
        const pct = Math.round((100 * c.sold) / c.planned);
        return { size, pct, soldOut: c.sold >= c.planned };
      }),
    };
  });
}

export type Totals = { sold: number; planned: number; revenue: number; returns: number };
export async function totals(): Promise<Totals> {
  const [t] = await ro<Totals>(
    `MATCH (k:SKU)-[:OF_STYLE]->(s:Style)
     RETURN sum(k.sold) AS sold, sum(k.planned) AS planned, sum(k.sold * s.price) AS revenue, sum(k.returns) AS returns`,
    {},
    await activeGraph(),
  );
  return t;
}

export type Restock = { id: string; label: string; onHand: number; rate: number; daysLeft: number; qty: number; supplier: string; leadDays: number };
/** Restock = ceil10(rate × leadDays − onHand − incoming); rate = sold ÷ days live. */
export async function restocks(limit = 3): Promise<Restock[]> {
  const g = await activeGraph();
  const d = await drop(g);
  const daysLive = Math.max(1, daysBetween(d.date, d.today));
  const rows = await ro<{ id: string; style: string; colour: string; size: string; sold: number; onHand: number; supplier: string; leadDays: number }>(
    `MATCH (k:SKU)-[:OF_STYLE]->(s:Style), (po:PO)-[:SUPPLIES]->(k), (po)-[:MADE_BY]->(sup:Supplier)
     WHERE k.sold > 0
     RETURN k.id AS id, s.name AS style, k.colour AS colour, k.size AS size, k.sold AS sold, k.onHand AS onHand,
            sup.name AS supplier, sup.leadDays AS leadDays`,
    {},
    g,
  );
  return rows
    .map((r) => {
      const rate = r.sold / daysLive;
      const qty = Math.ceil(Math.max(0, rate * r.leadDays - r.onHand) / 10) * 10;
      return {
        id: r.id,
        label: `${r.style.replace(/^(Core|Sculpt|Everyday) /, "")} · ${r.colour} · ${r.size}`,
        onHand: r.onHand,
        rate,
        daysLeft: r.onHand / rate,
        qty,
        supplier: r.supplier,
        leadDays: r.leadDays,
      };
    })
    .filter((r) => r.daysLeft < 7 && r.qty > 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, limit);
}

export type Creator = { handle: string; code: string; orders: number; repeatRate: number };
export async function creators(): Promise<Creator[]> {
  return ro<Creator>(
    "MATCH (c:Creator) RETURN c.handle AS handle, c.code AS code, c.orders AS orders, c.repeatRate AS repeatRate ORDER BY c.orders DESC",
    {},
    await activeGraph(),
  );
}

export type Call = { id: string; kind: string; title: string; summary: string; teammate: string; about: string; at: string };
export async function openCalls(graph?: string): Promise<Call[]> {
  return ro<Call>(
    `MATCH (c:Call {status:'open'})-[:RAISED_BY]->(t:Teammate)
     OPTIONAL MATCH (c)-[:ABOUT]->(a)
     RETURN c.id AS id, c.kind AS kind, c.title AS title, c.summary AS summary, t.name AS teammate,
            coalesce(a.id, '') AS about, c.at AS at
     ORDER BY c.at DESC`,
    {},
    graph ?? (await activeGraph()),
  );
}

export type PO = { id: string; supplier: string; supplierId: string; line: string; label: string; qty: number; unitPrice: number; eta: string; stage: string; status: string; pending: string | null; quiet: boolean };
export async function pos(graph?: string): Promise<PO[]> {
  return ro<PO>(
    `MATCH (po:PO)-[:MADE_BY]->(sup:Supplier), (po)-[:SUPPLIES]->(k:SKU)-[:OF_STYLE]->(s:Style)
     WITH po, sup, s, collect(k)[0] AS k
     OPTIONAL MATCH (po)-[:HAS_CHECKIN]->(ci:CheckIn)
     WITH po, sup, s, k, collect(ci) AS cis
     OPTIONAL MATCH (c:Call {status:'open', kind:'delay'})-[:ABOUT]->(po)
     RETURN po.id AS id, sup.name AS supplier, sup.id AS supplierId, k.line AS line, s.name + ' · ' + k.colour AS label,
            po.qty AS qty, po.unitPrice AS unitPrice, po.eta AS eta, po.stage AS stage, po.status AS status,
            c.summary AS pending, any(x IN cis WHERE x.status = 'quiet') AS quiet
     ORDER BY id`,
    {},
    graph ?? (await activeGraph()),
  );
}

export type CheckIn = { id: string; question: string; due: string; status: string; po: string };
export async function checkInsFor(supplierId: string): Promise<CheckIn[]> {
  return ro<CheckIn>(
    `MATCH (po:PO)-[:MADE_BY]->(:Supplier {id:$s}), (po)-[:HAS_CHECKIN]->(ci:CheckIn)
     RETURN ci.id AS id, ci.question AS question, ci.due AS due, ci.status AS status, po.id AS po ORDER BY ci.due`,
    { s: supplierId },
    await activeGraph(),
  );
}

export type Impact = { po: string; supplier: string; skus: string[]; style: string; drop: string; dropDate: string; posts: { handle: string; date: string }[]; owner: string };
/** Multi-hop: PO → SKUs → Style → Drop ← CreatorPost ← Creator. What a slip on this PO breaks. */
export async function impactOf(poId: string, graph?: string): Promise<Impact> {
  const [row] = await ro<Impact>(
    `MATCH (po:PO {id:$po})-[:MADE_BY]->(sup:Supplier), (owner:Person)-[:OWNS]->(po),
           (po)-[:SUPPLIES]->(k:SKU)-[:OF_STYLE]->(s:Style)-[:IN_DROP]->(d:Drop)
     OPTIONAL MATCH (cr:Creator)-[:POSTED]->(p:CreatorPost)-[:PROMOTES]->(d)
     RETURN po.id AS po, sup.name AS supplier, collect(DISTINCT k.code) AS skus, s.name AS style,
            d.name AS drop, d.date AS dropDate, owner.name AS owner,
            collect(DISTINCT {handle: cr.handle, date: p.date}) AS posts`,
    { po: poId },
    graph ?? (await activeGraph()),
  );
  return row;
}

/** PageRank over supply edges: which suppliers the drop leans on most (single points of failure). */
export async function supplierRisk(): Promise<{ name: string; score: number; skus: number }[]> {
  const g = await activeGraph();
  try {
    const rows = await ro<{ name: string; score: number; skus: number }>(
      `CALL algo.pageRank(null, 'MADE_BY') YIELD node, score
       WITH node, score WHERE node:Supplier
       OPTIONAL MATCH (node)<-[:MADE_BY]-(:PO)-[:SUPPLIES]->(k:SKU)
       RETURN node.name AS name, score, count(k) AS skus ORDER BY score DESC`,
      {},
      g,
    );
    if (rows.length) return rows as { name: string; score: number; skus: number }[];
  } catch {
    // fall through to degree centrality
  }
  return ro<{ name: string; score: number; skus: number }>(
    `MATCH (sup:Supplier)<-[:MADE_BY]-(:PO)-[:SUPPLIES]->(k:SKU)
     RETURN sup.name AS name, count(k) AS skus, toFloat(count(k)) / 15.0 AS score ORDER BY skus DESC`,
    {},
    g,
  );
}

export type Activity = { at: string; who: string; text: string };
export async function quietCheckIns(): Promise<{ supplier: string; question: string; due: string }[]> {
  return ro(
    `MATCH (ci:CheckIn {status:'quiet'})-[:ASKED]->(sup:Supplier) RETURN sup.name AS supplier, ci.question AS question, ci.due AS due`,
    {},
    await activeGraph(),
  );
}
