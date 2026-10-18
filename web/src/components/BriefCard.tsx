"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Brief } from "@/lib/brief";

// Bullets only: drop any title line, markdown emphasis and the [id] citations (they're under See why).
const lines = (text: string) =>
  text.split("\n").map((l) => l.replace(/\*\*/g, "").replace(/\s*\[[A-Za-z0-9_-]+\]/g, "").trim())
    .filter((l) => /^([-•*]|\d+\.)\s/.test(l)).map((l) => l.replace(/^([-•*]|\d+\.)\s+/, ""));

// Weft's morning brief. Written on first view of the day (a teammate run), then cached.
export default function BriefCard({ day }: { day: string }) {
  const [b, setB] = useState<Brief | null>(null);
  const [err, setErr] = useState("");
  const [why, setWhy] = useState(false);
  useEffect(() => {
    setB(null); setErr("");
    fetch("/api/brief").then(async (r) => { const j = await r.json(); if (r.ok) setB(j); else setErr(j.error ?? "Couldn't write the brief."); }).catch(() => setErr("Couldn't write the brief."));
  }, [day]);

  return (
    <section className="card" style={{ gap: 10 }}>
      <div className="card-head"><h2 className="row" style={{ gap: 8 }}><span className="avatar av-weft">W</span>Morning brief</h2><span className="muted" style={{ fontSize: 12 }}>by Weft, from the live plan</span></div>
      {!b && !err && <div className="muted" style={{ fontSize: 14 }}>Weft is reading the plan and writing today&apos;s brief…</div>}
      {err && <div className="muted" style={{ fontSize: 14 }}>{err}</div>}
      {b && (
        <>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.55, display: "flex", flexDirection: "column", gap: 6 }}>
            {lines(b.text).map((l, i) => <li key={i}>{l}</li>)}
          </ul>
          <div className="row" style={{ gap: 6 }}>
            {!!b.trace.length && <button className="btn dawn sm" onClick={() => setWhy(!why)}>See why · {b.trace.length} queries</button>}
            {!!b.ids.length && <Link className="btn ghost sm" href={`/map?focus=${encodeURIComponent(b.ids.join(","))}`}>Show on Brand map</Link>}
          </div>
          {why && b.trace.map((t, i) => <pre key={i} className="mono" style={{ fontSize: 12, background: "var(--ink)", color: "#EDEDE6", padding: 10, borderRadius: 10, whiteSpace: "pre-wrap", margin: 0 }}>{`// ${t.why} · ${t.rows} rows\n${t.query}`}</pre>)}
        </>
      )}
    </section>
  );
}
