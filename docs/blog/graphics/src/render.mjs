// Renders each <section class="g"> in graphics.html to docs/blog/graphics/<id>.png (2x).
// Run from a folder with playwright installed: node render.mjs <path-to-graphics.html> <out-dir>
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
const [src, out] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(src).href, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
for (const id of await p.$$eval("section.g", (s) => s.map((x) => x.id))) {
  await p.locator("#" + id).screenshot({ path: `${out}/${id}.png` });
  console.log(id);
}
await b.close();
