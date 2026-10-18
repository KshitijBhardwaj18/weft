import { chromium } from "playwright";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto("http://127.0.0.1:8799/panel.html"); await p.waitForSelector("body[data-ready]"); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
const n = await p.locator(".f").count();
for (let i = 0; i < n; i++) await p.locator("#p" + i).screenshot({ path: `/tmp/demo-rec/panels/p${String(i).padStart(2, "0")}.png` });
console.log("panels", n); await b.close();
