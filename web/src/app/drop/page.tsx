import Link from "next/link";
import { ro } from "@/lib/graph";
import { activeGraph, drop, drops, phase } from "@/lib/plan";

export const dynamic = "force-dynamic";

type Row = { id: string; code: string; style: string; colour: string; size: string; planned: number; sold: number; onHand: number; returns: number; reason: string | null; po: string; supplier: string; eta: string; note: string | null };

export default async function DropPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const g = await activeGraph();
  const [d, p, all] = await Promise.all([drop(g, id), phase(), drops()]);
  // One row per SKU. A restock adds a second PO to a SKU, so show the latest PO for it.
  const rows = await ro<Row>(
    `MATCH (k:SKU)-[:OF_STYLE]->(s:Style)-[:IN_DROP]->(:Drop {id:$drop}), (po:PO)-[:SUPPLIES]->(k)
     WITH k, s, max(po.id) AS poId
     MATCH (po:PO {id: poId})-[:MADE_BY]->(sup:Supplier)
     OPTIONAL MATCH (s)-[:HAS_SAMPLE]->(sm:Sample {kind:'Fit'})
     RETURN k.id AS id, k.code AS code, s.name AS style, k.colour AS colour, k.size AS size, k.planned AS planned,
            k.sold AS sold, k.onHand AS onHand, k.returns AS returns, k.returnReason AS reason,
            po.id AS po, sup.name AS supplier, po.eta AS eta, sm.note AS note
     ORDER BY style, colour, size DESC`,
    { drop: d.id },
    g,
  );
  const planning = d.status === "planning";
  const live = p === "live" && !planning;
  const styles = new Set(rows.map((r) => r.style)).size;

  return (
    <>
      <div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className={`pill ${live ? "ok" : "risk"}`}><span className="dot" />{planning ? "Planning" : live ? "Live" : "Countdown"}</span>
          <span className="row" style={{ gap: 6 }}>
            {all.map((x) => <Link key={x.id} href={`/drop?id=${x.id}`} className={`chip ${x.id === d.id ? "drop" : "msg"}`}>{x.name}</Link>)}
            <Link href="/plan" className="btn fathom sm">Plan a collection</Link>
          </span>
        </div>
        <h1 className="h1" style={{ fontSize: 44, marginTop: 10 }}>{d.name}</h1>
        <p className="lede" style={{ fontSize: 15 }}>
          Goes live {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {styles} styles · {rows.length} SKUs ·{" "}
          {rows.reduce((a, r) => a + r.planned, 0).toLocaleString("en-IN")} units. Each row is one SKU&apos;s lifeline: made → stock → sold → returned.
        </p>
      </div>

      <section id="sales" style={{ border: "1px solid var(--line)", borderRadius: 20, overflowX: "auto" }}>
        <table className="cmp" style={{ minWidth: 980, fontSize: 13 }}>
          <thead>
            <tr className="muted">
              <th>SKU</th><th>Made by</th><th>Planned</th><th>Sold</th><th>Sell-through</th><th>On hand</th><th>Returns</th><th>Fit sample note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pct = Math.round((100 * r.sold) / r.planned);
              return (
                <tr key={r.id}>
                  <td><b style={{ fontWeight: 600 }}>{r.style.split(" ").pop()} · {r.colour} · {r.size}</b><br /><span className="mono muted" style={{ fontSize: 11 }}>{r.code}</span></td>
                  <td><span className="mono">{r.po}</span><br /><span className="muted">{r.supplier}</span></td>
                  <td className="mono">{r.planned}</td>
                  <td className="mono">{r.sold}</td>
                  <td>
                    <span style={{ display: "inline-block", width: 90, height: 8, borderRadius: 6, background: "var(--raised)", verticalAlign: "middle", overflow: "hidden" }}>
                      <span style={{ display: "block", height: 8, width: `${pct}%`, background: pct >= 100 ? "var(--pulse)" : "var(--fathom)" }} />
                    </span>{" "}
                    <span className="mono">{pct}%</span>
                  </td>
                  <td>{live && r.onHand === 0 ? <span className="badge late">Sold out</span> : <span className="mono">{r.onHand}</span>}</td>
                  <td>{r.returns ? <><span className="mono">{r.returns}</span> <span className="muted">&ldquo;{r.reason}&rdquo;</span></> : <span className="muted">—</span>}</td>
                  <td className="muted">{r.note ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
