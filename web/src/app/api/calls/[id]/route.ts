import { after } from "next/server";
import { q } from "@/lib/graph";
import { notifySupplier } from "@/lib/integrations/notify";
import { canDecide } from "@/lib/roles";
import { activeGraph, drop, restocks } from "@/lib/plan";

// An Owner/Manager decides on a call. Applying writes the decision into the plan.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action } = (await req.json()) as { action: "apply" | "ignore" };
  if (!(await canDecide())) return Response.json({ error: "Waiting for an Owner or Manager." }, { status: 403 });
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
    const today = (await drop(g)).today;
    const eta = new Date(Date.parse(today) + (r?.leadDays ?? 14) * 86_400_000).toISOString().slice(0, 10);
    const [{ next }] = await q<{ next: number }>("MATCH (po:PO) RETURN coalesce(max(toInteger(substring(po.id, 3))), 0) + 1 AS next", {}, g);
    const poId = `PO-${String(next).padStart(3, "0")}`;
    // Price: what this SKU's latest PO was priced at. The supplier can change it on the PO later.
    const [last] = await q<{ unitPrice: number }>("MATCH (po:PO)-[:SUPPLIES]->(k:SKU {id:$sku}) RETURN po.unitPrice AS unitPrice ORDER BY po.id DESC LIMIT 1", { sku: call.about ?? "" }, g);
    await q(
      `MATCH (c:Call {id:$id})-[:ABOUT]->(k:SKU), (sup:Supplier {name:$supplier}), (owner:Person {id:'rohan'})
       SET c.status = 'applied'
       CREATE (po:PO {id:$poId, qty:$qty, unitPrice:$unitPrice, eta:$eta, stage:'Fabric', status:'sent'})-[:SUPPLIES]->(k),
              (po)-[:MADE_BY]->(sup), (owner)-[:OWNS]->(po),
              (owner)-[:DECIDED]->(:Decision {id:'d-' + $id, text:'Approved restock ' + $poId + ' for ' + k.id, at:$at, by:'Rohan'})-[:ABOUT]->(po)`,
      { id, poId, supplier: r?.supplier ?? "Kavya Garments", qty: r?.qty ?? 340, unitPrice: last?.unitPrice ?? 0, eta, at: new Date().toISOString() },
      g,
    );
    const [sup] = await q<{ id: string }>("MATCH (:PO {id:$poId})-[:MADE_BY]->(s:Supplier) RETURN s.id AS id", { poId }, g);
    if (sup) after(() => notifySupplier(sup.id, { kind: "po", poId }));
  } else if (call.kind === "followup") {
    await q("MATCH (c:Call {id:$id})-[:ABOUT]->(ci:CheckIn) SET c.status = 'applied', ci.status = 'chased'", { id }, g);
    const [ci] = await q<{ ci: string; sid: string }>("MATCH (c:Call {id:$id})-[:ABOUT]->(ci:CheckIn)-[:ASKED]->(s:Supplier) RETURN ci.id AS ci, s.id AS sid", { id }, g);
    if (ci) after(() => notifySupplier(ci.sid, { kind: "checkin", checkInId: ci.ci }));
  } else {
    await q("MATCH (c:Call {id:$id}) SET c.status = 'applied'", { id }, g);
  }
  return Response.json({ ok: true });
}
