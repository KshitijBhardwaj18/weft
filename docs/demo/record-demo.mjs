// Records the Weft hackathon demo: problem and solution infographics, a real walkthrough, and how we use FalkorDB.
// Needs the app on BASE (freshly seeded, Countdown) and docs/ served on DOCS. Output: a .webm in DEMO_OUT, stills in DEMO_SHOTS.
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DOCS = process.env.DOCS ?? "http://127.0.0.1:8777";
const SHOTS = process.env.DEMO_SHOTS ?? "./shots";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: process.env.DEMO_OUT ?? "./out", size: { width: 1440, height: 900 } },
});
await context.addInitScript(() => { window.CAPTURE = true; });
const page = await context.newPage();
const t0 = Date.now();
const marks = [];
const mark = (name) => marks.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${name}`);
let shot = 0;
const snap = (name) => page.screenshot({ path: `${SHOTS}/${String(++shot).padStart(2, "0")}-${name}.png` });

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
  await page.waitForTimeout(ms);
}

// Shared look for the infographic cards: canvas, fathom, EB Garamond headings, staggered rise.
const CSS = `<style>
#demo-card{position:fixed;inset:0;z-index:999998;background:#F4F3EC;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;font-family:Figtree,system-ui,sans-serif;color:#1A1A1A;text-align:center;padding:50px 60px 110px}
#demo-card .eb{font:700 14px Figtree;letter-spacing:.14em;text-transform:uppercase;color:#034F46}
#demo-card .h{font:400 54px/1.08 'EB Garamond',Georgia,serif;letter-spacing:-1.2px;max-width:1150px}
#demo-card .h em{color:#034F46}
#demo-card .s{font:500 20px/1.5 Figtree;color:#5F5E5A;max-width:900px}
#demo-card .r{opacity:0;animation:rise .7s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--d,0s)}
#demo-card .f{opacity:0;animation:fade .7s ease forwards;animation-delay:var(--d,0s)}
@keyframes fade{to{opacity:1}}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
#demo-card .row{display:flex;gap:16px;justify-content:center;align-items:stretch;flex-wrap:wrap;max-width:1240px}
#demo-card .box{background:#FFFEF8;border:1px solid rgba(26,26,26,.12);border-radius:16px;padding:18px 20px;text-align:left;font:500 16px/1.45 Figtree;width:270px}
#demo-card .box b{display:block;font:700 13px Figtree;letter-spacing:.1em;text-transform:uppercase;color:#034F46;margin-bottom:6px}
#demo-card .box .tool{font:600 20px Figtree;margin-bottom:4px}
#demo-card .box.dark{background:#034F46;color:#CFE6E1;border-color:#034F46}
#demo-card .box.dark b{color:#FFFEF8}
#demo-card .box.bad{border-color:#E8B9B9;background:#FFF8F6}
#demo-card .box.bad b{color:#7F1C34}
#demo-card .pill{display:inline-block;font:700 12px Figtree;padding:3px 10px;border-radius:999px;background:#F8E4E4;color:#7F1C34;margin-top:8px}
#demo-card .arrow{align-self:center;font:600 30px Figtree;color:#5F5E5A}
#demo-card table{border-collapse:collapse;background:#FFFEF8;border-radius:14px;overflow:hidden;border:1px solid rgba(26,26,26,.12);font:500 17px/1.4 Figtree;text-align:left;max-width:1150px}
#demo-card td{padding:12px 18px;border-bottom:1px solid rgba(26,26,26,.08);vertical-align:top}
#demo-card td:first-child{font:600 16px 'JetBrains Mono',ui-monospace,monospace;color:#034F46;white-space:nowrap}
#demo-card .ring{position:relative;width:640px;height:400px}
#demo-card .ring .c{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:210px;height:210px;border-radius:50%;background:#034F46;color:#FFFEF8;display:flex;align-items:center;justify-content:center;font:400 28px/1.15 'EB Garamond',Georgia,serif;padding:20px}
#demo-card .ring .n{position:absolute;transform:translate(-50%,-50%);background:#FFFEF8;border:1.5px solid #034F46;border-radius:999px;padding:10px 20px;font:700 18px Figtree;color:#034F46;white-space:nowrap}
#demo-card .ring .n i{display:block;font:500 13px Figtree;color:#5F5E5A;font-style:normal}
</style>`;

async function card(name, html, ms) {
  mark(name);
  await page.evaluate((h) => {
    document.getElementById("demo-cap")?.remove();
    document.getElementById("demo-card")?.remove();
    const d = document.createElement("div");
    d.id = "demo-card";
    d.innerHTML = h;
    document.body.appendChild(d);
  }, CSS + html);
  await page.waitForTimeout(Math.min(ms, 3500));
  await snap(name);
  await page.waitForTimeout(Math.max(0, ms - 3500));
}
const clearCard = () => page.evaluate(() => document.getElementById("demo-card")?.remove());
const d = (s) => `style="--d:${s}s"`;

// One animated figure from the archived blog, alone on the canvas.
async function scene(id, name, text, ms) {
  mark(name);
  await page.goto(`${DOCS}/blog/archive/index-v1-countdown.html`, { waitUntil: "networkidle" });
  await page.evaluate((id) => {
    const fig = document.getElementById(id);
    const w = document.createElement("div");
    w.style.cssText = "position:fixed;inset:0;background:#F4F3EC;display:flex;align-items:center;justify-content:center;padding-bottom:70px";
    fig.style.cssText = "width:1180px;max-width:1180px;margin:0";
    fig.querySelector(".replay")?.remove();
    fig.querySelector("figcaption")?.remove();
    w.appendChild(fig);
    document.body.replaceChildren(w);
    fig.getAnimations({ subtree: true }).forEach((a) => { a.currentTime = 0; a.play(); });
  }, id);
  await caption(text, Math.min(ms, 7000));
  await snap(name);
  await page.waitForTimeout(Math.max(0, ms - 7000));
}

const settle = async () => { await page.waitForLoadState("networkidle"); await page.waitForTimeout(800); };

// ---------------- 1. Title
await page.goto(BASE + "/");
await settle();
await card("title",
  `<div class="eb r">Weft · FalkorDB Graph Hacks</div>
   <div class="h r" ${d(0.2)}>One live plan, from planning<br>to <em>restock</em></div>
   <div class="s r" ${d(0.6)}>Case study: the Black Drop, a premium fitness-wear brand in India. 3 styles, 15 SKUs, 2,100 units, 3 factories, 3 creators.</div>`, 6000);

// ---------------- 2. Problem
await card("problem-tools",
  `<div class="eb r">The problem</div>
   <div class="h r" ${d(0.2)}>Every stage of a product lives in a <em>different tool</em></div>
   <div class="row">
     <div class="box r" ${d(0.8)}><b>Plan</b><div class="tool">Spreadsheet</div>Styles, SKUs, units, sample approvals</div>
     <div class="box r" ${d(1.3)}><b>Make</b><div class="tool">WhatsApp groups</div>Factory dates, delays, QC photos</div>
     <div class="box r" ${d(1.8)}><b>Sell</b><div class="tool">Shopify</div>Orders, refunds, creator codes</div>
     <div class="box r" ${d(2.3)}><b>Restock</b><div class="tool">Founder's memory</div>What sold, what to reorder, when</div>
   </div>
   <div class="row r" ${d(3.2)}><div class="box dark" style="width:auto;max-width:900px;text-align:center"><b>The founder is the router</b>Every update is carried by hand from one tool to the next, every day.</div></div>`, 10000);

await scene("s-problem", "problem-scene", "Thirteen days before launch, the factory says the fabric is late. The message sinks in a chat. The tracker still says on track, and the shop and three creator posts still say 1 Dec.", 10000);

await page.goto(BASE + "/");
await settle();
await card("problem-joins",
  `<div class="eb r">Where it breaks</div>
   <div class="h r" ${d(0.2)}>The failures happen <em>at the joins</em></div>
   <div class="row">
     <div class="box bad r" ${d(0.8)} style="width:350px"><b>Make → Launch</b>A fabric delay sits in a factory chat. Nobody connects it to the creator posts promising the drop date.<div class="pill">Launch slips, posts break</div></div>
     <div class="box bad r" ${d(1.6)} style="width:350px"><b>Sell → Restock</b>Size M sells out on day 4. The reorder waits a week, because nobody compared sell rate with lead time.<div class="pill">Lost sales</div></div>
     <div class="box bad r" ${d(2.4)} style="width:350px"><b>Restock → Plan</b>The restock lands, but the stock count is never updated. The next reorder is wrong too.<div class="pill">Wrong stock</div></div>
   </div>
   <div class="s r" ${d(3.4)}>Each tool sees one stage. Nothing sees the connections.</div>`, 11000);

// ---------------- 3. Solution
const ringNode = (x, y, t, sub, delay) => `<div class="n f" style="left:${x}%;top:${y}%;--d:${delay}s">${t}<i>${sub}</i></div>`;
await card("solution-loop",
  `<div class="eb r">The solution</div>
   <div class="h r" ${d(0.2)}>One live plan per drop, <em>as a graph</em></div>
   <div class="ring">
     <div class="c f" ${d(0.6)}>One FalkorDB graph</div>
     ${ringNode(50, 6, "Plan", "drop · styles · SKUs", 1.0)}
     ${ringNode(88, 26, "Make", "POs · check-ins", 1.4)}
     ${ringNode(88, 74, "Launch", "drop date · creator posts", 1.8)}
     ${ringNode(50, 94, "Sell", "orders · returns", 2.2)}
     ${ringNode(12, 74, "Restock", "draft · PO · receipt", 2.6)}
     ${ringNode(12, 26, "Learn", "decisions · creators", 3.0)}
   </div>
   <div class="s r" ${d(3.6)}>Every stage reads and writes the same graph, so a change anywhere shows what it breaks everywhere.</div>`, 10000);

await scene("s-graph", "solution-graph", "The same pieces, connected: supplier → PO → SKUs → style → drop ← creator posts. Three AI teammates work on that one graph.", 9000);

await page.goto(BASE + "/");
await settle();
await card("solution-connect",
  `<div class="eb r">How it connects</div>
   <div class="h r" ${d(0.2)}>Sources feed one graph. <em>Teammates</em> read it.</div>
   <div class="row" style="align-items:stretch">
     <div class="box r" ${d(0.8)} style="width:330px"><b>Sources in</b>Shopify orders, refunds, inventory (HMAC-verified webhooks)<br>Supplier check-ins by app, email (Resend), WhatsApp<br>Creator discount codes</div>
     <div class="arrow r" ${d(1.3)}>→</div>
     <div class="box dark r" ${d(1.6)} style="width:330px"><b>FalkorDB graph</b>The live plan, a day-9 snapshot and a copy per scenario.<br>Every message, call and decision links to its source.</div>
     <div class="arrow r" ${d(2.1)}>→</div>
     <div class="box r" ${d(2.4)} style="width:330px"><b>Teammates out</b>Weft · chief of staff<br>Shuttle · production<br>Pattern · sales<br>Read-only <code>run_cypher</code>. See why shows every query.</div>
   </div>
   <div class="s r" ${d(3.2)}>Teammates propose. An Owner or Manager decides. Nothing changes the plan silently.</div>`, 10000);
await clearCard();

// ---------------- 4. Walkthrough (real app)
mark("walkthrough");
await caption("THE REAL APP · 1 PLAN. Countdown, 18 Nov: thirteen days to the Black Drop. POs, samples, creators and suppliers on one graph.", 5000);
await snap("today");

await page.goto(BASE + "/supplier/sri");
await settle();
await caption("2 MAKE. Murugan at Sri Lakshmi sees only his POs. Shuttle asks before a date is due: is the fabric in for PO-014?", 4500);
const checkin = page.locator(".card", { hasText: "Shuttle · check-in" });
await checkin.getByRole("button", { name: "Delayed → pick a date" }).click();
await page.waitForTimeout(700);
await checkin.getByRole("button", { name: "Send", exact: true }).click();
await page.waitForTimeout(1500);
await caption("One tap: delayed to 28 Nov. That answer becomes a fact on the graph and raises a delay call.", 4000);

await page.goto(BASE + "/");
await settle();
await caption("Your call. Weft walked PO-014 → SKUs → Core Leggings → Black Drop ← creator posts: 4 days late, 3 posts promising 1 Dec break.", 5500);
await snap("call");
await page.getByRole("link", { name: "Scenario" }).first().click();
await settle();
await caption("Scenario: GRAPH.COPY makes a private copy of the whole plan. The change happens only in the copy.", 4000);
await page.locator("#scn-to").selectOption("kavya");
await page.getByRole("button", { name: "Create scenario" }).click();
await page.getByText("Changes in this scenario").waitFor({ timeout: 30000 });
await page.waitForTimeout(800);
await caption("Same question, two graphs. Sri Lakshmi: late, 3 posts break. Kavya Garments: on time, all posts kept, +₹12,000.", 6000);
await snap("scenario");
await page.getByRole("button", { name: "Apply to plan" }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Yes, apply to plan" }).click();
await page.waitForURL(/production/, { timeout: 30000 });
await settle();
await caption("Applied. PO-014 moves to Kavya, due 28 Nov, and the decision is recorded with who and when.", 4500);

await page.goto(BASE + "/");
await settle();
await page.click("button.ask");
await page.fill("#ask-input", "Why did we pick Sri Lakshmi in the first place?");
await page.keyboard.press("Enter");
await caption("Ask a teammate. It answers by querying the graph read-only, and cites the decision and the messages behind it.", 2500);
await page.waitForSelector("text=/See why · \\d+ quer/", { timeout: 120000 });
await page.waitForTimeout(800);
await page.locator("text=/See why · \\d+ quer/").first().click().catch(() => {});
await caption("See why lists every Cypher query the teammate ran, with its row count. No black box.", 5000);
await snap("ask");
await page.keyboard.press("Escape");

await page.goto(BASE + "/map?search=olive");
await settle();
await caption("Brand map: the whole plan as a graph. Full-text search for olive highlights every matching node.", 4500);

await page.goto(BASE + "/");
await settle();
await page.getByRole("button", { name: /Live · 10 Dec/ }).click();
await settle();
await caption("3 SELL. Live, day 9: 62% sold, 1,307 of 2,100 units, ₹27.4L. Black leggings M sold out on day 4.", 5500);
await snap("live");
await page.locator(".call", { hasText: "Drafted a restock" }).getByRole("button", { name: "Approve PO" }).click();
await page.waitForTimeout(1500);
await caption("4 RESTOCK. Pattern drafted the reorder from sell rate × lead time − stock − incoming. Approved: PO-020 for Kavya.", 5000);
await page.reload();
await settle();
await caption("The restock leaves Restock now, because the open PO already covers it. Nothing is ordered twice.", 4500);

await page.goto(BASE + "/production");
await settle();
await page.locator(".po-card", { hasText: "PO-020" }).getByRole("button", { name: "Mark received" }).click();
await page.waitForTimeout(1500);
await caption("Goods arrive. Mark PO-020 received, and its quantity goes onto stock.", 4000);
await page.goto(BASE + "/drop");
await settle();
await caption("Black leggings M: on hand 340, up from 0. Planned, made, sold, restocked, received. The loop is closed.", 5500);
await snap("stock");

// ---------------- 5. FalkorDB
await scene("s-model", "falkor-model", "Under the hood: the graph data model. Every node has an id, and calls and decisions link back to the message they came from.", 7000);
await page.goto(BASE + "/");
await settle();
const row = (f, w, delay) => `<tr class="r" style="--d:${delay}s"><td>${f}</td><td>${w}</td></tr>`;
await card("falkor-features",
  `<div class="eb r">How we use FalkorDB</div>
   <div class="h r" ${d(0.2)} style="font-size:46px">Every feature maps to <em>something the app does</em></div>
   <table>
     ${row("Multi-hop Cypher", "Delay impact: PO → SKU → Style → Drop ← CreatorPost ← Creator, inside every step", 0.7)}
     ${row("GRAPH.COPY", "Scenarios are full copies of the plan; Apply to plan copies one back", 1.2)}
     ${row("Multiple graphs", "weft (plan), weft_live (day 9), weft_meta (settings), weft_scn* (scenarios)", 1.7)}
     ${row("algo.pageRank", "Supplier risk over MADE_BY edges: single points of failure", 2.2)}
     ${row("Full-text + range indexes", "Brand map search; every {id: …} lookup", 2.7)}
     ${row("GRAPH.RO_QUERY", "Every teammate tool call is read-only, and listed under See why", 3.2)}
   </table>`, 12000);

// ---------------- 6. Close
await card("close",
  `<div class="eb r">Weft</div>
   <div class="h r" ${d(0.2)}>Plan → Make → Sell → <em>Restock</em>, on one graph</div>
   <div class="row" style="max-width:1100px">
     <div class="box r" ${d(0.8)} style="width:520px"><b>Built and shown</b>Plan graph · delay impact · scenarios · supplier check-ins and chat · teammates with See why · sell-through and creators · restock → PO → receipt</div>
     <div class="box r" ${d(1.3)} style="width:520px"><b>Next</b>Create drops and POs in the app · sign-in · a live Shopify store end to end · supplier reliability scores · vector search over messages</div>
   </div>
   <div class="s r" ${d(2.0)}>github.com/KshitijBhardwaj18/weft</div>`, 9000);

const video = page.video();
await context.close();
await browser.close();
console.log(marks.join("\n"));
console.log("VIDEO", await video.path());
