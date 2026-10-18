# Demo script (about 4 minutes)

**Before recording**
1. `cd web && pnpm seed` — resets both graphs and sets the clock to Countdown.
2. Open http://localhost:3000 (or the running dev server) at 1440px wide or larger, browser zoom 100%.
3. Close the Next.js dev badge if it's showing. Have a second tab ready on http://localhost:3000/supplier/sri.

## Act 0 — the problem (20 s)
> "A small D2C brand runs on a dozen WhatsApp groups and spreadsheets. When a factory slips, nobody sees what else breaks until a customer or a creator notices. Weft keeps one live plan for every drop, as a FalkorDB graph, with AI teammates that chase the updates."

## Act 1 — Countdown, 18 Nov (2 min)
1. **Today.** "Thirteen days until the Black Drop: 3 styles, 15 SKUs, 2,100 units. One supplier has gone quiet." Point at **Single points of failure**: "PageRank over the supply graph: Sri Lakshmi Knits carries 9 SKUs."
2. **Switch to the supplier tab** (`/supplier/sri`). "This is what Murugan at the factory sees: only his POs and Shuttle's check-in." Click **Delayed → pick a date**, keep **28 Nov**, **Send**.
3. **Back to Today, refresh.** Read the new call: "Shuttle didn't change the plan. It walked the graph: PO-014 → SKUs → Core Leggings → Black Drop ← creator posts. It lands around 5 Dec, 4 days late, and breaks 3 creator posts announcing 1 December."
4. Click **Scenario** on that call. Pick **PO-014 → Kavya Garments**, **Create scenario**. "This is GRAPH.COPY: a full private copy of the plan, with the change made only in the copy." Read the comparison: 5 Dec vs 28 Nov, Late vs On time, 3 broken posts vs all kept, +₹12,000.
5. **Apply to plan → Yes.** "The scenario graph is copied back over the plan and the decision is recorded." Production opens: PO-014 is now at Kavya Garments, due 28 Nov.
6. Press **⌘J**, ask **"Why did we move PO-014 to Kavya?"** then **"Why did we pick Sri Lakshmi in the first place?"** Open **See why**: "every Cypher query the teammate ran, and the messages it traced back to." Click **Show on Brand map**.

## Act 2 — Live, day 9 (1 min 20 s)
7. Back on **Today**, click **Live · 10 Dec** on the demo clock. "Nine days after launch." Read: 62% sold, ₹27.4L, the heatmap: "black leggings M sold out on day 4, olive tank is crawling."
8. **⌘J**: **"How is the Black Drop doing, and what should I do next?"** Pattern answers: the sell-out, S and L running low, the olive tank's "too short" returns, the restock and Kavya's date change, all cited from the graph.
9. Ask **"Why are olive tanks coming back too short?"** — Pattern follows SKU → Style → fit sample note ("body length −2 cm").
10. In **Your call**, click **Approve PO** on Pattern's restock. "Pattern drafted it, a manager approved it, and it becomes PO-022 for Kavya, landing 20 December."
11. **Brand map**, search **olive**: "the full-text index, on the same graph."

## Close (15 s)
> "One graph for the whole drop: GRAPH.COPY for scenarios, multi-hop Cypher for impact, PageRank for risk, full-text search, and three teammates that answer by querying it — every answer with its path."
