"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function ReceiveButton({ poId }: { poId: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const receive = () =>
    start(async () => {
      await fetch(`/api/pos/${poId}/receive`, { method: "POST" });
      router.refresh();
    });
  return <button className="btn quiet sm" disabled={busy} onClick={receive}>Mark received</button>;
}
