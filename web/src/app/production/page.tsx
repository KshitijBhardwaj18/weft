import Link from "next/link";
import { openCalls, pos } from "@/lib/plan";
import CallCard from "@/components/CallCard";
import ReceiveButton from "@/components/ReceiveButton";

export const dynamic = "force-dynamic";

const STAGES = ["Fabric", "Cutting", "Stitching", "QC", "Dispatch", "Received"];
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default async function Production() {
  const [all, calls] = await Promise.all([pos(), openCalls()]);
  const delay = calls.filter((c) => c.kind === "delay");

  return (
    <>
      <div>
        <h1 className="h1" style={{ fontSize: 44 }}>Production</h1>
        <p className="lede" style={{ maxWidth: 720, lineHeight: 1.5, fontSize: 15 }}>
          Every order you&apos;ve placed with a factory, and where it is, from fabric to your warehouse. Cards move when suppliers answer
          Shuttle&apos;s check-ins; a date that passes with no answer shows as <b>gone quiet</b>.
        </p>
      </div>

      {delay.map((c) => <CallCard key={c.id} call={c} />)}

      <div className="board">
        {STAGES.map((s) => {
          const cards = all.filter((p) => p.stage === s);
          return (
            <div key={s} className="col">
              <div className="col-head"><span>{s}</span><span className="muted">{cards.length}</span></div>
              {cards.map((p) => (
                <div key={p.id} className={`po-card${p.pending ? " pending" : p.quiet ? " quiet" : ""}`}>
                  <div className="card-head">
                    <span className="mono muted" style={{ fontSize: 12 }}>{p.id}</span>
                    {p.pending ? <span className="badge risk">Your call</span>
                      : p.quiet ? <span className="badge late">Gone quiet</span>
                      : p.status === "delayed" ? <span className="badge late">Late</span>
                      : <span className="badge ok">{p.status}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.label} · {p.qty}</div>
                  <Link href={`/supplier/${p.supplierId}`} className="chip vendor" style={{ alignSelf: "flex-start" }}>{p.supplier}</Link>
                  <div className="mono" style={{ fontSize: 12 }}><span className="muted">due</span> {fmt(p.eta)}</div>
                  {s !== "Received" && <ReceiveButton poId={p.id} />}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
