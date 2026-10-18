"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Call } from "@/lib/plan";

const AV: Record<string, string> = { Weft: "av-weft", Shuttle: "av-shuttle", Pattern: "av-pattern" };
const PRIMARY: Record<string, string> = { delay: "Accept new date", restock: "Approve PO", followup: "Send", date: "Accept" };

export default function CallCard({ call }: { call: Call }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const act = (action: "apply" | "ignore") =>
    start(async () => {
      await fetch(`/api/calls/${call.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
      router.refresh();
    });

  return (
    <div className="call">
      <div className="call-who"><span className={`avatar ${AV[call.teammate]}`}>{call.teammate[0]}</span>{call.teammate}: {call.title}</div>
      <div className="call-body">{call.summary}</div>
      <div className="row">
        <button className="btn sm" disabled={busy} onClick={() => act("apply")}>{PRIMARY[call.kind] ?? "Apply"}</button>
        {(call.kind === "delay" || call.kind === "restock") && (
          <Link className="btn dawn sm" href={`/scenarios?po=${call.kind === "delay" ? call.about : "PO-014"}`}>Scenario</Link>
        )}
        <button className="btn quiet sm" disabled={busy} onClick={() => act("ignore")}>Ignore</button>
        <button className="btn quiet sm" onClick={() => window.dispatchEvent(new CustomEvent("weft:ask", { detail: { q: `Why did ${call.teammate} raise this: ${call.title}?` } }))}>See why</button>
      </div>
    </div>
  );
}
