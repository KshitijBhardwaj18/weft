import Link from "next/link";
import "./welcome.css";

export const metadata = { title: "Weft · one live plan for a D2C brand, from planning to restock" };

const REPO = "https://github.com/KshitijBhardwaj18/weft";

export default function Welcome() {
  return (
    <div className="lp">
      <div className="lp-wrap">
        <header className="lp-nav">
          <Link href="/welcome" className="lp-logo"><i>W</i>Weft</Link>
          <nav>
            <a href="#problem">Problem</a>
            <a href="#loop">The loop</a>
            <a href="#falkordb">FalkorDB</a>
            <a href="#demo">Demo</a>
            <a href={REPO}>GitHub</a>
            <Link href="/login" className="btn fathom">Open the live demo</Link>
          </nav>
        </header>

        <section className="lp-hero">
          <div>
            <div className="lp-eyebrow">For D2C brands · built on FalkorDB</div>
            <h1 className="lp-h1">One live plan, from <em>planning</em> to restock.</h1>
            <p className="lp-dek">A D2C product is planned, made, sold and restocked, and every stage lives in a different tool. Weft keeps one live plan per drop on a FalkorDB graph, with AI teammates that chase the updates and show what every change breaks.</p>
            <div className="lp-cta">
              <Link href="/login" className="btn fathom lg">Open the live demo →</Link>
              <a href="#demo" className="btn ghost lg">Watch the demo (3½ min)</a>
            </div>
            <div className="lp-meta">Demo login is on the next screen. Case study: the Black Drop, a fitness-wear collection.</div>
          </div>
          <div className="lp-hero-card">
            <div className="lp-eyebrow" style={{ color: "var(--fathom-ink)" }}>Black Drop · Live, day 9</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 10 }}>
              <span className="big">62%</span><span className="lbl">of 2,100<br />units sold</span>
            </div>
            <div className="lp-heat">
              <span>87%</span><span className="hot">Sold out</span><span>80%</span>
              <span>55%</span><span>62%</span><span>50%</span>
            </div>
            <div className="lp-call"><b>Pattern drafted a restock.</b> Black leggings M sold out on day 4. Reorder 340 from Kavya Garments on a 10-day lead time. <i>Approve PO</i></div>
            <div className="lp-call" style={{ borderColor: "#D8452A" }}><b style={{ color: "var(--pulse)" }}>Shuttle: fabric for PO-014 is late.</b> Lands 5 Dec, after the 1 Dec drop. Breaks 3 creator posts. <i>Try a scenario</i></div>
          </div>
        </section>
      </div>

      <section id="problem" className="lp-sec">
        <div className="lp-wrap">
          <div className="lp-eyebrow">The problem</div>
          <h2 className="lp-h2">Every tool sees one stage. The founder is the <em>router</em> between them.</h2>
          <p className="lp-p">Small D2C brands of 5 to 30 people run their products across four disconnected places. The failures happen at the joins, and stay invisible until a customer or a creator notices.</p>
          <div className="lp-grid4">
            <div className="lp-tool"><div className="k">Plan</div><div className="t">Spreadsheet</div><div className="d">Styles, SKUs and units. Sample approvals live in a chat.</div></div>
            <div className="lp-tool"><div className="k">Make</div><div className="t">WhatsApp</div><div className="d">A dozen factory groups. A delay is a message, not a fact.</div></div>
            <div className="lp-tool"><div className="k">Sell</div><div className="t">Shopify</div><div className="d">Orders, refunds, discount codes. Blind to production.</div></div>
            <div className="lp-tool"><div className="k">Restock</div><div className="t">Memory</div><div className="d">The founder guesses when to reorder, and how much.</div></div>
          </div>
          <div className="lp-fail">
            <div><b>The fabric is late</b>Buried in a chat, while three creators promise &ldquo;live 1 Dec&rdquo;.</div>
            <div><b>Size M sells out on day 4</b>The reorder waits a week, because nobody checked lead time.</div>
            <div><b>The restock lands</b>The stock count is still wrong, so the next reorder is wrong too.</div>
          </div>
        </div>
      </section>

      <section id="loop" className="lp-sec">
        <div className="lp-wrap">
          <div className="lp-eyebrow">The solution</div>
          <h2 className="lp-h2">One graph for the <em>whole loop</em>. A change anywhere shows what it breaks everywhere.</h2>
          <div className="lp-loop">
            <div className="lp-stage"><div className="t">Plan</div><div className="d">Drop, styles, SKUs, samples and creators as connected nodes.</div></div>
            <div className="lp-stage on"><div className="t">Make</div><div className="d">Shuttle checks in with suppliers before dates are due.</div></div>
            <div className="lp-stage"><div className="t">Launch</div><div className="d">Every post and PO tied to the drop date.</div></div>
            <div className="lp-stage on"><div className="t">Sell</div><div className="d">Shopify orders, refunds and creator codes on the graph.</div></div>
            <div className="lp-stage"><div className="t">Restock</div><div className="d">Pattern drafts reorders; approve, receive, stock goes up.</div></div>
            <div className="lp-stage"><div className="t">Learn</div><div className="d">Every decision kept with its source and its reason.</div></div>
          </div>
          <div className="lp-flow">
            <div className="lp-box"><h3>Sources in</h3><ul><li>Shopify orders, refunds, inventory (HMAC-verified webhooks)</li><li>Supplier check-ins: app, email (Resend), WhatsApp</li><li>Team and supplier chat</li><li>Creator discount codes</li></ul></div>
            <div className="arr">→</div>
            <div className="lp-box graph"><h3>FalkorDB graph</h3><ul><li>One live plan per drop</li><li>Scenarios as GRAPH.COPY copies</li><li>Messages, calls and decisions link back to their source</li><li>Snapshot for Live, settings in their own graph</li></ul></div>
            <div className="arr">→</div>
            <div className="lp-box"><h3>Teammates out</h3><ul><li>Read the graph with read-only Cypher</li><li>Raise calls with their impact attached</li><li>An Owner or Manager decides</li><li>See why shows every query behind an answer</li></ul></div>
          </div>
          <div className="lp-mates">
            <div className="lp-mate" style={{ background: "var(--dawn)", color: "var(--dawn-ink)" }}><div className="r">Chief of staff</div><div className="n">Weft</div><p>Answers anything about the drop, routes questions, writes the morning brief.</p></div>
            <div className="lp-mate" style={{ background: "var(--vendor-soft)", color: "var(--fathom)" }}><div className="r">Production lead</div><div className="n">Shuttle</div><p>Check-ins, follow-ups, delay impact, and plan updates read from supplier chat.</p></div>
            <div className="lp-mate" style={{ background: "var(--glow-soft)", color: "var(--glow-ink)" }}><div className="r">Sales analyst</div><div className="n">Pattern</div><p>Sell-through, sell-outs, restock drafts, returns and creator attribution.</p></div>
          </div>
        </div>
      </section>

      <section id="falkordb" className="lp-sec">
        <div className="lp-wrap">
          <div className="lp-eyebrow">Why a graph, and why FalkorDB</div>
          <h2 className="lp-h2">&ldquo;Which creator posts break if PO-014 is late?&rdquo; is a <em>walk</em>, not a lookup.</h2>
          <p className="lp-p">The questions that matter are about connections. In Weft the walk is the query, and the same walk runs inside every step a teammate takes.</p>
          <div className="lp-feat">
            <div><code>Multi-hop Cypher</code><span>Delay impact: PO → SKU → Style → Drop ← CreatorPost ← Creator, in one query.</span></div>
            <div><code>GRAPH.COPY</code><span>Every scenario is a full private copy of the plan. Apply copies it back and records the decision.</span></div>
            <div><code>Many graphs, one instance</code><span>weft (the plan), weft_live (day 9), weft_meta (settings), weft_scn_* (scenarios).</span></div>
            <div><code>algo.pageRank</code><span>Ranks suppliers over MADE_BY edges to surface single points of failure.</span></div>
            <div><code>Full-text + range indexes</code><span>Brand map search across SKUs, styles, suppliers, POs and creators; id lookups everywhere.</span></div>
            <div><code>GRAPH.RO_QUERY</code><span>Every teammate tool call is read-only Cypher, listed under See why next to the answer.</span></div>
          </div>
        </div>
      </section>

      <section id="demo" className="lp-sec">
        <div className="lp-wrap">
          <div className="lp-eyebrow">Demo</div>
          <h2 className="lp-h2">Watch it, then <em>try it</em>.</h2>
          <div className="lp-video"><video controls preload="metadata" src="/weft-demo.mp4" /></div>
          <div className="lp-final">
            <h2>Walk the Black Drop yourself: a delay, a scenario, a sell-out and a restock.</h2>
            <Link href="/login" className="btn cream lg">Open the live demo →</Link>
          </div>
        </div>
      </section>

      <footer className="lp-wrap lp-foot">
        <span>Weft · built for FalkorDB Graph Hacks</span>
        <a href={REPO}>github.com/KshitijBhardwaj18/weft</a>
      </footer>
    </div>
  );
}
