import Link from "next/link";
import TopBar from "@/components/TopBar";
import CallCard from "@/components/CallCard";
import { creators, daysBetween, drop, drops, heatmap, openCalls, phase, pos, quietCheckIns, restocks, samplesApproved, supplierRisk, totals } from "@/lib/plan";

export const dynamic = "force-dynamic";

const inr = (n: number) => (n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`);
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function cellStyle(pct: number, soldOut: boolean): React.CSSProperties {
  if (soldOut) return { background: "#FFFFEB", color: "#7F1C34", fontWeight: 700 };
  if (pct >= 75) return { background: "#CFE6E1", color: "#034F46", fontWeight: 700 };
  if (pct >= 60) return { background: "rgba(255,255,235,0.45)", color: "#02362F" };
  if (pct >= 40) return { background: "rgba(255,255,235,0.24)" };
  return { background: "rgba(255,255,235,0.1)" };
}

export default async function Today() {
  const p = await phase();
  const d = await drop();
  const [calls, quiet, risk, everyPo, samples, all] = await Promise.all([openCalls(), quietCheckIns(), supplierRisk(), pos(), samplesApproved(), drops()]);
  const allPos = everyPo.filter((x) => x.dropId === d.id);
  const next = all.find((x) => x.status === "planning");
  const size = all.find((x) => x.id === d.id);
  const live = p === "live";
  const days = daysBetween(d.today, d.date);
  const dayOfDrop = daysBetween(d.date, d.today);

  const [t, heat, top, rs] = live ? await Promise.all([totals(), heatmap(), creators(), restocks()]) : [null, [], [], []];
  const onTrack = allPos.filter((x) => !x.pending && x.eta <= d.date).length;
  const pending = allPos.find((x) => x.pending);

  return (
    <>
      <TopBar phase={p} />

      <div>
        <h1 className="h1">Good morning, Kshitij.</h1>
        <p className="lede">
          {new Date(d.today).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })} ·{" "}
          {live ? "The Black Drop is selling faster than planned." : "Production is moving."}{" "}
          {calls.length > 0 ? <strong>{calls.length === 1 ? "One call needs you." : `${calls.length} calls need you.`}</strong> : "Nothing needs you right now."}
        </p>
      </div>

      {live && t ? (
        <section className="hero" aria-label="Black Drop, live">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: "1 1 340px" }}>
            <span className="pill ok" style={{ alignSelf: "flex-start" }}><span className="dot" />Live · day {dayOfDrop}</span>
            <div className="row" style={{ alignItems: "flex-end", gap: 18, flexWrap: "nowrap" }}>
              <span className="numeral">{Math.round((100 * t.sold) / t.planned)}%</span>
              <span className="serif" style={{ fontSize: 30, lineHeight: 1.05, letterSpacing: -0.7 }}>of the<br /><em>{d.name}</em> sold</span>
            </div>
            <div className="row" style={{ gap: 24, marginTop: 6 }}>
              <div><div className="mono" style={{ fontSize: 20 }}>{inr(t.revenue)}</div><div className="sub">revenue</div></div>
              <div><div className="mono" style={{ fontSize: 20 }}>{d.orders}</div><div className="sub">orders</div></div>
              <div><div className="mono" style={{ fontSize: 20 }}>{t.sold.toLocaleString("en-IN")} / {t.planned.toLocaleString("en-IN")}</div><div className="sub">units sold</div></div>
              <div><div className="mono" style={{ fontSize: 20 }}>{((100 * t.returns) / t.sold).toFixed(1)}%</div><div className="sub">returns</div></div>
            </div>
          </div>
          <div style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="sub" style={{ display: "flex", justifyContent: "space-between" }}><span>Sold through, by size</span><span>{size?.skus} SKUs</span></div>
            <div className="heat">
              <span /><span className="sub" style={{ textAlign: "center" }}>S</span><span className="sub" style={{ textAlign: "center" }}>M</span><span className="sub" style={{ textAlign: "center" }}>L</span>
              {heat.map((r) => [
                <span key={r.line} style={{ alignSelf: "center" }}>{r.style.split(" ").pop()} · {r.colour}</span>,
                ...r.cells.map((c) => (
                  <span key={r.line + c.size} className="cell" style={cellStyle(c.pct, c.soldOut)}>{c.soldOut ? "Sold out" : `${c.pct}%`}</span>
                )),
              ])}
            </div>
            <div className="sub">Olive tank is slow and 9 came back &ldquo;too short&rdquo;. Ask Pattern why.</div>
          </div>
        </section>
      ) : (
        <section className="hero" aria-label="Black Drop, countdown" style={{ alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: "1 1 340px" }}>
            {pending ? <span className="pill risk" style={{ alignSelf: "flex-start" }}><span className="dot" />Countdown · your call pending</span>
              : <span className="pill ok" style={{ alignSelf: "flex-start" }}><span className="dot" />Countdown · on track</span>}
            <div className="row" style={{ alignItems: "flex-end", gap: 18, flexWrap: "nowrap" }}>
              <span className="numeral">{days}</span>
              <span className="serif" style={{ fontSize: 30, lineHeight: 1.05, letterSpacing: -0.7 }}>days until<br />the <em>{d.name}</em></span>
            </div>
            <div className="sub mono" style={{ fontSize: 13 }}>Goes live {fmt(d.date)} · {size?.styles} styles · {size?.skus} SKUs · {size?.units.toLocaleString("en-IN")} units</div>
          </div>
          <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
            <div className="sub">Drop readiness</div>
            <div className="kv"><span>Factory orders on time</span><span className="mono">{onTrack} of {allPos.length}</span></div>
            <div className="kv"><span>Samples approved</span><span className="mono">{samples.approved} of {samples.styles} styles</span></div>
            <div className="kv"><span>Creators booked</span><span className="mono">3 · post 25 Nov</span></div>
            <div className="kv"><span>Suppliers gone quiet</span><span className="mono">{quiet.length}</span></div>
            <div className="row" style={{ marginTop: 6 }}>
              <Link className="btn cream" href="/production">Open production</Link>
              <Link className="btn" style={{ background: "rgba(255,255,235,0.14)" }} href="/scenarios">Try a scenario</Link>
            </div>
          </div>
        </section>
      )}

      {next && (
        <Link href={`/drop?id=${next.id}`} className="card" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "inherit" }}>
          <span><span className="muted" style={{ fontSize: 13 }}>Next collection · planning</span><br /><b style={{ fontSize: 18 }}>{next.name}</b> · launches {fmt(next.date)} · {next.styles} styles · {next.units.toLocaleString("en-IN")} units</span>
          <span className="btn ghost sm">Open →</span>
        </Link>
      )}
      <div className="grid">
        <section className="card">
          <div className="card-head"><h2>Your call</h2><span className="muted" style={{ fontSize: 13 }}>{calls.length}</span></div>
          {calls.length === 0 && <div className="muted" style={{ fontSize: 14 }}>Nothing waiting on you.</div>}
          {calls.map((c) => <CallCard key={c.id} call={c} />)}
        </section>

        {live ? (
          <section className="card">
            <div className="card-head"><h2>Restock now</h2><span className="muted" style={{ fontSize: 12 }}>by Pattern</span></div>
            {rs.map((r) => (
              <div key={r.id} className="kv" style={{ alignItems: "center" }}>
                <span><b style={{ fontWeight: 600 }}>{r.label}</b><br />
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.onHand === 0 ? "var(--pulse)" : "var(--glow-ink)" }}>{r.onHand === 0 ? "Sold out" : `${r.daysLeft.toFixed(1)} days of stock left`}</span></span>
                <span className="mono" style={{ fontSize: 13 }}>+{r.qty}</span>
              </div>
            ))}
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>Sell rate since launch × supplier lead time − stock on hand.</div>
          </section>
        ) : (
          <section className="card">
            <div className="card-head"><h2>Supply</h2><Link href="/production" style={{ fontSize: 13, fontWeight: 600 }}>Production →</Link></div>
            {quiet.map((x) => (
              <div key={x.question} className="quiet-banner"><b style={{ flexShrink: 0 }}>Gone quiet</b><span>{x.supplier}: {x.question.replace(/\?$/, "")}, due {fmt(x.due)}</span></div>
            ))}
            {allPos.map((x) => (
              <div key={x.id} className="kv"><span><span className="mono" style={{ fontSize: 13 }}>{x.id}</span> · {x.label}</span><span className="muted">{x.stage}</span></div>
            ))}
          </section>
        )}

        {live ? (
          <section className="card">
            <div className="card-head"><h2>Top creators</h2><span className="muted" style={{ fontSize: 12 }}>orders on their code</span></div>
            {top.map((c) => (
              <div key={c.handle} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 10, alignItems: "center", fontSize: 14 }}>
                <span style={{ width: 32, height: 32, borderRadius: 10, background: "var(--signal-soft)", color: "var(--signal-ink)", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{c.handle[1].toUpperCase()}</span>
                <span><b style={{ fontWeight: 600 }}>{c.handle}</b><br /><span className="muted" style={{ fontSize: 12 }}>{c.code} · {Math.round(c.repeatRate * 100)}% buy again</span></span>
                <span className="mono" style={{ fontSize: 13 }}>{Math.round((100 * c.orders) / d.orders)}%</span>
              </div>
            ))}
          </section>
        ) : null}

        <section className="card">
          <div className="card-head"><h2>Single points of failure</h2><span className="muted" style={{ fontSize: 12 }}>PageRank on the plan</span></div>
          {risk.map((r, i) => (
            <div key={r.name} className="kv" style={{ alignItems: "center" }}>
              <span><b style={{ fontWeight: 600 }}>{r.name}</b><br /><span className="muted" style={{ fontSize: 12 }}>{r.skus} SKUs depend on it</span></span>
              <span style={{ width: 90, height: 8, borderRadius: 6, background: "var(--raised)", overflow: "hidden" }}>
                <span style={{ display: "block", height: 8, width: `${Math.round((100 * r.score) / risk[0].score)}%`, background: i === 0 ? "var(--flare-ink)" : "var(--ink)" }} />
              </span>
            </div>
          ))}
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>How central each supplier is to the drop&apos;s graph: the higher, the more a slip there breaks.</div>
        </section>
      </div>
    </>
  );
}
