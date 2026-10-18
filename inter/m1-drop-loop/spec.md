---
doc: spec
status: approved
---
# M1: The Drop Loop — Spec (hackathon cut)

Written under a hard deadline (FalkorDB Graph Hacks, 18 Oct 23:59 IST). This spec covers the slice built for the submission demo; the rest of the PRD follows after submission.

## Stack
- **Next.js 15 (App Router, TypeScript)** in `web/`: server components read the graph directly; route handlers for actions.
- **FalkorDB** (Docker locally, `falkordb` npm client). The plan lives in the graph `weft`. Scenarios are separate graphs (`weft_scn_<id>`), created with `GRAPH.COPY`. The Live snapshot is the graph `weft_live`.
- **Claude** (`@anthropic-ai/sdk`, `claude-opus-5-5`, low effort, server-side refusal fallback) for Ask: a manual tool loop whose only tool is a read-only Cypher runner.
- No auth, no real-time transport (server actions + `router.refresh()`), no Shopify/Resend tonight: Shopify-shaped orders are seeded into the graph.

## Graph model
Nodes (all carry `id`):
- `Drop {name, date, phase}` · `Style {name, price, fabric}` · `SKU {code, colour, size, planned, sold, onHand, returns, returnReason}`
- `Supplier {name, type, leadDays}` · `PO {qty, unitPrice, eta, stage, status}` · `CheckIn {question, due, answer, status}`
- `Sample {kind, status, note, date}` · `Creator {handle, code, orders, repeatRate}` · `CreatorPost {date, says}`
- `Person {name, role}` · `Teammate {name, role}` · `Message {author, channel, text, at}` · `Call {kind, title, summary, status}` · `Decision {text, at, by}`

Edges:
`(Style)-[:IN_DROP]->(Drop)` · `(SKU)-[:OF_STYLE]->(Style)` · `(PO)-[:SUPPLIES]->(SKU)` · `(PO)-[:MADE_BY]->(Supplier)` · `(Person)-[:OWNS]->(PO)` · `(PO)-[:HAS_CHECKIN]->(CheckIn)` · `(Style)-[:HAS_SAMPLE]->(Sample)` · `(Creator)-[:POSTED]->(CreatorPost)-[:PROMOTES]->(Drop)` · `(Creator)-[:DROVE {orders}]->(SKU)` · `(Call)-[:ABOUT]->(*)` · `(Call)-[:RAISED_BY]->(Teammate)` · `(Call|Decision)-[:SOURCED_FROM]->(Message|CheckIn)` · `(Decision)-[:ABOUT]->(*)`

## FalkorDB features used
| Feature | Where |
|---|---|
| Multi-hop Cypher | Delay impact: PO → SKU → Style → Drop ← CreatorPost ← Creator |
| `GRAPH.COPY` + multiple graphs | Scenarios; the Live snapshot; Apply to plan swaps the scenario graph in |
| Shortest path | See why paths between an answer's nodes |
| Graph algorithms | PageRank over supply edges → "single points of failure" on Today |
| Full-text index | ⌘K search over SKUs, styles, suppliers, POs |
| Aggregations | Sell-through heatmap, revenue, restock suggestions |
| Agent tool over Cypher | Weft / Shuttle / Pattern answer by querying the graph; queries are shown in See why |

## Rules
- Restock = ceil(rate × (leadDays + 7) − onHand − incoming, to 10), rate = sold ÷ days in stock.
- PO landing = fabric date + remaining stage days (cutting 2, stitching 4, QC 1 = 7 days).
- A drop is at risk when any PO supplying it lands after the drop date; creator posts promoting it are then "broken".

## Built tonight
Today (Countdown/Live via demo clock) · Production with check-in answering (supplier view) and Your call with impact · Scenarios (copy, change supplier, compare, apply) · Ask (⌘J) with See why and query · Brand map · seed script.
