import { answerCheckIn } from "@/lib/checkins";
import { postMessage, supplierChannelId } from "@/lib/chat";
import { ro } from "@/lib/graph";
import { activeGraph } from "@/lib/plan";

// A supplier answers a check-in (in the app, or relayed from email/WhatsApp).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { answer, date } = (await req.json()) as { answer: "yes" | "delayed"; date?: string };
  try {
    const res = await answerCheckIn(id, answer, date);
    const [who] = await ro<{ sid: string; contact: string; q: string }>(
      "MATCH (:PO)-[:HAS_CHECKIN]->(ci:CheckIn {id:$id}), (po:PO)-[:HAS_CHECKIN]->(ci), (po)-[:MADE_BY]->(s:Supplier) RETURN s.id AS sid, s.contact AS contact, ci.question AS q",
      { id },
      await activeGraph(),
    );
    if (who) {
      await postMessage({
        channel: supplierChannelId(who.sid),
        author: who.contact,
        authorKind: "supplier",
        text: answer === "yes" ? `${who.q} Yes, arrived.` : `${who.q} Delayed, new date ${date}.`,
        card: { type: "checkin-answer", checkIn: id, answer, date: date ?? null },
      });
    }
    return Response.json(res);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
