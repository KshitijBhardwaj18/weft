import { NextResponse } from "next/server";
import { shopifyConfigured, shopifyStore, syncShop } from "@/lib/integrations/shopify";

export const dynamic = "force-dynamic";

// Pulls Shopify orders and inventory into the plan graph.
export async function POST(req: Request) {
  if (!shopifyConfigured()) {
    return NextResponse.json({ error: "Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN in web/.env.local" }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as { since?: string };
  try {
    return NextResponse.json(await syncShop({ since: body.since ?? "2026-01-01" }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

// Reports whether Shopify is configured and which store it points at.
export async function GET() {
  return NextResponse.json({ configured: shopifyConfigured(), store: shopifyStore() });
}
