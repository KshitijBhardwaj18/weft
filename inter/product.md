---
doc: product
---
# Weft

The operating system for a D2C brand's drops: one live plan, on one graph, that takes a collection from idea to factory to shop and back into the next restock, with AI teammates that chase the updates and show what every change breaks.

## Problem
Small D2C brands miss launches and money for things nobody noticed in time: a supplier going quiet, a delay buried in a chat, a size that sold out while the reorder never went out, a decision nobody wrote down. Every tool sees one slice (Shopify sees orders, WhatsApp holds supplier talk, a spreadsheet holds the production plan), so problems that cross from making to selling are invisible until a customer or creator notices.

## Kernel
**One live plan for every drop, stored as a FalkorDB graph, that chases its own updates.** Drops, styles, SKUs, suppliers, POs, production stages, stock, orders, returns, creators and decisions are connected nodes, every fact linked to its source and time. The plan is the source of truth and is fully editable in the app; it is kept current four ways: the team in the UI, supplier check-ins (Weft asks before things are due), chat (Weft proposes updates from conversation), and the calendar (a due date passing with no news is itself a signal). Because the plan is a graph, a change anywhere shows what it breaks everywhere, from a fabric delay to the creator posts promising the date, and from a sell-out back to the factory that has to remake it.

## Who It's For
The founder and ops lead of a small (5–30 person) D2C brand in India, starting with fashion and apparel. First user: our own premium fitness-wear brand. The job: get each drop made on time, sell it well, and restock the right SKUs, without the founder acting as the human router between suppliers, team and shop. Today: a dozen WhatsApp groups, Excel trackers, Shopify, Google Drive and the founder's memory, with nothing connecting them.

## Core Loop
Plan a drop → develop samples → buy (POs suppliers accept) → make (check-ins keep production current; slips surface as calls to make, tested in scenarios) → launch → sell (Shopify flows into the same graph) → restock (Pattern drafts reorders from sell-through, stock and lead times; Shuttle sends them to suppliers) → learn (size split, creators that worked, suppliers that delivered, decisions made) → the next drop starts smarter. The founder comes back every morning to **Today**: what needs them, how the drop is doing, what to restock.

## Direction
More teammates on the same graph (finance, brand guardian, CX), more connectors (WhatsApp for suppliers, Meta Ads, Shiprocket), scenarios that simulate sales, stock and cash, and a multi-tenant SaaS where an anonymised cross-brand graph (which factories deliver, which couriers work where, which creators drive repeat buyers) improves with every brand that joins.

## Glossary
Every doc and screen uses these words.

| Term | Meaning |
|---|---|
| **Today** | The home screen: what needs you and how things stand |
| **Drop** | A collection going live on a date. Phases: **Countdown** (before launch) and **Live** (after) |
| **Catalog** | Styles → colours → SKUs, with photos, costs and samples |
| **Lifeline** | One SKU's whole life on one strip: made → stock → sold → returned → next |
| **Production** | Every factory order (PO) and where it is, from fabric to warehouse |
| **Check-in** | A structured question Weft sends a supplier before something is due, answered in one tap |
| **Gone quiet** | A due date passed with no confirmation from anyone |
| **Your call** | A decision Weft needs from an Owner or Manager before it changes the plan or messages a supplier |
| **Scenario** | A private copy of the plan to test a change; **Apply to plan** makes it real |
| **Brand map** | The graph, shown: how everything connects |
| **See why** | The sources and graph path behind any answer, alert or action |
| **Weft** | The chief of staff teammate: answers anything, routes, writes the morning brief |
| **Shuttle** | The production lead teammate: check-ins, follow-ups, delay impact, sends POs |
| **Pattern** | The sales analyst teammate: reads the shop, spots sell-outs, drafts reorders, creator attribution |
| **Collections / Supply / Commerce / Strategy / Conversations** | The sidebar groups |

## Shipped
<!-- inter-build appends a line here when each milestone ships. -->

## Ideas
Unordered within each group; groups are just for finding things.

**Conversations**
- WhatsApp bridge: supplier chats mirrored to the supplier's WhatsApp (Business API, templates outside the 24h window, 1:1 threads), check-in buttons as WhatsApp quick replies
- Voice notes (Tamil/Hindi) transcribed and translated; QC defect photos read into the graph
- Attachment reading: PO sheets, tech packs, invoices (Excel/PDF/images)
- Tasks created from messages; docs/wiki the graph reads (SOPs, brand book)
- Mobile app / PWA; Google sign-in

**Brain**
- Knowledge gaps: unanswerable questions routed to the person who should know
- Time travel: the graph as it was on any past day
- Scenarios that simulate sales, stock and cash, not just dates and suppliers

**Teammates**
- Swatch (brand guardian: tone, colours, banned words on every outgoing piece), Selvedge (finance: cash runway, vendor payments), a CX teammate
- Configurable autonomy and approval levels per teammate; learn an SOP by watching it done once

**Supply**
- Supplier reliability scores from kept/broken check-ins
- Tech pack library with versions; PO as a generated PDF; strike-offs
- Multiple warehouses / stock locations

**Drops**
- Full go-to-market checklist with dependencies (shoot → content → product pages → creators briefed → ads → go-live) and a readiness score
- Content calendar linked to stock and production dates

**Commerce & growth**
- Creator CRM: shortlist → outreach → seeded → posted → results
- Ads monitor (Meta/Google): ROAS, creative fatigue, ads pointing at low-stock SKUs
- Email/WhatsApp campaigns; community (run clubs, gyms, events)
- Customer twins grounded in real purchase/return/review history
- Demand forecasting beyond simple sell-through velocity

**CX & logistics**
- Support inbox; returns and exchanges workflow
- Product loop: return reasons → batch → factory → next season's tech pack draft
- NDR/RTO tracking, COD risk, courier performance by pincode

**Finance**
- Unit economics dashboards, cash runway, vendor payments due, GST-ready exports

**Onboarding & connectors**
- Website URL scrape (Shopify `/products.json`), Weft interview, document drop
- Meta Ads, Google Ads, Shiprocket, Razorpay, Gmail, Google Drive/Sheets; shops beyond Shopify

**Platform**
- Multi-tenant: one isolated graph per brand; cross-brand supplier/courier/creator network
- FalkorDB Graph Hacks submission (Track 3 primary, all three named)

## Cut
- Generic horizontal "AI teammates" (Squad clone): crowded, and the graph isn't the differentiator there
- Bring-your-own consumer AI subscription billing: fragile, providers block it; use API keys
- Forking Mattermost/Rocket.Chat: too much code to bend around agents; build a minimal chat in-house
- Chat as the source of truth: if nobody types, nothing updates; the plan is the truth and chat is one input
- "Chat with your Shopify data" on its own: Shopify Sidekick, Triple Whale and Polar already do it; our sales answers must cross into supply
- Shipping, support workflows, cash and ads in M1: real needs, separate products with established tools; they don't block the core loop
