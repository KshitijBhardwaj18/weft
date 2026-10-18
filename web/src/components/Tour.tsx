"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// A short guided walk through the product. Each step opens a page and says what to try there.
const STEPS: { path: string; title: string; body: string; how: string }[] = [
  { path: "/", title: "This is Today", body: "Your brand at a glance: what needs you, Weft's morning brief, and how the next launch is going.", how: "Single points of failure come from PageRank over the graph's supplier links." },
  { path: "/supplier/sri", title: "A factory says it's late", body: "This is what your supplier sees. On the check-in, click Delayed → pick a date → Send.", how: "The answer is saved on the graph, linked to the factory order it's about." },
  { path: "/", title: "Weft shows what breaks", body: "A new call: the order now lands after launch, and 3 creator posts promising the date break. Click Scenario on it.", how: "One graph query walks from the order to every post that promised its date." },
  { path: "/scenarios?po=PO-014", title: "Try a fix safely", body: "Move the order to another factory in a private copy. Compare the two outcomes, then Apply to plan.", how: "A scenario is a full copy of the plan (FalkorDB GRAPH.COPY)." },
  { path: "/chat/agent-shuttle", title: "Talk to your teammates", body: "Ask Shuttle anything about production. In any chat, @weft, @shuttle or @pattern answers in place.", how: "Teammates read the graph with read-only queries; See why shows them." },
  { path: "/", title: "Launch, and sales", body: "Click Live · 10 Dec at the top. See what sold by size, then click Approve PO on Pattern's restock.", how: "Restock = sell rate × factory lead time − stock − what's already on order." },
  { path: "/plan", title: "Plan the next collection", body: "Weft starts from what actually sold. Adjust anything and create it: the orders go to your factories.", how: "Styles, products and orders are created as new connected nodes." },
];

export default function Tour() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [step, setStep] = useState<number | null>(null);
  const [small, setSmall] = useState(false);

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
    setSmall(false);
    if (STEPS[n].path.split("?")[0] !== pathname || STEPS[n].path.includes("?")) router.push(STEPS[n].path);
  };
  const reset = async () => { await fetch("/api/demo/reset", { method: "POST" }); localStorage.setItem("weft_tour", "0"); setStep(0); router.push("/"); router.refresh(); };

  if (small) return <button className="tour-pill" onClick={() => setSmall(false)}>Tour · {step + 1} of {STEPS.length} · {s.title}</button>;
  return (
    <div className="tour" role="dialog" aria-label="Guided tour">
      <div className="tour-head">
        <span>Tour · {step + 1} of {STEPS.length}</span>
        <span className="row" style={{ gap: 2 }}>
          <button className="btn quiet sm" onClick={() => setSmall(true)} aria-label="Minimise tour">Hide</button>
          <button className="btn quiet sm" onClick={() => go(STEPS.length)} aria-label="Close tour">Close</button>
        </span>
      </div>
      <div className="tour-title">{s.title}</div>
      <div className="tour-body">{s.body}</div>
      <details className="tour-graph"><summary>Under the hood</summary>{s.how}</details>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button className="btn quiet sm" onClick={reset}>Start over</button>
        <span className="row" style={{ gap: 6 }}>
          {step > 0 && <button className="btn ghost sm" onClick={() => go(step - 1)}>Back</button>}
          <button className="btn fathom sm" onClick={() => go(step + 1)}>{step === STEPS.length - 1 ? "Finish" : "Next"}</button>
        </span>
      </div>
    </div>
  );
}
