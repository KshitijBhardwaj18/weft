import { after } from "next/server";
import { answerCheckIn } from "@/lib/checkins";
import { postMessage, supplierChannelId } from "@/lib/chat";
import { ro } from "@/lib/graph";
import { sendText, verifySignature } from "@/lib/integrations/whatsapp";
import { processMessage } from "@/lib/proposals";
import { activeGraph, checkInsFor } from "@/lib/plan";

type Inbound = {
  from: string;
  type: string;
  text?: { body: string };
  interactive?: { button_reply?: { id: string } };
};
type Payload = { entry?: { changes?: { value?: { messages?: Inbound[] } }[] }[] };

/** Meta's verification handshake: echo hub.challenge when the verify token matches. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const ok = p.get("hub.mode") === "subscribe" && !!process.env.WHATSAPP_VERIFY_TOKEN && p.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN;
  return ok ? new Response(p.get("hub.challenge"), { status: 200 }) : new Response("forbidden", { status: 403 });
}

/** Inbound WhatsApp events. Acks 200 at once and handles messages after the response, so Meta does not retry. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return Response.json({ error: "bad signature" }, { status: 401 });
  }
  let payload: Payload;
  try {
    payload = JSON.parse(raw) as Payload;
  } catch {
    console.error("[whatsapp] invalid JSON body");
    return Response.json({ ok: true });
  }
  after(async () => {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const msg of change.value?.messages ?? []) {
          try {
            await handle(msg);
          } catch (e) {
            console.error(`[whatsapp] message from ${msg.from} failed:`, e);
          }
        }
      }
    }
  });
  return Response.json({ ok: true });
}

/** Route one inbound message: a check-in button tap, or a supplier text into their chat. */
async function handle(msg: Inbound) {
  const [sup] = await ro<{ id: string; contact: string }>(
    "MATCH (s:Supplier {whatsapp:$w}) RETURN s.id AS id, s.contact AS contact",
    { w: `+${msg.from}` },
    await activeGraph(),
  );
  if (!sup) return; // not a known supplier

  const reply = msg.interactive?.button_reply?.id;
  if (msg.type === "interactive" && reply) {
    const m = /^ci:([^:]+):(yes|delayed)$/.exec(reply);
    // Only this supplier's own check-ins can be answered from their number.
    if (!m || !(await checkInsFor(sup.id)).some((c) => c.id === m[1])) return;
    if (m[2] === "yes") await answerCheckIn(m[1], "yes");
    else await sendText(msg.from, "Which date will it arrive? Reply like 28 Nov");
    return;
  }

  if (msg.type === "text" && msg.text) {
    const m = await postMessage({
      channel: supplierChannelId(sup.id),
      author: sup.contact,
      authorKind: "supplier",
      text: msg.text.body,
      card: { type: "whatsapp", from: msg.from },
    });
    await processMessage(m);
  }
}
