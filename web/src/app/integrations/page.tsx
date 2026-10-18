import { headers } from "next/headers";
import { SimulateOrder, SyncShop } from "@/components/IntegrationActions";
import { emailConfigured } from "@/lib/integrations/email";
import { shopifyConfigured, shopifyStore } from "@/lib/integrations/shopify";
import { whatsappConfigured } from "@/lib/integrations/whatsapp";
import { phase } from "@/lib/plan";

export const dynamic = "force-dynamic";

function Status({ on }: { on: boolean }) {
  return <span className={`badge ${on ? "ok" : "risk"}`}>{on ? "Connected" : "Not connected"}</span>;
}

export default async function Integrations() {
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const live = (await phase()) === "live";
  const code = (s: string) => <code className="mono" style={{ fontSize: 13, background: "var(--raised)", padding: "2px 6px", borderRadius: 6 }}>{s}</code>;

  return (
    <>
      <div>
        <div className="muted" style={{ fontSize: 13 }}>Commerce</div>
        <h1 className="h1" style={{ fontSize: 44, marginTop: 6 }}>Your shop and your suppliers, <em>on the same plan.</em></h1>
        <p className="lede" style={{ fontSize: 15, maxWidth: 760 }}>Orders, refunds and stock come in from the shop. Check-ins and orders go out to suppliers by email and WhatsApp. Everything lands on the same graph.</p>
      </div>

      <section className="grid">
        <div className="card">
          <div className="card-head"><h2>Shopify</h2><Status on={shopifyConfigured()} /></div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>Orders, refunds, discount codes and inventory. Each order updates sold and on-hand stock on the SKU, and credits the creator whose code was used.</div>
          {shopifyConfigured() ? <><div className="muted" style={{ fontSize: 13 }}>Store: {shopifyStore()}</div><SyncShop /></> : <div className="muted" style={{ fontSize: 13 }}>Set {code("SHOPIFY_STORE_DOMAIN")} and {code("SHOPIFY_ADMIN_TOKEN")}.</div>}
          <div className="muted" style={{ fontSize: 13 }}>Webhooks: {code(`${origin}/api/integrations/shopify/webhook`)} for orders/create, refunds/create and inventory_levels/update (HMAC-verified).</div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Email · Resend</h2><Status on={emailConfigured()} /></div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>Purchase orders and Shuttle&apos;s check-ins go to the supplier&apos;s inbox, with a signed link to their own page and a one-tap &ldquo;Yes, arrived&rdquo;.</div>
          {!emailConfigured() && <div className="muted" style={{ fontSize: 13 }}>Set {code("RESEND_API_KEY")} and {code("RESEND_FROM")}.</div>}
        </div>
        <div className="card">
          <div className="card-head"><h2>WhatsApp</h2><Status on={whatsappConfigured()} /></div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>Check-ins arrive as reply buttons on the supplier&apos;s phone, and their replies land in the supplier chat, where Shuttle reads them.</div>
          {!whatsappConfigured() ? <div className="muted" style={{ fontSize: 13 }}>Set {code("WHATSAPP_TOKEN")} and {code("WHATSAPP_PHONE_NUMBER_ID")}.</div> : null}
          <div className="muted" style={{ fontSize: 13 }}>Webhook: {code(`${origin}/api/integrations/whatsapp/webhook`)}</div>
        </div>
      </section>

      <section className="card" style={{ maxWidth: 760 }}>
        <div className="card-head"><h2>Demo shop</h2><span className="muted" style={{ fontSize: 13 }}>same code path as Shopify&apos;s order webhook</span></div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>No store connected? Send a test order. Watch sell-through, stock and creator orders change on Today and the Drop page.</div>
        <SimulateOrder live={live} />
      </section>
    </>
  );
}
