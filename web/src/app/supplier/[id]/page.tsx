import { notFound } from "next/navigation";
import CheckInCard from "@/components/CheckInCard";
import { ro } from "@/lib/graph";
import { activeGraph, checkInsFor, pos } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function SupplierChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await activeGraph();
  const [sup] = await ro<{ name: string; type: string; city: string; leadDays: number; contact: string }>(
    "MATCH (s:Supplier {id:$id}) RETURN s.name AS name, s.type AS type, s.city AS city, s.leadDays AS leadDays, s.contact AS contact",
    { id },
    g,
  );
  if (!sup) notFound();
  const [cis, all] = await Promise.all([checkInsFor(id), pos(g)]);
  const mine = all.filter((p) => p.supplierId === id);

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="row" style={{ gap: 8 }}><span className="sq" style={{ width: 10, height: 10 }} /><h1 style={{ fontSize: 22, fontWeight: 600 }}>{sup.name}</h1></div>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 14 }}>
            Supplier chat · {sup.type}, {sup.city} · {sup.leadDays}-day lead time · {sup.contact} is a guest and sees only this chat
          </p>
        </div>
        <span className="chip vendor">Supplier view</span>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span className="label">Purchase orders</span>
        <div className="grid">
          {mine.map((p) => (
            <div key={p.id} className="card">
              <div className="card-head"><span className="mono" style={{ fontWeight: 500 }}>{p.id}</span><span className="badge ok">{p.status}</span></div>
              <div style={{ fontWeight: 600 }}>{p.label} · {p.qty} pcs</div>
              <div className="row mono" style={{ fontSize: 13, gap: 16 }}>
                <span>₹{p.unitPrice}/pc</span><span>₹{(p.qty * p.unitPrice).toLocaleString("en-IN")}</span><span>due {new Date(p.eta).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
              <div className="muted" style={{ fontSize: 13 }}>Stage: {p.stage}</div>
            </div>
          ))}
        </div>
      </section>

      {cis.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="label">Check-ins from Shuttle</span>
          {cis.map((c) => <CheckInCard key={c.id} ci={c} />)}
        </section>
      )}
    </>
  );
}
