"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Trace = { why: string; query: string; rows: number; error?: string };
type Answer = { q: string; teammate?: string; answer?: string; trace?: Trace[]; ids?: string[]; error?: string };

const AV: Record<string, string> = { Weft: "av-weft", Shuttle: "av-shuttle", Pattern: "av-pattern" };

export default function AskPanel() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Answer[]>([]);
  const [why, setWhy] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onAsk = (e: Event) => {
      const d = (e as CustomEvent<{ q?: string }>).detail;
      setOpen(true);
      if (d?.q) setQ(d.q);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("weft:ask", onAsk);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("weft:ask", onAsk);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 50);
  }, [open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setQ("");
    setLog((l) => [...l, { q: question }]);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) });
      const data = await res.json();
      setLog((l) => [...l.slice(0, -1), { q: question, ...data }]);
    } catch {
      setLog((l) => [...l.slice(0, -1), { q: question, error: "Couldn't reach the team. Is the dev server running?" }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <aside className="panel" aria-label="Ask Weft">
      <div className="row" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <span className="avatar av-weft" style={{ width: 26, height: 26, fontSize: 16 }}>W</span>
        <b style={{ fontSize: 16 }}>Ask Weft</b>
        <span className="muted" style={{ fontSize: 12 }}>routes to Shuttle or Pattern · answers from the graph</span>
        <button className="btn quiet sm" style={{ marginLeft: "auto" }} onClick={() => setOpen(false)} aria-label="Close">Esc</button>
      </div>
      <div className="panel-body">
        {log.length === 0 && (
          <div className="col" style={{ minHeight: 0, background: "transparent", padding: 0 }}>
            <span className="label">Try</span>
            {["How's the Black Drop doing, and what should I do?", "Why did we pick Sri Lakshmi Knits?", "Which creator actually drives repeat buyers?", "What breaks if PO-014 slips a week?"].map((s) => (
              <button key={s} className="btn ghost" style={{ justifyContent: "flex-start", height: "auto", padding: "10px 12px", textAlign: "left" }} onClick={() => setQ(s)}>{s}</button>
            ))}
          </div>
        )}
        {log.map((a, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ alignSelf: "flex-end", background: "var(--raised)", borderRadius: 14, padding: "8px 12px", fontSize: 14, maxWidth: "85%" }}>{a.q}</div>
            {!a.answer && !a.error && <div className="muted" style={{ fontSize: 14 }}>Reading the graph…</div>}
            {a.error && <div className="quiet-banner">{a.error}</div>}
            {a.answer && (
              <div style={{ display: "flex", gap: 10 }}>
                <span className={`avatar ${AV[a.teammate ?? "Weft"]}`} style={{ width: 28, height: 28, fontSize: 16 }}>{(a.teammate ?? "W")[0]}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}><b>{a.teammate}</b> <span className="muted">{a.teammate === "Pattern" ? "Sales analyst" : a.teammate === "Shuttle" ? "Production lead" : "Chief of staff"}</span></div>
                  <div className="bubble">
                    {a.answer.split(/(\*\*[^*]+\*\*|\[[A-Za-z0-9_-]+\])/g).map((part, k) =>
                      part.startsWith("**") ? <strong key={k}>{part.slice(2, -2)}</strong>
                      : /^\[[A-Za-z0-9_-]+\]$/.test(part) ? <span key={k} className="chip po" style={{ padding: "0 6px", fontSize: 11, verticalAlign: "1px" }}>{part.slice(1, -1)}</span>
                      : part,
                    )}
                  </div>
                  <div className="row">
                    <button className="btn dawn sm" onClick={() => setWhy(why === i ? null : i)}>See why · {a.trace?.length ?? 0} queries</button>
                    {!!a.ids?.length && <Link className="btn ghost sm" href={`/map?focus=${encodeURIComponent(a.ids.join(","))}`} onClick={() => setOpen(false)}>Show on Brand map</Link>}
                  </div>
                  {why === i && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {!!a.ids?.length && <div className="row">{a.ids.map((id) => <span key={id} className="chip po">{id}</span>)}</div>}
                      {a.trace?.map((t, j) => (
                        <div key={j} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ fontSize: 12 }} className="muted">{j + 1}. {t.why} · {t.error ? "error" : `${t.rows} rows`}</div>
                          <pre className="query">{t.query}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="row" style={{ padding: 14, borderTop: "1px solid var(--line)", flexWrap: "nowrap" }}>
        <label htmlFor="ask-input" style={{ position: "absolute", left: -9999 }}>Ask Weft</label>
        <input id="ask-input" ref={input} className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about your drop…" />
        <button className="btn lg" disabled={busy || !q.trim()}>{busy ? "…" : "Ask"}</button>
      </form>
    </aside>
  );
}
