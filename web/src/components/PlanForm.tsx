"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Lessons } from "@/lib/planning";

type Supplier = { id: string; name: string; leadDays: number };
type Row = { name: string; price: number; fabric: string; colours: string; units: number; supplierId: string; unitPrice: number; why: string };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

export default function PlanForm({ lessons, suppliers, today, launch }: { lessons: Lessons; suppliers: Supplier[]; today: string; launch: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [err, setErr] = useState("");
  const [name, setName] = useState("Summer Drop");
  const [date, setDate] = useState(launch);
  const [split, setSplit] = useState(lessons.split);
  const [rows, setRows] = useState<Row[]>(lessons.styles.map((s) => ({ name: s.name, price: s.price, fabric: s.fabric, colours: s.colours.join(", "), units: s.suggested, supplierId: s.supplierId, unitPrice: s.unitPrice, why: s.why })));
  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const total = rows.reduce((a, r) => a + (r.units || 0), 0);
  const sum = split.S + split.M + split.L;

  const submit = () =>
    start(async () => {
      setErr("");
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, date, split, styles: rows.map((r) => ({ ...r, colours: r.colours.split(",").map((c) => c.trim()).filter(Boolean) })) }),
      });
      const body = await res.json();
      if (!res.ok) return setErr(body.error ?? "Couldn't create the collection.");
      router.push(`/drop?id=${body.dropId}`);
      router.refresh();
    });

  return (
    <section className="card" style={{ gap: 18 }}>
      <div className="row" style={{ gap: 14, alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 260px" }}><span className="muted" style={{ fontSize: 13 }}>Collection</span><input className="input" style={{ flex: "none" }} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span className="muted" style={{ fontSize: 13 }}>Launch date</span><input className="input" style={{ flex: "none" }} type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} /></label>
        {(["S", "M", "L"] as const).map((z) => (
          <label key={z} style={{ display: "flex", flexDirection: "column", gap: 6, width: 90 }}><span className="muted" style={{ fontSize: 13 }}>Size {z} %</span><input className="input" style={{ flex: "none" }} type="number" min={0} max={100} value={split[z]} onChange={(e) => setSplit({ ...split, [z]: Number(e.target.value) })} /></label>
        ))}
      </div>
      {sum !== 100 && <div style={{ color: "var(--pulse)", fontSize: 13 }}>The size split adds up to {sum}%. Make it 100%.</div>}

      <div style={{ overflowX: "auto" }}><table className="cmp" style={{ fontSize: 14, minWidth: 920 }}>
        <thead><tr className="muted"><th>Style</th><th>Colours</th><th>Units</th><th>Made by</th><th>₹ / piece</th><th>Lands</th></tr></thead>
        <tbody>
          {rows.map((r, i) => {
            const sup = suppliers.find((s) => s.id === r.supplierId);
            const eta = addDays(today, sup?.leadDays ?? 14);
            const late = eta > date;
            return (
              <tr key={i}>
                <td><input className="input" style={{ height: 36, width: "100%", flex: "none" }} value={r.name} onChange={(e) => set(i, { name: e.target.value })} /><div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{r.why}</div></td>
                <td><input className="input" style={{ height: 36, width: "100%", flex: "none" }} value={r.colours} onChange={(e) => set(i, { colours: e.target.value })} /></td>
                <td style={{ width: 120 }}><input className="input" style={{ height: 36, width: 108, flex: "none", padding: "0 10px" }} type="number" min={0} step={50} value={r.units} onChange={(e) => set(i, { units: Number(e.target.value) })} /></td>
                <td><select className="input" style={{ height: 36, width: "100%", flex: "none" }} value={r.supplierId} onChange={(e) => set(i, { supplierId: e.target.value })}>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.leadDays} days</option>)}</select></td>
                <td style={{ width: 120 }}><input className="input" style={{ height: 36, width: 108, flex: "none", padding: "0 10px" }} type="number" min={0} value={r.unitPrice} onChange={(e) => set(i, { unitPrice: Number(e.target.value) })} /></td>
                <td style={{ whiteSpace: "nowrap" }}><span className={`badge ${late ? "late" : "ok"}`}>{fmt(eta)}{late ? " · after launch" : ""}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button className="btn ghost sm" onClick={() => setRows([...rows, { name: "New style", price: 1499, fabric: "", colours: "Black", units: 300, supplierId: suppliers[0]?.id ?? "", unitPrice: 300, why: "New" }])}>Add a style</button>
        <span className="row" style={{ gap: 12 }}>
          <span className="muted" style={{ fontSize: 14 }}>{rows.length} styles · {total.toLocaleString("en-IN")} units</span>
          <button className="btn fathom lg" disabled={busy || sum !== 100} onClick={submit}>{busy ? "Creating…" : "Create collection and send POs"}</button>
        </span>
      </div>
      {err && <div style={{ color: "var(--pulse)", fontSize: 13 }}>{err}</div>}
    </section>
  );
}
