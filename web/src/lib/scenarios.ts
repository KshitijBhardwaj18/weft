import { META, copyGraph, deleteGraph, q, ro } from "./graph";
import { activeGraph, daysBetween, drop } from "./plan";

export type Scenario = { id: string; graph: string; base: string; po: string; to: string; toName: string; at: string };

const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

/** A scenario is a full copy of the plan graph (GRAPH.COPY), changed in isolation. */
export async function createScenario(po: string, to: string): Promise<Scenario> {
  const base = await activeGraph();
  const id = `scn${Date.now().toString(36)}`;
  const graph = `weft_${id}`;
  await copyGraph(base, graph);

  const d = await drop(base);
  const [sup] = await ro<{ name: string; leadDays: number }>(
    "MATCH (s:Supplier {id:$to}) RETURN s.name AS name, s.leadDays AS leadDays",
    { to },
    graph,
  );
  // Inside the copy only: move the PO, re-date it from the new supplier's lead time, close the call.
  await q(
    `MATCH (po:PO {id:$po})-[r:MADE_BY]->(:Supplier), (to:Supplier {id:$to})
     DELETE r
     CREATE (po)-[:MADE_BY]->(to)
     SET po.eta = $eta, po.unitPrice = po.unitPrice + 20, po.status = 'accepted', po.stage = 'Fabric'
     WITH po OPTIONAL MATCH (c:Call {status:'open'})-[:ABOUT]->(po) SET c.status = 'resolved'`,
    { po, to, eta: addDays(d.today, sup.leadDays) },
    graph,
  );
  const s = { id, graph, base, po, to, toName: sup.name, at: new Date().toISOString() };
  await q("CREATE (:Scenario {id:$id, graph:$graph, base:$base, po:$po, to:$to, toName:$toName, at:$at, status:'open'})", s, META);
  return s;
}

export async function listScenarios(): Promise<Scenario[]> {
  return ro<Scenario>(
    `MATCH (s:Scenario {status:'open'}) RETURN s.id AS id, s.graph AS graph, s.base AS base, s.po AS po, s.to AS to, s.toName AS toName, s.at AS at ORDER BY s.at DESC`,
    {},
    META,
  );
}

export type Side = { supplier: string; eta: string; lateDays: number; cost: number; brokenPosts: number; dropOnTime: boolean };

/** The same questions asked of two graphs: reality (with any pending delay) and the scenario. */
export async function sideOf(graph: string, po: string, withPendingDelay: boolean): Promise<Side> {
  const [r] = await ro<{ supplier: string; eta: string; pending: string | null; cost: number; dropDate: string; posts: number }>(
    `MATCH (p:PO {id:$po})-[:MADE_BY]->(sup:Supplier), (p)-[:SUPPLIES]->(:SKU)-[:OF_STYLE]->(:Style)-[:IN_DROP]->(d:Drop)
     OPTIONAL MATCH (c:Call {status:'open', kind:'delay'})-[:ABOUT]->(p)
     OPTIONAL MATCH (:Creator)-[:POSTED]->(cp:CreatorPost)-[:PROMOTES]->(d)
     RETURN sup.name AS supplier, p.eta AS eta, c.newEta AS pending, p.qty * p.unitPrice AS cost,
            d.date AS dropDate, count(DISTINCT cp) AS posts`,
    { po },
    graph,
  );
  const eta = withPendingDelay && r.pending ? r.pending : r.eta;
  const lateDays = Math.max(0, daysBetween(r.dropDate, eta));
  return { supplier: r.supplier, eta, lateDays, cost: r.cost, brokenPosts: lateDays > 0 ? r.posts : 0, dropOnTime: lateDays === 0 };
}

/** Apply to plan: the scenario graph becomes the plan (GRAPH.COPY over it), and the decision is recorded. */
export async function applyScenario(id: string) {
  const [s] = await ro<Scenario>("MATCH (s:Scenario {id:$id}) RETURN s.graph AS graph, s.base AS base, s.po AS po, s.toName AS toName", { id }, META);
  if (!s) throw new Error("Unknown scenario");
  await copyGraph(s.graph, s.base);
  await q(
    `MATCH (k:Person {id:'kshitij'}), (po:PO {id:$po})-[:MADE_BY]->(sup:Supplier)
     CREATE (k)-[:DECIDED]->(d:Decision {id:'d-' + $id, text:'Moved ' + $po + ' to ' + sup.name + ' (scenario ' + $id + ')', at:$at, by:'Kshitij'})-[:ABOUT]->(po),
            (d)-[:ABOUT]->(sup)`,
    { id, po: s.po, at: new Date().toISOString() },
    s.base,
  );
  await deleteGraph(s.graph);
  await q("MATCH (s:Scenario {id:$id}) SET s.status = 'applied'", { id }, META);
}

export async function discardScenario(id: string) {
  const [s] = await ro<{ graph: string }>("MATCH (s:Scenario {id:$id}) RETURN s.graph AS graph", { id }, META);
  if (s) await deleteGraph(s.graph);
  await q("MATCH (s:Scenario {id:$id}) SET s.status = 'discarded'", { id }, META);
}
