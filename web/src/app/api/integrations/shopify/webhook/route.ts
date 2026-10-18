import { NextResponse } from "next/server";
import {
  applyInventoryWebhook,
  applyOrderWebhook,
  applyRefundWebhook,
  verifyWebhook,
  type RestInventoryLevel,
  type RestOrder,
  type RestRefund,
} from "@/lib/integrations/shopify";

export const dynamic = "force-dynamic";

// Receives Shopify webhooks: verifies the HMAC on the raw body, then routes by topic.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("X-Shopify-Hmac-Sha256"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const topic = req.headers.get("X-Shopify-Topic") ?? "";
  switch (topic) {
    case "orders/create":
      await applyOrderWebhook(JSON.parse(raw) as RestOrder);
      break;
    case "refunds/create":
      await applyRefundWebhook(JSON.parse(raw) as RestRefund);
      break;
    case "inventory_levels/update":
      if (!(await applyInventoryWebhook(JSON.parse(raw) as RestInventoryLevel))) return NextResponse.json({ ignored: topic });
      break;
    default:
      return NextResponse.json({ ignored: topic });
  }
  return NextResponse.json({ ok: true });
}
