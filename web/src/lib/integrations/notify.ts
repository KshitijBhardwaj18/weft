import { checkInFor, fmtDate, inr, poFor, sendCheckInEmail, sendPoEmail, supplierById, type SendResult } from "./email";
import { sendCheckInButtons, sendPoTemplate } from "./whatsapp";

export type NotifyEvent = { kind: "po"; poId: string } | { kind: "checkin"; checkInId: string };
export type NotifyResult = { email: SendResult; whatsapp: SendResult };

/** Tell a supplier about a PO or check-in by email and WhatsApp. Never throws. */
export async function notifySupplier(supplierId: string, event: NotifyEvent): Promise<NotifyResult> {
  try {
    const sup = await supplierById(supplierId);
    if (!sup) throw new Error(`Unknown supplier ${supplierId}`);
    const [email, whatsapp] = await Promise.all([
      event.kind === "po" ? sendPoEmail(supplierId, event.poId) : sendCheckInEmail(supplierId, event.checkInId),
      sendWhatsApp(sup.whatsapp, supplierId, event),
    ]);
    return { email, whatsapp };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { email: { error }, whatsapp: { error } };
  }
}

/** WhatsApp leg: buttons for a check-in, the approved template for a PO. */
async function sendWhatsApp(to: string | null, supplierId: string, event: NotifyEvent): Promise<SendResult> {
  if (!to) return { skipped: true, reason: "supplier has no WhatsApp number" };
  if (event.kind === "checkin") {
    const ci = await checkInFor(supplierId, event.checkInId);
    if (!ci) return { error: `Unknown check-in ${event.checkInId}` };
    return sendCheckInButtons(to, ci.id, ci.question);
  }
  const po = await poFor(supplierId, event.poId);
  if (!po) return { error: `Unknown PO ${event.poId}` };
  return sendPoTemplate(to, po.id, `${po.qty} pcs of ${po.label} at ${inr(po.unitPrice)} each, due ${fmtDate(po.eta)}`);
}
