import { advanceClock } from "@/lib/sweep";

// Demo clock: "Next day" moves today forward, so unanswered check-ins can go quiet.
export async function POST(req: Request) {
  const { days = 1 } = (await req.json().catch(() => ({}))) as { days?: number };
  if (!Number.isInteger(days) || days < 1 || days > 30) return Response.json({ error: "days must be 1–30" }, { status: 400 });
  return Response.json(await advanceClock(days));
}
