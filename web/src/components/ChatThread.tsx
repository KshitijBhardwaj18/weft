"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Msg = { id: string; channel: string; author: string; authorKind: string; text: string; at: string; card: string | null };
type Card = { type?: string; teamOnly?: boolean; trace?: { why: string; query: string; rows: number; error?: string }[]; ids?: string[]; evidence?: string; po?: string };

const AV: Record<string, string> = { Weft: "av-weft", Shuttle: "av-shuttle", Pattern: "av-pattern" };
const time = (iso: string) => {
  const d = new Date(iso);
  return isNaN(+d) ? "" : d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
};
const parse = (c: string | null): Card => {
  try { return c ? JSON.parse(c) : {}; } catch { return {}; }
};

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\[[A-Za-z0-9_-]+\])/g).map((part, k) =>
        part.startsWith("**") ? <strong key={k}>{part.slice(2, -2)}</strong>
        : /^\[[A-Za-z0-9_-]+\]$/.test(part) ? <span key={k} className="chip po" style={{ padding: "0 6px", fontSize: 11, verticalAlign: "1px" }}>{part.slice(1, -1)}</span>
        : part,
      )}
    </>
  );
}

export default function ChatThread({ channel, initial, viewer = "team", placeholder, waitsForTeammate = false }: {
  channel: string; initial: Msg[]; viewer?: "team" | "supplier"; placeholder: string; waitsForTeammate?: boolean;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Polling, not a socket: on Workers every request may land on a different isolate. Faster while a teammate is answering.
  const seen = useRef(new Set(initial.map((m) => m.id)));
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const res = await fetch(`/api/chat/${channel}`, { cache: "no-store" }).catch(() => null);
      if (!alive || !res?.ok) return;
      const fresh = ((await res.json()) as Msg[]).filter((m) => !seen.current.has(m.id));
      if (!fresh.length) return;
      fresh.forEach((m) => seen.current.add(m.id));
      setMsgs((cur) => [...cur, ...fresh.filter((m) => !cur.some((x) => x.id === m.id))]);
      if (fresh.some((m) => m.authorKind === "teammate")) {
        setThinking(false);
        router.refresh(); // a teammate may have changed the plan; refresh server-rendered panels
      }
    };
    const id = setInterval(tick, thinking ? 1500 : 4000);
    return () => { alive = false; clearInterval(id); };
  }, [channel, router, thinking]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length, thinking]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setText("");
    const res = await fetch(`/api/chat/${channel}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t, as: viewer }) });
    const m = (await res.json()) as Msg;
    if (m.id) {
      seen.current.add(m.id);
      setMsgs((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
    }
    if (waitsForTeammate || /@(weft|shuttle|pattern)\b/i.test(t)) setThinking(true);
    setBusy(false);
  }

  const shown = msgs.filter((m) => viewer === "team" || !parse(m.card).teamOnly);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {shown.length === 0 && <div className="muted" style={{ fontSize: 14 }}>No messages yet. Say hello.</div>}
        {shown.map((m) => {
          const card = parse(m.card);
          const isMate = m.authorKind === "teammate";
          return (
            <div key={m.id} style={{ display: "flex", gap: 12, animation: "rise .3s ease" }}>
              <span className={`avatar ${isMate ? AV[m.author] ?? "av-weft" : ""}`} style={{
                width: 34, height: 34, borderRadius: 10, fontSize: isMate ? 18 : 14, fontFamily: isMate ? "var(--serif)" : "var(--sans)", fontWeight: isMate ? 400 : 700,
                background: isMate ? undefined : m.authorKind === "supplier" ? "var(--vendor-soft)" : "var(--raised)",
                color: isMate ? undefined : m.authorKind === "supplier" ? "var(--fathom)" : "var(--ink)",
              }}>{m.author[0]}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13 }}>
                  <b>{m.author}</b>{" "}
                  <span className="muted">{isMate ? (m.author === "Shuttle" ? "Production lead" : m.author === "Pattern" ? "Sales analyst" : "Chief of staff") : m.authorKind === "supplier" ? "supplier" : ""} · {time(m.at)}</span>
                  {card.type === "whatsapp" && <span className="chip vendor" style={{ marginLeft: 6, padding: "0 6px", fontSize: 11 }}>via WhatsApp</span>}
                </div>
                {card.type === "call" ? (
                  <div className="call" style={{ maxWidth: 620 }}>
                    <div className="call-who">Your call · changes a date</div>
                    <div className="call-body"><Rich text={m.text} /></div>
                    <div className="row"><Link className="btn sm" href="/">Decide on Today</Link><Link className="btn dawn sm" href={`/scenarios?po=${card.po ?? ""}`}>Scenario</Link>
                      {card.evidence && <span className="muted" style={{ fontSize: 12 }}>from &ldquo;{card.evidence}&rdquo;</span>}</div>
                  </div>
                ) : card.type === "fact" ? (
                  <div className="row" style={{ fontSize: 14 }}>
                    <span className="chip vendor">✓ applied</span><span><Rich text={m.text} /></span>
                    {card.evidence && <span className="muted" style={{ fontSize: 12 }}>&ldquo;{card.evidence}&rdquo;</span>}
                  </div>
                ) : (
                  <div className="bubble" style={{ fontSize: 15 }}><Rich text={m.text} /></div>
                )}
                {card.type === "answer" && !!card.trace?.length && (
                  <div className="row">
                    <button className="btn dawn sm" onClick={() => setOpen(open === m.id ? null : m.id)}>See why · {card.trace.length} queries</button>
                    {!!card.ids?.length && <Link className="btn ghost sm" href={`/map?focus=${encodeURIComponent(card.ids.join(","))}`}>Show on Brand map</Link>}
                  </div>
                )}
                {open === m.id && card.trace?.map((t, j) => (
                  <div key={j} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="muted" style={{ fontSize: 12 }}>{j + 1}. {t.why} · {t.error ? "error" : `${t.rows} rows`}</div>
                    <pre className="query">{t.query}</pre>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {thinking && <div className="muted" style={{ fontSize: 14, paddingLeft: 46 }}>Reading the graph…</div>}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="row" style={{ flexWrap: "nowrap", position: "sticky", bottom: 0, background: "var(--surface)", paddingTop: 8 }}>
        <label htmlFor={`compose-${channel}`} style={{ position: "absolute", left: -9999 }}>Message</label>
        <input id={`compose-${channel}`} className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
        <button className="btn lg" disabled={busy || !text.trim()}>Send</button>
      </form>
    </div>
  );
}
