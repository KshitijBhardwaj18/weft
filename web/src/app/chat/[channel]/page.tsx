import Link from "next/link";
import { notFound } from "next/navigation";
import ChatThread from "@/components/ChatThread";
import { channel, messages } from "@/lib/chat";
import { checkInsFor, pos } from "@/lib/plan";

export const dynamic = "force-dynamic";

const ABOUT: Record<string, string> = {
  weft: "Chief of staff. Ask anything about the brand; Weft routes to Shuttle or Pattern.",
  shuttle: "Production lead. Suppliers, POs, check-ins, delays and samples.",
  pattern: "Sales analyst. Sell-through, stock, restocks, returns and creators.",
};

export default async function ChatPage({ params }: { params: Promise<{ channel: string }> }) {
  const { channel: id } = await params;
  const ch = await channel(id);
  if (!ch) notFound();
  const initial = await messages(id);
  const [supplierPos, cis] = ch.supplierId ? await Promise.all([pos(), checkInsFor(ch.supplierId)]) : [[], []];
  const mine = supplierPos.filter((p) => p.supplierId === ch.supplierId);

  const title = ch.kind === "team" ? `# ${ch.name}` : ch.name;
  const sub =
    ch.kind === "supplier" ? "Supplier chat · the supplier sees only this chat and their POs. Shuttle reads it and proposes plan updates."
    : ch.kind === "team" ? "Team channel · mention @weft, @shuttle or @pattern to ask in place. Shuttle proposes plan updates from what's said."
    : ABOUT[ch.teammate ?? "weft"];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
      <section style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="row" style={{ gap: 10 }}>
            {ch.kind === "agent" && <span className={`avatar av-${ch.teammate}`} style={{ width: 30, height: 30, fontSize: 18 }}>{ch.name[0]}</span>}
            {ch.kind === "supplier" && <span className="sq" style={{ width: 10, height: 10 }} />}
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>{title}</h1>
          </div>
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>{sub}</p>
        </div>
        <ChatThread
          channel={id}
          initial={initial}
          viewer="team"
          waitsForTeammate={ch.kind === "agent"}
          placeholder={ch.kind === "agent" ? `Ask ${ch.name}…` : ch.kind === "supplier" ? `Message ${ch.name}…` : `Message #${ch.name} · @shuttle, @pattern, @weft`}
        />
      </section>

      {ch.kind === "supplier" && (
        <aside style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="label">Their purchase orders</span>
          {mine.map((p) => (
            <div key={p.id} className="card" style={{ padding: 14, gap: 6 }}>
              <div className="card-head"><span className="mono" style={{ fontSize: 13 }}>{p.id}</span><span className={`badge ${p.pending ? "risk" : p.quiet ? "late" : "ok"}`}>{p.pending ? "your call" : p.quiet ? "gone quiet" : p.stage}</span></div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.label} · {p.qty}</div>
              <div className="mono muted" style={{ fontSize: 12 }}>due {new Date(p.eta).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
            </div>
          ))}
          {cis.length > 0 && <span className="label">Check-ins</span>}
          {cis.map((c) => (
            <div key={c.id} className="card" style={{ padding: 14, gap: 4 }}>
              <div style={{ fontSize: 14 }}>{c.question}</div>
              <div className="muted" style={{ fontSize: 12 }}>{c.status === "quiet" ? "Gone quiet" : c.status} · due {new Date(c.due).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
            </div>
          ))}
          <Link className="btn ghost" href={`/supplier/${ch.supplierId}`}>Open the supplier&apos;s view</Link>
        </aside>
      )}
    </div>
  );
}
