"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const I = {
  today: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  drop: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 21V4h11l-2 4 2 4H5" /></svg>,
  production: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="11" rx="1.5" /><rect x="17" y="4" width="4" height="7" rx="1.5" /></svg>,
  supplier: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 21V9l6 4V9l6 4V5h6v16z" /></svg>,
  sales: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 20h18M6 16l4-5 3 3 5-7" /></svg>,
  scenario: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 7v10M18 11c0 4-6 3-12 6" /></svg>,
  map: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="5" cy="12" r="2.5" /><circle cx="19" cy="5" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M7.3 11l9.4-4.8M7.3 13l9.4 4.8" /></svg>,
};

const ask = (who: string) => () => window.dispatchEvent(new CustomEvent("weft:ask", { detail: { who } }));

export default function Sidebar() {
  const path = usePathname();
  const on = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const item = (href: string, label: string, icon: React.ReactNode, title: string, meta?: string) => (
    <Link href={href} title={title} className={`nav-item${on(href) ? " on" : ""}`}>
      {icon}
      {label}
      {meta && <span className="meta">{meta}</span>}
    </Link>
  );

  return (
    <nav className="nav" aria-label="Workspace">
      <div className="brand">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M4 8h20M4 14h20M4 20h20" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" /><path d="M9 4v20M19 4v20" stroke="#034F46" strokeWidth="2" strokeLinecap="round" /></svg>
        <b>Weft</b>
        <small>Weft Active</small>
      </div>

      {item("/", "Today", I.today, "What needs you, and how things stand")}

      <div className="group">
        <div className="group-label">Collections</div>
        {item("/drop", "Drops", I.drop, "Collections going live on a date", "Black Drop")}
      </div>
      <div className="group">
        <div className="group-label">Supply</div>
        {item("/production", "Production", I.production, "Every factory order, from fabric to your warehouse")}
        {item("/supplier/sri", "Suppliers", I.supplier, "What your suppliers see: POs and check-ins")}
      </div>
      <div className="group">
        <div className="group-label">Commerce</div>
        {item("/drop#sales", "Sales", I.sales, "What sold, which sizes, which creators")}
      </div>
      <div className="group">
        <div className="group-label">Strategy</div>
        {item("/scenarios", "Scenarios", I.scenario, "Test a change before you make it")}
        {item("/map", "Brand map", I.map, "How everything in your brand connects")}
      </div>

      <div className="group">
        <div className="group-label">Conversations</div>
        <button className="nav-sub" style={{ border: "none", background: "none", textAlign: "left" }} onClick={ask("Weft")}><span className="avatar av-weft">W</span>Weft<span className="meta" style={{ marginLeft: "auto", fontSize: 11 }}>Chief of staff</span></button>
        <button className="nav-sub" style={{ border: "none", background: "none", textAlign: "left" }} onClick={ask("Shuttle")}><span className="avatar av-shuttle">S</span>Shuttle<span style={{ marginLeft: "auto", fontSize: 11 }}>Production</span></button>
        <button className="nav-sub" style={{ border: "none", background: "none", textAlign: "left" }} onClick={ask("Pattern")}><span className="avatar av-pattern">P</span>Pattern<span style={{ marginLeft: "auto", fontSize: 11 }}>Sales</span></button>
        <div style={{ height: 6 }} />
        <Link href="/supplier/sri" className={`nav-sub${path === "/supplier/sri" ? " on" : ""}`}><span className="sq" />Sri Lakshmi Knits</Link>
        <Link href="/supplier/kavya" className={`nav-sub${path === "/supplier/kavya" ? " on" : ""}`}><span className="sq" />Kavya Garments</Link>
        <Link href="/supplier/ananya" className={`nav-sub${path === "/supplier/ananya" ? " on" : ""}`}><span className="sq" />Ananya Fabrics</Link>
      </div>

      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "12px 10px 4px", borderTop: "1px solid var(--line)" }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ink)", color: "var(--surface)", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>K</span>
        <span style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 14, fontWeight: 600 }}>Kshitij</span><span className="muted" style={{ fontSize: 12 }}>Owner</span></span>
      </div>
    </nav>
  );
}
