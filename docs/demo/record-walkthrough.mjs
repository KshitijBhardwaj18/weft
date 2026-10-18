import { chromium } from "playwright";
const BASE = "http://localhost:3200";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: "/tmp/demo-rec/out3", size: { width: 1440, height: 900 } } });
await ctx.addCookies([{ name: "weft_session", value: "demo", url: BASE }, { name: "weft_as", value: "kshitij", url: BASE }]);
const page = await ctx.newPage();
async function cap(t, ms = 4500) {
  await page.evaluate((t) => {
    let el = document.getElementById("demo-cap");
    if (!el) { el = document.createElement("div"); el.id = "demo-cap";
      el.style.cssText = "position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:999999;background:rgba(3,79,70,.96);color:#FFFFEB;padding:14px 26px;border-radius:14px;font:600 18px Figtree,system-ui,sans-serif;max-width:76vw;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.28);pointer-events:none;line-height:1.45";
      document.body.appendChild(el); }
    el.textContent = t;
  }, t);
  await page.waitForTimeout(ms);
}
async function chapter(k, t, ms = 2600) {
  await page.evaluate(([k, t]) => {
    document.getElementById("demo-cap")?.remove();
    const d = document.createElement("div"); d.id = "demo-ch";
    d.style.cssText = "position:fixed;inset:0;z-index:999998;background:#034F46;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center";
    d.innerHTML = `<div style="font:700 16px Figtree;letter-spacing:.16em;text-transform:uppercase;color:#CFE6E1">${k}</div><div style="font:400 64px 'EB Garamond',Georgia,serif;color:#FFFFEB;letter-spacing:-1.4px;max-width:1100px;line-height:1.05">${t}</div>`;
    document.body.appendChild(d);
  }, [k, t]);
  await page.waitForTimeout(ms);
  await page.evaluate(() => document.getElementById("demo-ch")?.remove());
}
const settle = async () => { await page.waitForLoadState("networkidle"); await page.waitForTimeout(700); };
async function ask(q, ms = 7000) {
  await page.click("button.ask");
  await page.fill("#ask-input", q);
  await page.keyboard.press("Enter");
  await page.waitForSelector("text=/See why · \\d+ quer/", { timeout: 120000 });
  await page.waitForTimeout(800);
  await page.locator("text=/See why · \\d+ quer/").last().click().catch(() => {});
  await page.waitForTimeout(ms);
  await page.keyboard.press("Escape");
}

await page.goto(BASE + "/"); await settle();
await chapter("Plan", "Kshitij's brand is thirteen days from launching its next collection.");
await cap("Today: every product, factory order, sample, creator and supplier in one live plan. Three AI teammates work on it.", 5500);
await page.goto(BASE + "/production"); await settle();
await cap("Production: every factory order and where it is, from fabric to the warehouse.", 4500);

await page.goto(BASE + "/supplier/sri"); await settle();
await chapter("Make", "A supplier slips.");
await cap("Suppliers get their own view: only their orders, and Shuttle's check-ins before anything is due.", 4500);
const ci = page.locator(".card", { hasText: "Shuttle · check-in" });
await ci.getByRole("button", { name: "Delayed → pick a date" }).click();
await page.waitForTimeout(800);
await ci.getByRole("button", { name: "Send", exact: true }).click();
await page.waitForTimeout(1800);
await cap("Murugan answers in one tap: the fabric is delayed to 28 Nov.", 3500);
await page.goto(BASE + "/"); await settle();
await cap("Shuttle traces the impact through the plan: the leggings land after launch, and three creator posts promising 1 Dec break.", 6000);
await page.getByRole("link", { name: "Scenario" }).first().click(); await settle();
await cap("Before changing anything, test it. A scenario is a private copy of the whole plan.", 4000);
await page.locator("#scn-to").selectOption("kavya");
await page.getByRole("button", { name: "Create scenario" }).click();
await page.getByText("Changes in this scenario").waitFor({ timeout: 30000 }); await page.waitForTimeout(600);
await cap("Two futures side by side: stay with Sri Lakshmi and launch late, or move to Kavya and land on time for ₹12,000 more.", 6500);
await page.getByRole("button", { name: "Apply to plan" }).click();
await page.getByRole("button", { name: "Yes, apply to plan" }).click();
await page.waitForURL(/production/, { timeout: 30000 }); await settle();
await cap("Applied. The order moves to Kavya, the supplier is notified, and the decision is recorded with who made it and why.", 5000);

await page.goto(BASE + "/"); await settle();
await page.getByRole("button", { name: /Live · 10 Dec/ }).click(); await settle();
await chapter("Sell", "Launch day came and went. Nine days later:");
await cap("62% of the collection sold, ₹27.4L in revenue. Orders, returns and creator codes flow in from the shop.", 5500);
await cap("Sell-through by size: black leggings M sold out on day 4. The olive tank is slow, and coming back \"too short\".", 5500);
await page.goto(BASE + "/drop"); await settle();
await cap("Every product's lifeline on one row: who made it, planned, sold, on hand, returns and the fit notes behind them.", 5500);
await page.goto(BASE + "/"); await settle();
await ask("How is the Black Drop doing, and what should I do next?", 7500);
await cap("Pattern, the sales analyst, answers from the live plan: what's selling, what's running out, which creators drive repeat buyers, and what to do next.", 3500);

await chapter("Restock", "Reorder before it hurts.");
await page.locator(".call", { hasText: "Drafted a restock" }).getByRole("button", { name: "Approve PO" }).click();
await page.waitForTimeout(1500);
await cap("Pattern drafted the reorder from sell rate, lead time and stock. One approval sends a purchase order to Kavya.", 5000);
await page.goto(BASE + "/production"); await settle();
await cap("The new order is on the production board. When the boxes arrive, mark it received.", 4000);
await page.locator(".po-card", { hasText: "PO-020" }).getByRole("button", { name: "Mark received" }).click();
await page.waitForTimeout(1500);
await page.goto(BASE + "/drop"); await settle();
await cap("Stock is back: 340 on hand. Sold, reordered, received, and the plan already knows.", 5000);

await page.goto(BASE + "/"); await settle();
await chapter("Learn", "Nothing decided is ever lost.");
await ask("Why did we move PO-014 to Kavya Garments?", 7000);
await cap("Ask why, months later. Every answer shows exactly where it came from.", 3500);
await page.goto(BASE + "/map?search=olive"); await settle();
await cap("The Brand map: the whole company as one connected graph.", 4500);

const v = page.video(); await ctx.close(); await b.close();
console.log("VIDEO", await v.path());
