import Link from "next/link";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import "../welcome/welcome.css";

export const metadata = { title: "Sign in · Weft" };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="lp" style={{ display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 18 }}>
        <Link href="/welcome" className="lp-logo"><i>W</i>Weft</Link>
        <div className="card" style={{ padding: 28, gap: 16 }}>
          <div>
            <h1 className="h1" style={{ fontSize: 38 }}>Sign in</h1>
            <p className="lede" style={{ fontSize: 15 }}>Explore Weft with an example brand: a fitness-wear label two weeks from its next launch. You get your own private copy.</p>
          </div>
          <div style={{ background: "var(--vendor-soft)", color: "var(--fathom)", borderRadius: 12, padding: "12px 14px", fontSize: 14, lineHeight: 1.6 }}>
            <b>Demo credentials</b><br />
            Email <span className="mono">{DEMO_EMAIL}</span><br />
            Password <span className="mono">{DEMO_PASSWORD}</span>
          </div>
          <form method="post" action="/api/login" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label htmlFor="email" className="muted" style={{ fontSize: 13 }}>Email</label>
            <input id="email" name="email" type="email" className="input" defaultValue={DEMO_EMAIL} required />
            <label htmlFor="password" className="muted" style={{ fontSize: 13 }}>Password</label>
            <input id="password" name="password" type="password" className="input" defaultValue={DEMO_PASSWORD} required />
            {error === "down" && <div style={{ color: "var(--pulse)", fontSize: 13 }}>The demo database is waking up. Please try again in a minute.</div>}
            {error && error !== "down" && <div style={{ color: "var(--pulse)", fontSize: 13 }}>That isn&apos;t the demo login. Use the credentials above.</div>}
            <button className="btn fathom lg" style={{ justifyContent: "center", marginTop: 6 }}>Sign in and take the tour</button>
          </form>
        </div>
        <p className="muted" style={{ fontSize: 13, textAlign: "center" }}>You&apos;ll sign in as Kshitij, the founder. A short tour shows you around.</p>
      </div>
    </div>
  );
}
