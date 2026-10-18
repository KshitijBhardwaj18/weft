import { q } from "@/lib/graph";
import { activeGraph } from "@/lib/plan";

// Goods receipt: the PO arrives and its quantity goes onto stock, split evenly across the SKUs it supplies.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await activeGraph();
  const [po] = await q<{ stage: string }>("MATCH (po:PO {id:$id}) RETURN po.stage AS stage", { id }, g);
  if (!po) return Response.json({ error: "Unknown PO" }, { status: 404 });
  if (po.stage === "Received") return Response.json({ error: "Already received" }, { status: 409 });
  await q(
    `MATCH (po:PO {id:$id})-[:SUPPLIES]->(k:SKU)
     WITH po, collect(k) AS ks
     UNWIND ks AS k
     SET k.onHand = coalesce(k.onHand, 0) + toInteger(round(toFloat(po.qty) / size(ks)))
     WITH DISTINCT po
     SET po.stage = 'Received', po.status = 'received'`,
    { id },
    g,
  );
  return Response.json({ ok: true });
}
