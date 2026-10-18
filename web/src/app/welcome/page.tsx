import Link from "next/link";
import "./welcome.css";

export const metadata = { title: "Weft · run your brand from one place" };

const REPO = "https://github.com/KshitijBhardwaj18/weft";

export default function Welcome() {
  return (
    <div className="lp">
      <div className="lp-wrap">
        <header className="lp-nav">
          <Link href="/welcome" className="lp-logo"><i>W</i>Weft</Link>
          <nav>
            <a href="#demo" className="hide">Watch the demo</a>
            <a href={REPO} className="hide">GitHub</a>
            <Link href="/login" className="btn fathom">Try it</Link>
          </nav>
        </header>

        <section className="lp-hero">
          <div className="lp-eyebrow">For brands that make and sell their own products</div>
          <h1 className="lp-h1">Run your brand from <em>one place.</em></h1>
          <p className="lp-dek">Weft keeps every product, factory order, sale and decision in one live plan. AI teammates keep it up to date and tell you what needs you.</p>
          <div className="lp-cta">
            <Link href="/login" className="btn fathom lg">Try the live demo →</Link>
            <a href="#demo" className="btn ghost lg">Watch the 4-minute demo</a>
          </div>
          <div className="lp-shot">{/* eslint-disable-next-line @next/next/no-img-element -- a static screenshot; Workers has no image optimizer */}<img src="/screens/today-live.png" alt="Weft's Today screen: sales, restocks and the calls that need you" /></div>
        </section>
      </div>

      <section className="lp-sec">
        <div className="lp-wrap">
          <h2 className="lp-h2">Today, a brand runs on <em>chats and spreadsheets.</em></h2>
          <div className="lp-three">
            <div className="lp-card bad"><div className="n">01</div><h3>A factory is late, and nobody notices.</h3><p>The message is lost in a group chat, while the launch date is already promised to customers.</p></div>
            <div className="lp-card bad"><div className="n">02</div><h3>A best-seller runs out.</h3><p>Nobody reorders in time, so customers find an empty shelf for weeks.</p></div>
            <div className="lp-card bad"><div className="n">03</div><h3>Nobody remembers why.</h3><p>Decisions live in chats and in people&apos;s heads, so they get lost.</p></div>
          </div>
        </div>
      </section>

      <section className="lp-sec" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <h2 className="lp-h2">Weft puts it all in <em>one live plan.</em></h2>
          <div className="lp-three">
            <div className="lp-card"><div className="n">01</div><h3>Everything in one place</h3><p>Products, factories, orders, stock, sales and every decision, all connected.</p></div>
            <div className="lp-card"><div className="n">02</div><h3>AI teammates keep it current</h3><p>They check in with factories, watch sales, draft reorders and write your morning brief.</p></div>
            <div className="lp-card"><div className="n">03</div><h3>You make the calls</h3><p>See what a change breaks, try it safely on a copy, then apply it with one click.</p></div>
          </div>
          <p className="lp-note">Built on a FalkorDB graph, so Weft can follow every connection: from one late factory order to every launch post that promised its date.</p>
        </div>
      </section>

      <section id="demo" className="lp-sec" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <h2 className="lp-h2">See it in action</h2>
          <div className="lp-video"><video controls preload="metadata" poster="/screens/today-live.png" src="/weft-demo.mp4" /></div>
        </div>
      </section>

      <div className="lp-wrap">
        <div className="lp-final">
          <h2>Try it with a real example brand.</h2>
          <Link href="/login" className="btn cream lg">Open the live demo →</Link>
        </div>
        <footer className="lp-foot">
          <span>Weft · built for FalkorDB Graph Hacks</span>
          <a href={REPO}>GitHub</a>
        </footer>
      </div>
    </div>
  );
}
