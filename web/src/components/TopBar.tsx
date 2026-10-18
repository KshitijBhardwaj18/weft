"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function TopBar({ phase }: { phase: "countdown" | "live" }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const go = (p: string) =>
    start(async () => {
      await fetch("/api/phase", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phase: p }) });
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
        <button className={phase === "countdown" ? "on" : ""} disabled={busy} onClick={() => go("countdown")}>Countdown · 18 Nov</button>
        <button className={phase === "live" ? "on" : ""} disabled={busy} onClick={() => go("live")}>Live · 10 Dec</button>
      </div>
    </div>
  );
}
