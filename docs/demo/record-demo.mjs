import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: process.env.DEMO_OUT ?? "./out", size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
let shot = 0;

async function caption(text, ms = 4500) {
  await page.evaluate((t) => {
    let el = document.getElementById("demo-cap");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-cap";
      el.style.cssText = "position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:999999;background:rgba(26,26,26,.92);color:#FFFEF8;padding:14px 24px;border-radius:14px;font:600 17px Figtree,system-ui,sans-serif;max-width:74vw;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.28);pointer-events:none;line-height:1.45";
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
  await page.screenshot({ path: `${process.env.DEMO_SHOTS ?? "./shots"}/${String(++shot).padStart(2, "0")}.png` });
  await page.waitForTimeout(ms);
}

async function card(html, ms) {
  await page.evaluate((h) => {
    document.getElementById("demo-cap")?.remove();
    const d = document.createElement("div");
    d.id = "demo-card";
    d.style.cssText = "position:fixed;inset:0;z-index:999998;background:#F4F3EC;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;font-family:Figtree,system-ui,sans-serif;color:#1A1A1A;text-align:center;padding:60px";
    d.innerHTML = h;
    document.body.appendChild(d);
  }, html);
  await page.waitForTimeout(ms);
  await page.evaluate(() => document.getElementById("demo-card")?.remove());
}

const eyebrow = (t) => `<div style="font:700 14px Figtree;letter-spacing:.14em;text-transform:uppercase;color:#034F46">${t}</div>`;
const h1 = (t) => `<div style="font:400 60px 'EB Garamond',Georgia,serif;letter-spacing:-1.2px;line-height:1.08;max-width:1000px">${t}</div>`;
const sub = (t) => `<div style="font:500 20px Figtree;color:#5F5E5A;max-width:860px;line-height:1.5">${t}</div>`;

async function settle() {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
}

// ---- 0. Title
await page.goto(BASE + "/");
await settle();
await card(
  eyebrow("Weft") + h1("One live plan, from planning<br>to <em style='color:#034F46'>restock</em>") +
    sub("Case study: the Black Drop, a premium fitness-wear brand. 3 styles, 15 SKUs, 2,100 units, 5 factory orders, 3 creators."),
  5500,
);

// ---- 1. Plan
await caption("1 · PLAN. Thirteen days to the Black Drop. Factory orders, samples, creators and stock sit on one connected graph.", 5000);

// ---- 2. Make: supplier check-in
await page.goto(BASE + "/supplier/sri");
await settle();
await caption("2 · MAKE. Murugan at Sri Lakshmi sees only his own POs and check-ins. Shuttle asks before a date is due.", 4500);
const checkin = page.locator(".card", { hasText: "Shuttle · check-in" });
await checkin.getByRole("button", { name: "Delayed → pick a date" }).click();
await checkin.getByRole("button", { name: "Send", exact: true }).click();
await page.waitForTimeout(1500);
await caption("A delay answer turns into a call. Weft walks PO-014 → SKUs → Core Leggings → Black Drop, and finds the creator posts that promise 1 Dec.", 6000);

// ---- 3. Your call on Today
await page.goto(BASE + "/");
await settle();
await caption("Your call. The Owner or Manager decides. Everything under it is traced to the graph, so nothing is a black box.", 4500);
await page.getByRole("link", { name: "Scenario" }).first().click();
await settle();

// ---- 4. Scenario: copy, change, compare, apply
await caption("Scenario: GRAPH.COPY makes a private copy of the whole plan. We change the copy, never the plan.", 4500);
await page.locator("#scn-to").selectOption("kavya");
await page.getByRole("button", { name: "Create scenario" }).click();
await page.getByText("Changes in this scenario").waitFor({ timeout: 30000 });
await page.waitForTimeout(800);
await caption("Compare the two futures. Sri Lakshmi: late, and three creator posts break. Kavya: on time, for +₹12,000.", 6500);
await page.getByRole("button", { name: "Apply to plan" }).click();
await page.getByRole("button", { name: "Yes, apply to plan" }).click();
await page.waitForURL(/production/, { timeout: 30000 });
await settle();
await caption("Applied. PO-014 now sits with Kavya Garments, due 28 Nov, and the decision is recorded with who made it and when.", 5000);

// ---- 5. How it connects
await card(
  eyebrow("How it connects") +
    h1("Sources feed one graph.<br>Teammates read it, and every answer shows its path.") +
    `<div style="display:flex;gap:18px;align-items:stretch;max-width:1100px;width:100%;margin-top:10px;text-align:left;font:500 16px Figtree;line-height:1.45">
      <div style="flex:1;background:#FFFEF8;border:1px solid rgba(26,26,26,.12);border-radius:14px;padding:18px"><b style="font:700 15px Figtree;color:#034F46">Sources in</b><br>Shopify orders, refunds and inventory (webhooks, HMAC-verified)<br>Supplier check-ins by app, email (Resend) or WhatsApp Cloud API<br>Creator discount codes</div>
      <div style="flex:1;background:#034F46;color:#CFE6E1;border-radius:14px;padding:18px"><b style="font:700 15px Figtree;color:#FFFEF8">FalkorDB graph</b><br>One live plan per drop. Scenarios are GRAPH.COPY copies.<br>Messages, decisions and calls link back to their source.</div>
      <div style="flex:1;background:#FFFEF8;border:1px solid rgba(26,26,26,.12);border-radius:14px;padding:18px"><b style="font:700 15px Figtree;color:#034F46">Teammates out</b><br>Weft (chief of staff), Shuttle (production), Pattern (sales)<br>Each queries the graph read-only with run_cypher<br>See why shows every query and the path behind it</div>
    </div>`,
  8000,
);

// ---- 6. Ask: teammate answers from the graph
await page.goto(BASE + "/");
await settle();
await page.click("button.ask");
await page.fill("#ask-input", "Why did we pick Sri Lakshmi in the first place?");
await page.keyboard.press("Enter");
await caption("Ask a teammate. The answer cites the decision and the messages behind it, and See why shows the queries it ran.", 2500);
await page.waitForSelector("text=/See why · \\d+ quer/", { timeout: 120000 });
await page.waitForTimeout(3000);
await page.keyboard.press("Escape");

// ---- 7. Brand map
await page.goto(BASE + "/map?search=olive");
await settle();
await caption("Brand map: the full-text index on the same graph. Search olive and every node that matches is highlighted.", 5000);

// ---- 8. Live day 9
await page.goto(BASE + "/");
await settle();
await page.getByRole("button", { name: /Live · 10 Dec/ }).click();
await settle();
await caption("2 · SELL. Live, day 9 of the drop: 62% sold, 1,307 of 2,100 units. The heatmap shows black leggings M sold out on day 4.", 6000);

// ---- 9. Restock
await page.locator(".call", { hasText: "Drafted a restock" }).getByRole("button", { name: "Approve PO" }).click();
await page.waitForTimeout(1500);
await caption("3 · RESTOCK. Pattern drafted the reorder from sell-through, stock and lead time. Approve it and it becomes a purchase order for Kavya.", 6000);
await page.reload();
await settle();
await caption("The restock drops off Restock now, because the open PO already covers it. Nothing gets ordered twice.", 5000);

// ---- 10. Goods arrive, stock rises
await page.goto(BASE + "/production");
await settle();
await page.locator(".po-card", { hasText: "PO-020" }).getByRole("button", { name: "Mark received" }).click();
await page.waitForTimeout(1500);
await caption("Goods arrive. Mark PO-020 received, and its quantity goes onto stock.", 4000);
await page.goto(BASE + "/drop");
await settle();
await caption("Black leggings M: on hand 340, up from 0. Sold, reordered, received. The loop is closed.", 6000);

// ---- 11. Close
await card(
  eyebrow("Weft") +
    h1("Plan → Make → Sell → Restock") +
    sub("Built and shown: the plan graph, delay impact, scenarios, supplier check-ins, teammates with See why, sell-through, restock to receipt.<br>Not built yet: creating drops and POs in the app, sign-in, a live Shopify store."),
  7000,
);

const video = page.video();
await context.close();
await browser.close();
console.log("VIDEO", await video.path());
