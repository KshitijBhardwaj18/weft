import { createHmac, timingSafeEqual } from "node:crypto";
import type { SendResult } from "./email";

const GRAPH = "https://graph.facebook.com/v21.0";

/** True when the token and phone number id are set. */
export const whatsappConfigured = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

/** POST one message to the Cloud API. Never throws. */
async function send(to: string, body: Record<string, unknown>): Promise<SendResult> {
  if (!whatsappConfigured()) {
    console.info("[whatsapp] skipped: WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set");
    return { skipped: true, reason: "WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set" };
  }
  try {
    const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: to.replace(/\s/g, ""), ...body }),
    });
    const json = (await res.json()) as { messages?: { id: string }[]; error?: { message: string } };
    if (!res.ok || !json.messages?.[0]) return { error: json.error?.message ?? `HTTP ${res.status}` };
    return { id: json.messages[0].id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** Plain text message. Only delivered inside the 24-hour customer window. */
export const sendText = (to: string, body: string) => send(to, { type: "text", text: { body } });

/** Two reply buttons for a check-in: "Yes, arrived" and "Delayed". Ids come back as ci:<id>:yes|delayed. */
export const sendCheckInButtons = (to: string, checkInId: string, question: string) =>
  send(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: question },
      action: {
        buttons: [
          { type: "reply", reply: { id: `ci:${checkInId}:yes`, title: "Yes, arrived" } },
          { type: "reply", reply: { id: `ci:${checkInId}:delayed`, title: "Delayed" } },
        ],
      },
    },
  });

/**
 * PO update as a template message. WhatsApp only allows approved templates outside the 24-hour window:
 * create WHATSAPP_PO_TEMPLATE (default po_update, body "{{1}}") in Meta Business Manager.
 */
export async function sendPoTemplate(to: string, poId: string, summaryText: string): Promise<SendResult> {
  const r = await send(to, {
    type: "template",
    template: {
      name: process.env.WHATSAPP_PO_TEMPLATE ?? "po_update",
      language: { code: "en" },
      components: [{ type: "body", parameters: [{ type: "text", text: summaryText }] }],
    },
  });
  if ("error" in r) console.error(`[whatsapp] ${poId} template failed: ${r.error}`);
  return r;
}

/** Check Meta's X-Hub-Signature-256 header against the raw body. Passes when no app secret is set. */
export function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!header) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
