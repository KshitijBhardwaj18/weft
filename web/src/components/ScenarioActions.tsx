"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const post = (body: object) =>
  fetch("/api/scenarios", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export function NewScenario({ pos, suppliers, defaultPo }: { pos: { id: string; label: string; supplierId: string }[]; suppliers: { id: string; name: string; leadDays: number }[]; defaultPo: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [po, setPo] = useState(defaultPo);
  const current = pos.find((p) => p.id === po)?.supplierId;
  const options = suppliers.filter((s) => s.id !== current && s.id !== "ananya");
  const [to, setTo] = useState(options[0]?.id ?? "");

  return (
    <div className="card" style={{ maxWidth: 760 }}>
      <h2>New scenario</h2>
      <div className="row">
        <label className="muted" htmlFor="scn-po" style={{ fontSize: 14 }}>What if</label>
        <select id="scn-po" className="input" style={{ flex: "0 1 280px" }} value={po} onChange={(e) => setPo(e.target.value)}>
          {pos.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.label}</option>)}
        </select>
        <label className="muted" htmlFor="scn-to" style={{ fontSize: 14 }}>moves to</label>
        <select id="scn-to" className="input" style={{ flex: "0 1 260px" }} value={to} onChange={(e) => setTo(e.target.value)}>
          {options.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.leadDays}-day lead)</option>)}
        </select>
        <button className="btn dawn lg" disabled={busy || !to} onClick={() => start(async () => { await post({ action: "create", po, to }); router.refresh(); })}>
          {busy ? "Copying the plan…" : "Create scenario"}
        </button>
      </div>
      <div className="muted" style={{ fontSize: 13 }}>Weft copies the whole plan graph with GRAPH.COPY and makes the change only in the copy.</div>
    </div>
  );
}

export function ApplyDiscard({ id }: { id: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const run = (action: string) => start(async () => { await post({ action, id }); router.push(action === "apply" ? "/production" : "/scenarios"); router.refresh(); });

  return confirming ? (
    <div className="call" style={{ borderStyle: "solid", borderColor: "var(--fathom)", background: "var(--surface-2)" }}>
      <div className="call-body"><b>Apply to plan?</b> The scenario graph replaces the plan, the delay call closes, and the decision is recorded with who and when.</div>
      <div className="row">
        <button className="btn fathom" disabled={busy} onClick={() => run("apply")}>{busy ? "Applying…" : "Yes, apply to plan"}</button>
        <button className="btn ghost" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
      </div>
    </div>
  ) : (
    <div className="row">
      <button className="btn fathom lg" onClick={() => setConfirming(true)}>Apply to plan</button>
      <button className="btn ghost lg" disabled={busy} onClick={() => run("discard")}>Discard</button>
      <span className="muted" style={{ fontSize: 13 }}>Owners and Managers can apply</span>
    </div>
  );
}
