import PlanForm from "@/components/PlanForm";
import { ro } from "@/lib/graph";
import { activeGraph, drop } from "@/lib/plan";
import { lessons } from "@/lib/planning";

export const dynamic = "force-dynamic";

export default async function Plan() {
  const g = await activeGraph();
  const [l, d, suppliers] = await Promise.all([
    lessons(),
    drop(g),
    ro<{ id: string; name: string; leadDays: number }>("MATCH (s:Supplier {type:'Factory'}) RETURN s.id AS id, s.name AS name, s.leadDays AS leadDays ORDER BY s.name", {}, g),
  ]);
  const launch = new Date(Date.parse(d.today) + 45 * 86_400_000).toISOString().slice(0, 10);

  return (
    <>
      <div>
        <div className="muted" style={{ fontSize: 13 }}>Collections</div>
        <h1 className="h1" style={{ fontSize: 44, marginTop: 6 }}>Plan the next collection, <em>from what the last one taught.</em></h1>
        <p className="lede" style={{ fontSize: 15, maxWidth: 760 }}>
          Weft starts from the {l.from}: {l.live ? "how each size and style actually sold" : "its plan"}, what came back and why. Change anything, then create it.
          The factory orders go to your suppliers, and Shuttle schedules the check-ins.
        </p>
      </div>

      {l.live && (
        <section className="grid">
          <div className="card"><div className="card-head"><h2>Size split that sold</h2></div><div className="mono" style={{ fontSize: 22 }}>S {l.split.S}% · M {l.split.M}% · L {l.split.L}%</div><div className="muted" style={{ fontSize: 13 }}>Used for the new size split below.</div></div>
          <div className="card"><div className="card-head"><h2>Sold out</h2></div>{l.soldOut.length ? l.soldOut.map((x) => <div key={x} style={{ fontSize: 14 }}>{x}</div>) : <div className="muted">Nothing sold out.</div>}</div>
          <div className="card"><div className="card-head"><h2>Came back</h2></div>
            {l.styles.filter((s) => s.returns).map((s) => <div key={s.id} style={{ fontSize: 14 }}><b>{s.name}</b>: {s.returns} returns, &ldquo;{s.reason}&rdquo;{s.note ? <span className="muted"> · fit note: {s.note}</span> : null}</div>)}
          </div>
        </section>
      )}

      <PlanForm lessons={l} suppliers={suppliers} today={d.today} launch={launch} />
    </>
  );
}
