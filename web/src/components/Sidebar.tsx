"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ActingAs from "./ActingAs";

const I = {
  today: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  drop: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 21V4h11l-2 4 2 4H5" /></svg>,
  production: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="11" rx="1.5" /><rect x="17" y="4" width="4" height="7" rx="1.5" /></svg>,
  supplier: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 21V9l6 4V9l6 4V5h6v16z" /></svg>,
  sales: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 20h18M6 16l4-5 3 3 5-7" /></svg>,
  scenario: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 7v10M18 11c0 4-6 3-12 6" /></svg>,
  map: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="5" cy="12" r="2.5" /><circle cx="19" cy="5" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M7.3 11l9.4-4.8M7.3 13l9.4 4.8" /></svg>,
};


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
        {item("/drop", "Drops", I.drop, "Collections going live on a date")}
        {item("/plan", "Plan a collection", I.scenario, "Start the next collection from what the last one taught")}
      </div>
      <div className="group">
        <div className="group-label">Supply</div>
        {item("/production", "Production", I.production, "Every factory order, from fabric to your warehouse")}
        {item("/supplier/sri", "Suppliers", I.supplier, "What your suppliers see: POs and check-ins")}
      </div>
      <div className="group">
        <div className="group-label">Commerce</div>
        {item("/drop#sales", "Sales", I.sales, "What sold, which sizes, which creators")}
        {item("/integrations", "Shop & channels", I.supplier, "Shopify, email and WhatsApp")}
      </div>
      <div className="group">
        <div className="group-label">Strategy</div>
        {item("/scenarios", "Scenarios", I.scenario, "Test a change before you make it")}
        {item("/map", "Brand map", I.map, "How everything in your brand connects")}
      </div>

      <div className="group">
        <div className="group-label">Conversations</div>
        <div className="muted" style={{ fontSize: 12, padding: "2px 12px" }}>Suppliers</div>
        {[["sup-sri", "Sri Lakshmi Knits"], ["sup-kavya", "Kavya Garments"], ["sup-ananya", "Ananya Fabrics"]].map(([id, name]) => (
          <Link key={id} href={`/chat/${id}`} className={`nav-sub${path === `/chat/${id}` ? " on" : ""}`}><span className="sq" />{name}</Link>
        ))}
        <div className="muted" style={{ fontSize: 12, padding: "8px 12px 2px" }}>Team</div>
        {[["team-ops", "ops"], ["team-marketing", "marketing"]].map(([id, name]) => (
          <Link key={id} href={`/chat/${id}`} className={`nav-sub${path === `/chat/${id}` ? " on" : ""}`}><span style={{ width: 18, textAlign: "center" }}>#</span>{name}</Link>
        ))}
        <div className="muted" style={{ fontSize: 12, padding: "8px 12px 2px" }}>AI teammates</div>
        {[["agent-weft", "Weft", "av-weft", "Chief of staff"], ["agent-shuttle", "Shuttle", "av-shuttle", "Production"], ["agent-pattern", "Pattern", "av-pattern", "Sales"]].map(([id, name, av, role]) => (
          <Link key={id} href={`/chat/${id}`} className={`nav-sub${path === `/chat/${id}` ? " on" : ""}`}><span className={`avatar ${av}`}>{name[0]}</span>{name}<span style={{ marginLeft: "auto", fontSize: 11 }}>{role}</span></Link>
        ))}
      </div>

      <ActingAs />
    </nav>
  );
}
