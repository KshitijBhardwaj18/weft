"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SyncShop() {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState("");
  const sync = () => start(async () => {
    const r = await fetch("/api/integrations/shopify/sync", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const j = await r.json();
    setMsg(r.ok ? `Synced ${j.orders} orders, ${j.skusUpdated} SKUs, ${j.creatorsUpdated} creators.` : j.error);
    router.refresh();
  });
  return <span className="row" style={{ gap: 10 }}><button className="btn sm" disabled={busy} onClick={sync}>{busy ? "Syncing…" : "Sync now"}</button>{msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}</span>;
}

export function SimulateOrder({ live }: { live: boolean }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [log, setLog] = useState<string[]>([]);
  const order = () => start(async () => {
    const r = await fetch("/api/demo/order", { method: "POST" });
    const j = await r.json();
    setLog([r.ok ? `${j.qty} × ${j.sku}${j.creator ? ` · code from ${j.creator}` : ""}` : j.error, ...log].slice(0, 5));
    router.refresh();
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span className="row" style={{ gap: 10 }}>
        <button className="btn fathom sm" disabled={busy || !live} onClick={order}>{busy ? "Ordering…" : "Simulate a shop order"}</button>
        {!live && <span className="muted" style={{ fontSize: 13 }}>Switch the clock to Live first.</span>}
      </span>
      {log.map((l, i) => <div key={i} className="mono" style={{ fontSize: 13 }}>{l}</div>)}
    </div>
  );
}
