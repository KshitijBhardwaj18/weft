import { Resend } from "resend";
import { ro } from "../graph";
import { activeGraph, checkInsFor, pos } from "../plan";

export type SendResult = { id: string } | { error: string } | { skipped: true; reason: string };
export type Supplier = { id: string; name: string; contact: string; email: string | null; whatsapp: string | null };

const DEFAULT_FROM = "Weft <onboarding@resend.dev>";
const CREAM = "#FFFEF8";
const INK = "#1A1A1A";
const TEAL = "#034F46";
const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

/** True when RESEND_API_KEY is set. */
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);
/** Indian grouping: 420 -> ₹420, 420000 -> ₹4,20,000. */
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
/** ISO date to "20 Nov". */
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

/** A supplier by id from the active plan graph. */
export async function supplierById(id: string): Promise<Supplier | undefined> {
  const [s] = await ro<Supplier>(
    "MATCH (s:Supplier {id:$id}) RETURN s.id AS id, s.name AS name, s.contact AS contact, s.email AS email, s.whatsapp AS whatsapp",
    { id },
    await activeGraph(),
  );
  return s;
}

/** One PO made by this supplier. */
export async function poFor(supplierId: string, poId: string) {
  return (await pos()).find((p) => p.id === poId && p.supplierId === supplierId);
}

/** One check-in on this supplier's POs. */
export async function checkInFor(supplierId: string, id: string) {
  return (await checkInsFor(supplierId)).find((c) => c.id === id);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const row = (k: string, v: string) => `<tr><td style="padding:4px 16px 4px 0;color:#555">${k}</td><td>${v}</td></tr>`;
const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:${TEAL};color:${CREAM};text-decoration:none;padding:12px 20px;border-radius:8px;margin:4px 8px 4px 0">${label}</a>`;
const layout = (heading: string, body: string) =>
  `<div style="background:${CREAM};color:${INK};font-family:system-ui,-apple-system,sans-serif;padding:24px;max-width:560px">` +
  `<h2 style="font-family:ui-serif,Georgia,serif;font-weight:normal;font-size:22px;margin:0 0 12px">${heading}</h2>${body}</div>`;
const skip = (reason: string): SendResult => {
  console.info(`[email] skipped: ${reason}`);
  return { skipped: true, reason };
};
const fail = (e: unknown): SendResult => ({ error: e instanceof Error ? e.message : String(e) });

/** Send through Resend. Never throws. */
async function deliver(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  try {
    const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM ?? DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    });
    if (error || !data) return { error: error?.message ?? "no response from Resend" };
    return { id: data.id };
  } catch (e) {
    return fail(e);
  }
}

/** Email a supplier one PO: its lines, due date and a link to their Weft page. */
export async function sendPoEmail(supplierId: string, poId: string): Promise<SendResult> {
  if (!emailConfigured()) return skip("RESEND_API_KEY not set");
  try {
    const [sup, po] = await Promise.all([supplierById(supplierId), poFor(supplierId, poId)]);
    if (!sup) return { error: `Unknown supplier ${supplierId}` };
    if (!po) return { error: `Unknown PO ${poId}` };
    if (!sup.email) return skip(`${sup.name} has no email`);
    const url = `${appUrl()}/supplier/${supplierId}`;
    const due = fmtDate(po.eta);
    const html = layout(
      `Hi ${esc(sup.contact)}, here is ${po.id}`,
      `<table style="border-collapse:collapse;margin:8px 0 16px">${row("PO", po.id)}${row("Item", esc(po.label))}` +
        `${row("Qty", String(po.qty))}${row("Unit price", inr(po.unitPrice))}${row("Due", due)}</table>` +
        `${button(url, "Open in Weft")}<p>Thank you.</p>`,
    );
    const text = `Hi ${sup.contact},\n\n${po.id}: ${po.label}\nQty ${po.qty} at ${inr(po.unitPrice)} each, due ${due}\n\nOpen it in Weft: ${url}\n`;
    return deliver(sup.email, `${po.id}: ${po.qty} pcs of ${po.label}`, html, text);
  } catch (e) {
    return fail(e);
  }
}

/** Email a supplier a check-in question with one-tap answers. */
export async function sendCheckInEmail(supplierId: string, checkInId: string): Promise<SendResult> {
  if (!emailConfigured()) return skip("RESEND_API_KEY not set");
  try {
    const [sup, ci] = await Promise.all([supplierById(supplierId), checkInFor(supplierId, checkInId)]);
    if (!sup) return { error: `Unknown supplier ${supplierId}` };
    if (!ci) return { error: `Unknown check-in ${checkInId}` };
    if (!sup.email) return skip(`${sup.name} has no email`);
    const url = `${appUrl()}/supplier/${supplierId}`;
    const yes = `${url}?checkin=${ci.id}&answer=yes`;
    const html = layout(
      `Hi ${esc(sup.contact)}, a quick check`,
      `<p>${esc(ci.question)}</p><p style="color:#555">Due ${fmtDate(ci.due)}</p>` +
        `${button(yes, "Yes, arrived")}${button(url, "Delayed? Tell us a date")}`,
    );
    const text = `Hi ${sup.contact},\n\n${ci.question} (due ${fmtDate(ci.due)})\n\nYes, it arrived: ${yes}\nDelayed: ${url}\n`;
    return deliver(sup.email, `Weft: ${ci.question}`, html, text);
  } catch (e) {
    return fail(e);
  }
}
