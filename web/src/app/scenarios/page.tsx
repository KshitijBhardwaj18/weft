import { ro } from "@/lib/graph";
import { activeGraph, drop, pos } from "@/lib/plan";
import { listScenarios, sideOf } from "@/lib/scenarios";
import { ApplyDiscard, NewScenario } from "@/components/ScenarioActions";

export const dynamic = "force-dynamic";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function Scenarios({ searchParams }: { searchParams: Promise<{ po?: string }> }) {
  const { po: wanted } = await searchParams;
  const base = await activeGraph();
  const [all, suppliers, list, d] = await Promise.all([
    pos(base),
    ro<{ id: string; name: string; leadDays: number }>("MATCH (s:Supplier) RETURN s.id AS id, s.name AS name, s.leadDays AS leadDays", {}, base),
    listScenarios(),
    drop(base),
  ]);
  const open = list.find((s) => s.base === base);
  const compare = open ? await Promise.all([sideOf(base, open.po, true), sideOf(open.graph, open.po, false)]) : null;

  return (
    <>
      <div>
        <div className="muted" style={{ fontSize: 13 }}>Scenarios</div>
        <h1 className="h1" style={{ fontSize: 44, marginTop: 6 }}>
          {open ? <>What if {open.po} moves to <em>{open.toName}</em>?</> : <>Test a change <em>before</em> you make it.</>}
        </h1>
        <p className="lede" style={{ fontSize: 15 }}>A private copy of your plan. Nothing here reaches Production, your suppliers or Today until you apply it.</p>
      </div>

      {!open && <NewScenario pos={all.map((p) => ({ id: p.id, label: p.label, supplierId: p.supplierId }))} suppliers={suppliers} defaultPo={wanted ?? "PO-014"} />}

      {open && compare && (
        <>
          <div className="row">
            <span className="muted" style={{ fontSize: 13 }}>Changes in this scenario</span>
            <span className="chip po">{open.po}: {compare[0].supplier} → {open.toName}</span>
            <span className="chip vendor">lands {fmt(compare[1].eta)}</span>
            <span className="chip po">+₹20 per piece</span>
            <span className="chip msg mono">graph: {open.graph}</span>
          </div>

          <section style={{ border: "1px solid var(--line)", borderRadius: 20, overflowX: "auto" }}>
            <table className="cmp" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ width: "30%" }} />
                  <th style={{ background: "var(--surface-2)" }}>Reality <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>with the supplier&apos;s delay</span></th>
                  <th style={{ background: "var(--dawn-soft)", color: "var(--dawn-ink)" }}>This scenario</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th style={{ fontWeight: 500 }}>{open.po} arrives</th>
                  <td style={{ background: "var(--surface-2)" }}><span className="mono">{fmt(compare[0].eta)}</span> {compare[0].lateDays > 0 ? <span className="badge late">{compare[0].lateDays} days late</span> : <span className="badge ok">on time</span>}</td>
                  <td style={{ background: "var(--dawn-soft)" }}><span className="mono">{fmt(compare[1].eta)}</span> {compare[1].lateDays > 0 ? <span className="badge late">{compare[1].lateDays} days late</span> : <span className="badge ok">{Math.abs(Math.round((Date.parse(d.date) - Date.parse(compare[1].eta)) / 86400000))} days spare</span>}</td>
                </tr>
                <tr>
                  <th style={{ fontWeight: 500 }}>{d.name}, {fmt(d.date)}</th>
                  <td style={{ background: "var(--surface-2)" }}>{compare[0].dropOnTime ? <span className="badge ok">On time</span> : <span className="badge late">Late</span>}</td>
                  <td style={{ background: "var(--dawn-soft)" }}>{compare[1].dropOnTime ? <span className="badge ok">On time</span> : <span className="badge late">Late</span>}</td>
                </tr>
                <tr>
                  <th style={{ fontWeight: 500 }}>Creator posts announcing &ldquo;live {fmt(d.date)}&rdquo;</th>
                  <td style={{ background: "var(--surface-2)" }}>{compare[0].brokenPosts ? `${compare[0].brokenPosts} broken` : "All kept"}</td>
                  <td style={{ background: "var(--dawn-soft)" }}>{compare[1].brokenPosts ? `${compare[1].brokenPosts} broken` : "All kept"}</td>
                </tr>
                <tr>
                  <th style={{ fontWeight: 500 }}>{open.po} cost</th>
                  <td style={{ background: "var(--surface-2)" }} className="mono">{inr(compare[0].cost)}</td>
                  <td style={{ background: "var(--dawn-soft)" }} className="mono">{inr(compare[1].cost)} <span style={{ fontFamily: "var(--sans)", color: "var(--glow-ink)", fontWeight: 600, fontSize: 13 }}>+{inr(compare[1].cost - compare[0].cost)}</span></td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="card" style={{ maxWidth: 760 }}>
            <h2>What applying does</h2>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              1. {open.po} moves to {open.toName}, due {fmt(compare[1].eta)}; Production updates.<br />
              2. The fabric-delay call closes and the decision is recorded (who, when, which scenario).<br />
              3. The scenario graph <span className="mono">{open.graph}</span> is copied over the plan, then deleted.
            </div>
            <ApplyDiscard id={open.id} />
          </div>
        </>
      )}
    </>
  );
}
