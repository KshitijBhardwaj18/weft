import { setPhase, type Phase } from "@/lib/plan";

// Demo clock: move the workspace between the Countdown plan and the Live (day 9) snapshot.
export async function POST(req: Request) {
  const { phase } = (await req.json()) as { phase: Phase };
  if (phase !== "countdown" && phase !== "live") return Response.json({ error: "Unknown phase" }, { status: 400 });
  await setPhase(phase);
  return Response.json({ ok: true });
}
