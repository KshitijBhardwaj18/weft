"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CheckIn } from "@/lib/plan";

export default function CheckInCard({ ci }: { ci: CheckIn }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [picking, setPicking] = useState(false);
  const [date, setDate] = useState("2026-11-28");
  const [error, setError] = useState("");

  const answer = (body: object) =>
    start(async () => {
      const res = await fetch(`/api/checkins/${ci.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) setError((await res.json()).error ?? "Something went wrong");
      router.refresh();
    });

  const done = ci.status !== "open" && ci.status !== "quiet";
  return (
    <div className="card" style={{ maxWidth: 560, borderColor: done ? "var(--line)" : "var(--fathom)" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="row" style={{ gap: 6, fontSize: 13, fontWeight: 600, color: "var(--fathom)" }}>
          <span className="avatar av-shuttle">S</span>Shuttle · check-in
        </span>
        <span className="mono muted" style={{ fontSize: 12 }}>{ci.po} · due {new Date(ci.due).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{ci.question}</div>
      {done ? (
        <div className="muted" style={{ fontSize: 14 }}>Answered. Thanks, the team has it.</div>
      ) : (
        <>
          <div className="row">
            <button className="btn fathom lg" disabled={busy} onClick={() => answer({ answer: "yes" })}>Yes, arrived</button>
            <button className="btn ghost lg" disabled={busy} onClick={() => setPicking(true)}>Delayed → pick a date</button>
          </div>
          {picking && (
            <div className="row">
              <label htmlFor={`d-${ci.id}`} className="muted" style={{ fontSize: 13 }}>New fabric date</label>
              <input id={`d-${ci.id}`} type="date" className="input" style={{ flex: "0 0 auto" }} value={date} onChange={(e) => { setDate(e.target.value); setError(""); }} />
              <button className="btn lg" disabled={busy} onClick={() => (date ? answer({ answer: "delayed", date }) : setError("Pick a date first"))}>Send</button>
            </div>
          )}
          {error && <div style={{ fontSize: 13, color: "var(--pulse)" }}>{error}</div>}
        </>
      )}
    </div>
  );
}
