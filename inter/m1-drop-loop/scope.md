---
doc: scope
milestone: 1
status: approved
---
# M1: The Drop Loop

One drop, end to end: plan it, make it, launch it, sell it and restock it, on one live plan in FalkorDB, with Weft, Shuttle and Pattern doing the chasing and the analysis.

## Goal
Prove the kernel across the whole cycle a D2C brand runs for every drop, and make it a demo that lands. A launch plan alone stops being useful the day the drop goes live; sales analytics alone is a weaker copy of Shopify's own tools. The value, and the reason it needs a graph, is the loop between them: a supplier delay shows its effect on the launch and the creators, and a sell-out turns into a reorder the right supplier can make in time.

## Done Looks Like
A two-act demo on a 15-SKU drop ("Black Drop": leggings in black and olive, a black sports bra, a tank in black and olive, each in S/M/L), running on real code with seeded data and a real Shopify development store.

**Act 1, Countdown.**
1. The founder creates the Black Drop in the UI (name, 1 Dec, styles, colours, sizes); 15 SKUs appear in the Catalog with photos and costs; Today shows the countdown.
2. Weft drafts the buy from the plan; Rohan (Manager) edits and approves; POs go to supplier chats as cards; Murugan (Sri Lakshmi Knits) accepts PO-014 with a dispatch date.
3. Shuttle's check-in asks Murugan "is the fabric in?"; he taps **Delayed → 28 Nov**. Weft shows **Your call**: PO-014 lands ~5 Dec, after the 1 Dec drop, and breaks the 3 creator posts announcing it, with sources. Separately, Ananya Fabrics misses a due date with no update and shows as **Gone quiet**.
4. The founder opens a **Scenario**, moves PO-014 to Kavya Garments, compares it with reality (on time, +₹12,000) and applies it to the plan; the PO, Production, Today and both supplier chats update.

**Act 2, Live** (a demo clock jumps to day 9 after launch).
5. Today shows 62% sold, ₹27.3L, the size heatmap with black leggings M sold out and olive tank lagging.
6. The founder asks Weft "how's the drop doing and what should I do?" Pattern answers with sources: M sold out on day 4, @runwithria's code drove 41% of orders, olive tanks are coming back "too short", tracing to the fit sample note.
7. Pattern drafts a reorder (250 black leggings M, Sri Lakshmi, lands ~24 Dec); Rohan approves; Shuttle sends the PO and starts check-ins. The SKU's **Lifeline** shows made → stock → sold → returned → reordered.
8. At every step, **See why** shows the sources and graph path, and anything Weft got wrong can be corrected in place.

## In
**Experience**
- A polished, smooth app (Linear/Slack level): fast, real-time, keyboard-friendly, motion that shows change; built on the Weft design system (canvas: Weft Design System)
- Sidebar: Today · Collections (Drops, Catalog) · Supply (Production, Suppliers) · Commerce (Sales, Inventory, Creators) · Strategy (Scenarios, Brand map) · Conversations
- **Today** with Countdown and Live phases
- Observable and editable: every answer, alert and teammate action has **See why**; any fact, date or stage can be corrected in place and the change flows everywhere
- Ask bar (⌘J) on every screen, aware of what's on screen
- A demo clock (Owner-only, clearly marked) to move the workspace between Countdown and Live states

**Workspace & roles**
- Sign-in by email magic link; one workspace; roles Owner, Manager, Member, Supplier guest (a guest sees only their own chat)
- Conversations: team channels, supplier chats, direct messages, teammate chats; file and photo uploads; real-time
- Email notifications to suppliers for new POs and check-ins, with one-tap links

**The plan (source of truth)**
- Drops: name, date, styles; phase Countdown → Live
- Catalog: styles → colours → SKUs (sizes), product photos per style/colour, costing and margin, samples (proto, fit, pre-production) with approvals
- Suppliers: directory with lead times and contact
- POs: drafted by Weft from the drop plan or created by hand; approved by Owner/Manager; sent as cards; supplier **accepts** with a date
- Production: each PO moves through stages (fabric → cutting → stitching → QC → dispatch → received) with expected dates from the supplier's lead time
- Four update paths: the team in the UI, supplier check-ins, Weft proposals from chat, and **Gone quiet** detection from the calendar
- Approval levels: small facts apply automatically; dates, quantities, prices, suppliers, cancellations and anything sent to a supplier become **Your call** for an Owner/Manager

**Commerce**
- Shopify connection (development store for the demo): products mapped to SKUs, orders, customers, refunds/returns with reasons, discount codes, inventory levels
- Sales: revenue, orders, units, return rate by drop and date range; size × style sell-through heatmap; top SKUs; return reasons
- Inventory: stock on hand (from Shopify), incoming (from open POs), days of stock left, Pattern's restock suggestions with **Draft PO**
- Creators: creators with their discount codes, orders, revenue and repeat buyers; creator posts with dates linked to drops
- **Lifeline** on every SKU

**Teammates**
- **Weft** (chief of staff): answers anything with sources, routes to the right teammate, writes the morning brief
- **Shuttle** (production lead): sends check-ins, drafts follow-ups, detects slips and Gone quiet, shows delay impact, sends approved POs
- **Pattern** (sales analyst): answers shop questions, spots sell-outs and slow sellers, drafts restocks, attributes sales to creators
- Handoff through the shared graph: Pattern's approved restock becomes Shuttle's PO and check-ins
- Each teammate has editable instructions and an activity log

**Strategy**
- Scenarios on the plan: move a PO to another supplier, change dates, quantities or the drop date; side-by-side comparison; Apply to plan or Discard
- Brand map: the graph view, and See why paths highlighted on it

## Out
- WhatsApp bridge, voice notes, attachment parsing (Ideas)
- Shipping, support workflows, finance, ads (Ideas)
- Scenarios that simulate sales, stock or cash (Ideas)
- Creator CRM beyond codes and posts (Ideas)
- Website/interview onboarding, connectors other than Shopify (Ideas)
- Multiple workspaces / multi-tenancy (Ideas)
