"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function TopBar({ phase, today }: { phase: "countdown" | "live"; today: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const go = (p: string) =>
    start(async () => {
      await fetch("/api/phase", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phase: p }) });
      router.refresh();
    });
  const nextDay = () =>
    start(async () => {
      await fetch("/api/clock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ days: 1 }) });
      router.refresh();
    });

  return (
    <div className="row" style={{ gap: 12 }}>
      <button className="ask" onClick={() => window.dispatchEvent(new CustomEvent("weft:ask", { detail: {} }))}>
        <span className="avatar av-weft" style={{ width: 22, height: 22, fontSize: 14 }}>W</span>
        Ask Weft anything, e.g. &ldquo;why is size M selling so fast?&rdquo;
        <span className="mono" style={{ marginLeft: "auto", fontSize: 12 }}>⌘J</span>
      </button>
      <div className="tabs" role="group" aria-label="Demo clock" title="Demo clock: Countdown (18 Nov) or Live (day 9)">
        <button className={phase === "countdown" ? "on" : ""} disabled={busy} onClick={() => go("countdown")}>Countdown · {phase === "countdown" ? fmt(today) : "18 Nov"}</button>
        <button className={phase === "live" ? "on" : ""} disabled={busy} onClick={() => go("live")}>Live · {phase === "live" ? fmt(today) : "10 Dec"}</button>
      </div>
      <button className="btn ghost sm" disabled={busy} onClick={nextDay} title="Move the demo clock forward a day">Next day →</button>
    </div>
  );
}
