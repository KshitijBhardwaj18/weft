import { q } from "@/lib/graph";
import { activeGraph, restocks } from "@/lib/plan";

// An Owner/Manager decides on a call. Applying writes the decision into the plan.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action } = (await req.json()) as { action: "apply" | "ignore" };
  const g = await activeGraph();
  const [call] = await q<{ kind: string; newEta: string | null; about: string | null }>(
    "MATCH (c:Call {id:$id}) OPTIONAL MATCH (c)-[:ABOUT]->(a) RETURN c.kind AS kind, c.newEta AS newEta, a.id AS about",
    { id },
    g,
  );
  if (!call) return Response.json({ error: "Unknown call" }, { status: 404 });

  if (action === "ignore") {
    await q("MATCH (c:Call {id:$id}) SET c.status = 'ignored'", { id }, g);
    return Response.json({ ok: true });
  }

  if (call.kind === "delay" && call.newEta) {
    await q(
      `MATCH (c:Call {id:$id})-[:ABOUT]->(po:PO), (k:Person {id:'kshitij'})
       SET po.eta = c.newEta, po.status = 'delayed', c.status = 'applied'
       CREATE (k)-[:DECIDED]->(:Decision {id:'d-' + $id, text:'Accepted the new date for ' + po.id, at:$at, by:'Kshitij'})-[:ABOUT]->(po)`,
      { id, at: new Date().toISOString() },
      g,
    );
  } else if (call.kind === "restock") {
    const r = (await restocks(10)).find((x) => x.id === call.about);
    await q(
      `MATCH (c:Call {id:$id})-[:ABOUT]->(k:SKU), (sup:Supplier {name:$supplier}), (owner:Person {id:'rohan'})
       SET c.status = 'applied'
       CREATE (po:PO {id:'PO-022', qty:$qty, unitPrice:420, eta:'2026-12-24', stage:'Fabric', status:'sent'})-[:SUPPLIES]->(k),
              (po)-[:MADE_BY]->(sup), (owner)-[:OWNS]->(po),
              (owner)-[:DECIDED]->(:Decision {id:'d-' + $id, text:'Approved restock PO-022 for ' + k.id, at:$at, by:'Rohan'})-[:ABOUT]->(po)`,
      { id, supplier: r?.supplier ?? "Sri Lakshmi Knits", qty: r?.qty ?? 250, at: new Date().toISOString() },
      g,
    );
  } else if (call.kind === "followup") {
    await q("MATCH (c:Call {id:$id})-[:ABOUT]->(ci:CheckIn) SET c.status = 'applied', ci.status = 'chased'", { id }, g);
  } else {
    await q("MATCH (c:Call {id:$id}) SET c.status = 'applied'", { id }, g);
  }
  return Response.json({ ok: true });
}
