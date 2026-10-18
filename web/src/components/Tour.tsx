"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// A guided walk through the major features. Each step opens a page and says what to try there.
const STEPS: { path: string; title: string; body: string; graph: string }[] = [
  { path: "/", title: "Today, 13 days to the Black Drop", body: "One live plan for a fitness-wear drop: 3 styles, 15 SKUs, 2,100 units, 5 factory orders, 3 creators. Your call lists what the AI teammates need you to decide.", graph: "Single points of failure is PageRank over MADE_BY edges (algo.pageRank)." },
  { path: "/supplier/sri", title: "Make: the supplier answers a check-in", body: "This is Murugan's view at Sri Lakshmi Knits. On Shuttle's check-in, click Delayed → pick a date → Send. Or type in the chat: \"Fabric delayed, coming 28th\".", graph: "The answer becomes a CheckIn fact and a Call node linked back to it." },
  { path: "/", title: "The delay call, with its impact", body: "Shuttle raised a call: PO-014 lands 5 Dec, after the 1 Dec drop, and breaks 3 creator posts. Click Scenario on that call.", graph: "Impact is one multi-hop query: PO → SKU → Style → Drop ← CreatorPost ← Creator." },
  { path: "/scenarios?po=PO-014", title: "Test it in a scenario", body: "Move PO-014 to Kavya Garments → Create scenario. Compare reality with the copy, then Apply to plan.", graph: "A scenario is a full GRAPH.COPY of the plan; apply copies it back and records a Decision." },
  { path: "/", title: "Ask a teammate, and see why", body: "Press ⌘J (or click the Ask bar) and ask \"Why did we pick Sri Lakshmi in the first place?\". Open See why under the answer.", graph: "Teammates run read-only Cypher through GRAPH.RO_QUERY; every query is listed." },
  { path: "/map?search=olive", title: "The Brand map", body: "Everything in the brand as one graph. Search for olive to highlight every match.", graph: "Full-text index via db.idx.fulltext.queryNodes; range indexes on every id." },
  { path: "/", title: "Sell: switch to Live, day 9", body: "Click Live · 10 Dec at the top. 62% sold; black leggings M sold out on day 4. In Your call, click Approve PO on Pattern's restock.", graph: "Sell-through, revenue and restocks are aggregations over SKU nodes in the weft_live graph." },
  { path: "/production", title: "Restock to receipt", body: "The approved restock is a new PO in Fabric. Click Mark received: its quantity goes onto stock, and Restock now stops suggesting it.", graph: "Restock nets out POs not yet received; receipt adds the PO's qty to SKU.onHand." },
];

export default function Tour() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (params.get("tour") === "1") localStorage.setItem("weft_tour", "0");
    const s = localStorage.getItem("weft_tour");
    setStep(s === null ? null : Number(s));
  }, [params]);

  if (step === null || step >= STEPS.length) return null;
  const s = STEPS[step];
  const go = (n: number) => {
    if (n >= STEPS.length || n < 0) { localStorage.removeItem("weft_tour"); setStep(null); return; }
    localStorage.setItem("weft_tour", String(n));
    setStep(n);
    if (STEPS[n].path.split("?")[0] !== pathname || STEPS[n].path.includes("?")) router.push(STEPS[n].path);
  };
  const reset = async () => { await fetch("/api/demo/reset", { method: "POST" }); localStorage.setItem("weft_tour", "0"); setStep(0); router.push("/"); router.refresh(); };

  return (
    <div className="tour" role="dialog" aria-label="Guided tour">
      <div className="tour-head"><span>Guided tour · {step + 1} of {STEPS.length}</span><button className="btn quiet sm" onClick={() => go(STEPS.length)} aria-label="Close tour">Close</button></div>
      <div className="tour-title">{s.title}</div>
      <div className="tour-body">{s.body}</div>
      <div className="tour-graph"><b>FalkorDB</b> {s.graph}</div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button className="btn quiet sm" onClick={reset}>Reset demo data</button>
        <span className="row" style={{ gap: 6 }}>
          {step > 0 && <button className="btn ghost sm" onClick={() => go(step - 1)}>Back</button>}
          <button className="btn fathom sm" onClick={() => go(step + 1)}>{step === STEPS.length - 1 ? "Finish" : "Next"}</button>
        </span>
      </div>
    </div>
  );
}
