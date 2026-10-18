"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// "Yes, arrived" from an email lands here and is recorded from the browser, so link scanners can't answer for the supplier.
export default function OneTapAnswer({ checkIn, question }: { checkIn: string; question: string }) {
  const router = useRouter();
  const sent = useRef(false);
  const [state, setState] = useState<"sending" | "done" | "error">("sending");
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/checkins/${checkIn}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answer: "yes" }) })
      .then((r) => { setState(r.ok ? "done" : "error"); router.replace(location.pathname); router.refresh(); })
      .catch(() => setState("error"));
  }, [checkIn, router]);
  return (
    <div className="card" style={{ borderColor: "var(--fathom)", background: "var(--vendor-soft)", color: "var(--fathom)", maxWidth: 560 }}>
      <b>{state === "done" ? "Thanks, recorded: yes, arrived." : state === "error" ? "Couldn't record that. Please answer below." : "Recording your answer…"}</b>
      <span style={{ fontSize: 14 }}>{question}</span>
    </div>
  );
}
