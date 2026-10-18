# Weft: one live plan for a D2C product, from planning to restock

Thirteen days before our Black Drop goes live, a message arrives in a WhatsApp group: the fabric for the leggings is late. It sits between a dozen other messages. Three creators have already scheduled posts that say the drop goes live on 1 December. Nothing we use connects the two.

That is the first failure. The second comes later. The drop launches, the black leggings in size M sell out on day four, and the reorder waits a week because nobody checked sell-through against the supplier's lead time. The third is quieter: when the restock arrives, the stock count in the spreadsheet is still wrong.

![Tools that each see one slice of the drop](https://raw.githubusercontent.com/KshitijBhardwaj18/weft/main/docs/blog/assets/01-scattered.gif)

Weft is what we built for FalkorDB's Graph Hacks: Context for AI Agents hackathon. It keeps one live plan for each product, from the first sample to the next restock, stored as a FalkorDB graph. Three AI teammates work on that plan. This post walks through the full loop on one case study, explains why the plan is a graph, and says plainly what is built and what is not.

**Try it live:** https://weft.kshitijbhardwaj.space. Sign in with `founder@blackdrop.in` / `blackdrop` (shown on the login page); a guided tour walks through every feature below and names the FalkorDB feature behind each one.

**Demo video:** https://weft.kshitijbhardwaj.space/weft-demo.mp4

**Code:** https://github.com/KshitijBhardwaj18/weft

## The problem

A D2C product is planned, made, sold and restocked. Each stage has its own tool, and the founder is the one who carries information between them:

- **Planning.** Styles, SKUs and planned units sit in a spreadsheet. Sample approvals sit in a chat.
- **Making.** Purchase orders and delivery dates sit in WhatsApp groups and Excel. A delay is a message, not a fact anyone can query.
- **Selling.** Shopify holds orders, refunds and discount codes. Creators post dates that nobody checks against production.
- **Restocking.** A size sells out, and the reorder waits because sell-through is not compared with lead time. When goods arrive, the stock count is updated by hand, or not at all.
- **Deciding.** A supplier change agreed on a call is never written down, so months later nobody can say why it happened.

Small brands of five to thirty people run this loop every day, and the founder is the router. Every tool sees one stage. The problems that matter sit at the joins, between making and selling and between selling and making again, and they stay invisible until a customer or a creator notices.

## The loop

Weft follows one product through six stages. Each stage reads and writes the same graph, so a change in one stage shows up in the others.

| Stage | Today | With Weft | Status |
|---|---|---|---|
| **Plan** | Styles, SKUs and planned units in a spreadsheet | Drop, styles, SKUs and samples as connected nodes | Seeded in the demo. Creating them in the app is next |
| **Make** | POs and delays in chat and Excel | Check-ins, delay calls with their impact, scenarios | Built |
| **Launch** | Creator post dates in a calendar | The drop date on the same graph as every post and PO that depends on it | Built |
| **Sell** | One Shopify dashboard per question | Orders, refunds and returns written onto SKU and creator nodes | Built. The demo uses seeded orders |
| **Restock** | Judgement, or a late reorder | A restock drafted from sell-through and lead time, a PO on approval, stock up on receipt | Built |
| **Learn** | Decisions kept in memory | Every decision recorded with its source, creators ranked by orders and repeat rate | Partly built |

## The case study: the Black Drop

The case study is a premium fitness-wear brand in India and its first collection, the Black Drop.

- **Styles:** Core Leggings, Sculpt Sports Bra, Everyday Tank. Fifteen SKUs in black and olive, sizes S, M and L.
- **Units:** 2,100 planned for launch on 1 December.
- **Suppliers:** Sri Lakshmi Knits in Tiruppur (14-day lead time) for the leggings and bra, Kavya Garments in Bengaluru (10 days) for the tanks, and Ananya Fabrics for lab dips.
- **Creators:** three fitness creators, each with a discount code, booked to post on 25 November.

The demo runs in two states of the same plan: **Countdown** (18 November, before launch) and **Live** (10 December, day nine).

## Walkthrough

### 1. Plan

The Today screen opens thirteen days before the drop. Production, samples, creators and suppliers are one plan. Every PO and its status comes from the graph, not from a list someone maintains.

### 2. Make: a delay becomes a call

The supplier's view shows Murugan at Sri Lakshmi only his own POs and check-ins. Shuttle, the production teammate, asks before a date is due: *is the fabric in for PO-014?* Murugan answers in one tap: *Yes, arrived*, or *Delayed*, with a new fabric date.

![Shuttle's check-in on PO-014 in the supplier's view](https://raw.githubusercontent.com/KshitijBhardwaj18/weft/main/docs/blog/screens/checkin.png)

That answer is a fact on the graph, and it raises a delay call. Weft walks the impact in one query: from the PO, through its SKUs and style, to the drop, and back in through every creator post that promises the drop date.

```cypher
MATCH (po:PO {id:$po})-[:MADE_BY]->(sup:Supplier), (owner:Person)-[:OWNS]->(po),
      (po)-[:SUPPLIES]->(k:SKU)-[:OF_STYLE]->(s:Style)-[:IN_DROP]->(d:Drop)
OPTIONAL MATCH (cr:Creator)-[:POSTED]->(p:CreatorPost)-[:PROMOTES]->(d)
RETURN po.id AS po, sup.name AS supplier, collect(DISTINCT k.code) AS skus, s.name AS style,
       d.name AS drop, d.date AS dropDate, owner.name AS owner,
       collect(DISTINCT {handle: cr.handle, date: p.date}) AS posts
```

In the demo, the fabric lands four days late, on 5 December, and three creator posts announcing 1 December would break.

![A delay pulse travelling from the supplier to the creators](https://raw.githubusercontent.com/KshitijBhardwaj18/weft/main/docs/blog/assets/02-ripple.gif)

### 3. Scenario: test the change before making it

A scenario is a private copy of the whole plan. We create it with `GRAPH.COPY`, change the copy, and compare it with reality. In the demo, the change is moving PO-014 to Kavya Garments, whose 10-day lead time lands the order before launch.

The comparison asks the same question of both graphs:

| | Reality, with the delay | This scenario |
|---|---|---|
| PO-014 arrives | 5 Dec, 4 days late | 28 Nov, 3 days spare |
| Black Drop, 1 Dec | Late | On time |
| Creator posts announcing "live 1 Dec" | 3 broken | All kept |
| Cost | ₹2,52,000 | ₹2,64,000 (+₹12,000) |

*Apply to plan* copies the scenario over the plan, records the decision with who made it and when, and deletes the scenario graph.

![Copying the plan, re-pointing the PO, and applying the copy back](https://raw.githubusercontent.com/KshitijBhardwaj18/weft/main/docs/blog/assets/03-scenario.gif)

### 4. Sell: day nine of the drop

Switch the clock to Live. Sixty-two percent of the 2,100 units have sold, 1,307 in total. The sell-through heatmap shows black leggings in size M sold out on day four. Revenue, returns and creator ranking come from the same graph.

![Today in Live, day nine: 62 percent sold and the sell-through heatmap](https://raw.githubusercontent.com/KshitijBhardwaj18/weft/main/docs/blog/screens/sell-day9.png)

Creators rank by the orders on their code, with their repeat rate, so the next drop's creator choice starts from evidence.

### 5. Restock to receipt: the loop closes

This is the step that most tools miss. Pattern, the sales teammate, drafts the restock from three inputs: sell rate, supplier lead time and stock on hand.

```
daysLive = max(1, days from drop date to today)
rate     = sold / daysLive
qty      = ceil to 10 of max(0, rate × leadDays − onHand − incoming)
shown    = qty > 0 and days of stock left (onHand / rate) < 7
```

`incoming` is the quantity on POs that have not been received yet. Before this change, the formula ignored open POs, so an approved restock still looked needed. Now an approved restock covers its SKU, and it drops off *Restock now*.

![After approval, the restock leaves Restock now](https://raw.githubusercontent.com/KshitijBhardwaj18/weft/main/docs/blog/screens/restock-closed.png)

Approving the call writes a new PO with a unique id, priced from that SKU's last PO, and notifies the supplier when email or WhatsApp is configured. When the goods arrive, *Mark received* adds the PO's quantity to stock, split evenly across the SKUs the PO supplies. The black leggings in size M go from 0 on hand to 340.

```cypher
MATCH (po:PO {id:$id})-[:SUPPLIES]->(k:SKU)
WITH po, collect(k) AS ks
UNWIND ks AS k
SET k.onHand = coalesce(k.onHand, 0) + toInteger(round(toFloat(po.qty) / size(ks)))
WITH DISTINCT po
SET po.stage = 'Received', po.status = 'received'
```

![The Drop page after receipt: black leggings M on hand 340](https://raw.githubusercontent.com/KshitijBhardwaj18/weft/main/docs/blog/screens/stock-received.png)

Sold, reordered, received. The stock on the Drop page is the same stock the next restock calculation reads.

## How it connects

Three kinds of connection make the loop work. Each one writes to the same graph.

- **Sources in.** Shopify orders, refunds and inventory arrive as webhooks, verified with HMAC. A stock update identifies its SKU through Shopify's inventory item. Supplier check-ins go out by app, by email through Resend, or by WhatsApp Cloud API, and the answer comes back to the graph. Creator discount codes attribute orders to creators.
- **The graph.** One FalkorDB instance holds the live plan (`weft`), the day-nine snapshot (`weft_live`), workspace settings (`weft_meta`) and a copy for each scenario. Messages, decisions and calls each point back to the message or check-in they came from.
- **Teammates out.** Weft (chief of staff), Shuttle (production) and Pattern (sales) are one Claude model with one tool, `run_cypher`. It runs through `GRAPH.RO_QUERY`, so a teammate can read the plan and cannot write to it. A teammate proposes a change as a call, and an Owner or Manager decides it. Every query a teammate runs is listed under *See why*, next to the answer.

![Ask a teammate, and See why shows the queries behind the answer](https://raw.githubusercontent.com/KshitijBhardwaj18/weft/main/docs/blog/screens/ask-see-why.png)

## Why the plan is a graph

The questions that matter are about connections, not records. "Which creator posts break if PO-014 is late?" is not a lookup on the PO. It is a walk from the PO through its SKUs and style to the drop, and back in through every post that promotes it.

A relational schema can answer that with joins written for each question. We wanted the walk to be the query itself, and we wanted the same walk inside every step an agent takes.

FalkorDB does what the product needs:

- **Multi-hop traversal** for delay impact, which runs inside every agent step rather than as a nightly job.
- **Many graphs in one instance.** Each scenario is its own graph, copied with `GRAPH.COPY`.
- **Built-in algorithms.** PageRank over supply edges ranks single points of failure.
- **Full-text and range indexes** back search on the Brand map and every `{id: ...}` lookup.
- **openCypher** is the one query language for the app, the agent tool and the seed script.

## What surprised us

- **`shortestPath` only follows edges in their stated direction.** A call points at a PO, and a decision points at a message, so many *See why* paths run against the arrows. We use a bounded variable-length match instead.
- **Apply is a whole-graph swap.** Applying a scenario copies it over the plan, so a change made to the plan after the copy is lost. A proper merge would take only the scenario's own changes. We have not built that yet.
- **A line PO covers several sizes.** Line-level POs have one quantity for three sizes, so incoming stock is split evenly across the SKUs. A restock PO covers one SKU, so its split is exact.
- **Shopify's inventory webhook does not carry the SKU.** It sends an inventory item id, so the app looks the SKU up. We have not run this against a live store.

## What is built, and what is not

**Built and shown in the demo:** the plan graph, delay impact, scenarios (copy, compare, apply), supplier check-ins and chat, teammate answers with *See why*, sell-through, returns and creator ranking, the restock draft, approval into a PO, and goods receipt into stock.

**Built, not yet run against live services:** Shopify orders, refunds and inventory sync and webhooks, Resend emails and the WhatsApp Cloud API. The demo uses seeded orders and skips these integrations when their keys are not set.

**Not built yet:**
- Creating a drop, style, SKU or PO in the app. Planning is read-only today.
- Sign-in. The app uses an acting-as switcher for roles.
- A live Shopify store connection, tested end to end.
- Supplier reliability scores, and a calendar that flags check-ins gone quiet.
- Stock adjustments and multiple warehouses.
- A vector index beside the full-text index, for semantic search over messages and notes.

## Run it locally

```bash
docker compose up -d                 # FalkorDB on port 6380, FalkorDB Browser on port 3001
cd web && pnpm install
cp .env.example .env.local           # then set ANTHROPIC_API_KEY in web/.env.local
pnpm seed                            # builds the demo graphs
pnpm dev                             # open http://localhost:3000
```

The demo script, with the steps for the video, is in [docs/DEMO.md](https://github.com/KshitijBhardwaj18/weft/blob/main/docs/DEMO.md).

Weft was built for FalkorDB Graph Hacks, with Claude Code as a pair programmer.

- Live demo: https://weft.kshitijbhardwaj.space
- Code: https://github.com/KshitijBhardwaj18/weft
