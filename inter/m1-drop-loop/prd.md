---
doc: prd
status: draft
---
# M1: The Drop Loop — PRD

Cast: Kshitij (founder, Owner), Rohan (ops, Manager), Priya (marketing, Member), Murugan (Sri Lakshmi Knits, supplier guest), Ananya Fabrics and Kavya Garments (suppliers). Teammates: **Weft** (chief of staff), **Shuttle** (production lead), **Pattern** (sales analyst). Words follow the glossary in `product.md`. Visual reference: the "Weft Design System" canvas (design system sheet, Today, Catalog, Production, Conversations, Scenario).

The demo drop: **Black Drop**, live 1 Dec. Styles: Core Leggings (black, olive), Sculpt Sports Bra (black), Everyday Tank (black, olive); sizes S/M/L → **15 SKUs**, 2,100 units.

## Core Journey

**Set up**
1. Kshitij signs up with an email magic link, names the workspace "Weft Active", and lands on an empty Today with a setup checklist.
2. He invites Rohan (Manager) and Priya (Member), adds suppliers (Sri Lakshmi Knits, Ananya Fabrics, Kavya Garments) with contact email and typical lead time; each supplier gets a chat and an invite link for their contact.
3. He connects Shopify (the demo uses a Shopify development store).

**Plan the drop (Countdown)**
4. Drops → **New drop**: name "Black Drop", date 1 Dec. He adds styles in Catalog (name, price, fabric, supplier), picks colours and sizes; 15 SKUs are generated with codes (e.g. `WA-LEG-BLK-M`). He adds photos and costing per style. Today switches to **Countdown**: 13 days and a readiness checklist. (`@weft we're launching…` does the same as a shortcut.)
5. Samples: on each style he requests samples (proto, fit, pre-production) from a supplier with a due date. Shuttle sends check-ins; Rohan marks the fit sample approved with a note ("waistband +1 cm").

**Buy**
6. Weft drafts the buy from the drop plan (units per style/colour and a size split) as draft POs per supplier. Rohan edits quantities and approves. Each PO is posted to its supplier chat as a card and emailed to the supplier contact.
7. Murugan opens PO-014 (600 black leggings, S/M/L 150/300/150, ₹420) and **accepts** it with a dispatch date of 20 Nov. Production shows PO-014 with expected dates for each stage from Sri Lakshmi's lead time.

**Make**
8. Before each expected date, Shuttle sends Murugan a check-in ("PO-014: is the fabric in?" with **Yes / Delayed → date / Problem**). Taps move PO-014 through Production; Rohan can also drag a card or edit a date.
9. Murugan taps **Delayed → 28 Nov**. Shuttle raises **Your call** in `#ops` and on Today: PO-014 lands ~5 Dec, 4 days after the drop, and breaks 3 creator posts on 25 Nov announcing "live 1 Dec" (Priya logged them in Creators), with sources. Nothing changes until an Owner/Manager decides.
10. Meanwhile Ananya Fabrics' olive lab dip passes its due date with no reply; it shows as **Gone quiet** on Today and in Production, and Shuttle drafts a follow-up for Rohan to send.
11. Kshitij clicks **Scenario** on the call, moves PO-014 to Kavya Garments (lead time 10 days, fabric in stock, ₹440), and compares: on time, +₹12,000, no broken creator posts. He clicks **Apply to plan**, reviews exactly what will change and which messages go to which supplier, and confirms. PO-014 moves to Kavya, Sri Lakshmi gets a cancellation note, Kavya gets the PO card to accept, and the call is resolved.

**Launch**
12. Stock is marked received (by Shuttle check-in or Rohan). On 1 Dec the drop goes **Live**: Today switches to Live.

**Sell**
13. Shopify orders, refunds with reasons, discount codes and inventory flow in and attach to SKUs, the drop and creators. (Demo: the Owner moves the demo clock to day 9; seeded orders fill the development store.)
14. Today (Live) shows 62% sold, ₹27.3L, 958 orders, 4.2% returns, and the size heatmap: black leggings M sold out, olive tank slow.
15. Kshitij asks the Ask bar: "how's the drop doing and what should I do?" Weft routes to Pattern, which answers with sources: M sold out on day 4; @runwithria's code RIA15 drove 41% of orders and 38% of those buyers came back; 9 olive tanks were returned "too short", which traces to the fit sample note.

**Restock**
16. Pattern raises **Your call**: restock 250 black leggings M from Sri Lakshmi, lands ~24 Dec (14-day lead time), with the reasoning. Rohan approves; Shuttle sends the PO card, Murugan accepts, and check-ins begin. The SKU's **Lifeline** now reads made → stock 0 → sold 300/300 → returned 4% → restock 250 by 24 Dec.

**Remember**
17. Anyone asks "why did we move PO-014 to Kavya?" and gets the decision, who made it, when, the scenario compared, and the sources, with the path on the Brand map.
18. Anything Weft got wrong (a date, a SKU, a reason) can be corrected in place; the correction flows to the plan, Today, Production, Sales and any open scenario.

## Surfaces

### Sign-in and Setup
- Email magic link for everyone (Owner, Manager, Member, supplier guest); no passwords.
- Sign-up creates the workspace (name, your name).
- Setup checklist on an empty Today: invite your team, add suppliers, connect Shopify, create your first drop. Items tick themselves; dismissible.
- Accepting an invite lands team members on Today and supplier guests in their own chat.

### App Shell
- Sidebar: Today · **Collections** (Drops, Catalog) · **Supply** (Production, Suppliers) · **Commerce** (Sales, Inventory, Creators) · **Strategy** (Scenarios, Brand map) · **Conversations** (Weft, Shuttle, Pattern; team channels; supplier chats; direct). Each item shows a one-line description on hover and live badges (calls waiting, Live, low stock).
- **Ask bar (⌘J)** at the top of every screen: ask Weft anything; it knows the current screen and selection.
- Command palette (⌘K): jump to any drop, style, SKU, supplier, PO, chat, scenario or setting; run actions (New drop, New PO, New scenario).
- Keyboard: ⌘K, ⌘J, ⌘/ shortcuts sheet, Esc closes panels, E edits the focused fact.
- Right-hand **See why** panel that opens from any answer, alert, call or teammate action.

### Today
Home screen; updates live. Phase follows the current drop.
- **Countdown hero**: days until the drop as a large numeral, the date, styles/SKUs/units, and readiness (stock landed, production on track, samples approved, creators booked), with links to the open call and to Scenarios.
- **Live hero**: % of units sold as a large numeral, revenue, orders, units sold / planned, return rate, and the size × style sell-through heatmap (sold-out cells marked), with a one-line insight and See why.
- **Your call**: every decision waiting for an Owner/Manager, newest first, each naming the teammate that raised it, what would change, its impact, and actions in place (Approve/Accept, Edit, Scenario, Ignore).
- **Restock now** (Live): Pattern's top restock suggestions with reason and quantity.
- **Top creators** (Live): creators by share of orders on their code, with repeat-buyer rate.
- **Supply**: Gone quiet items, POs in production, check-ins going out today, suppliers on time.
- **Team activity**: live feed of what people and teammates did, each linked to its source.
- **Scenarios**: open scenarios with their headline difference.
- Members see calls without Approve (shows "Waiting for a manager"); supplier guests never see Today.

### Drops
- List of drops with phase (Countdown/Live/Ended), date, styles, units, and headline status.
- **New drop**: name, date, then add or pick styles; the drop's page shows its styles and SKUs, its POs, readiness (Countdown) or performance (Live), creator posts, and its scenarios.
- Changing a drop's date is a call (high impact) and shows what it affects.

### Catalog
- Style cards with a large product photo, status badge, photo count, name, price, colour swatches and units ordered.
- Style page: photo gallery per colour with **Add photo** (photos shared in any chat can be added from there); fabric and supplier; SKU table (colour rows with thumbnails × size columns: SKU code, ordered, status); samples with status, dates and notes; costing (factory price, trims, packaging, freight → landed cost; selling price → margin).
- **New style**: name, price, fabric, supplier, colours, sizes → SKUs generated with editable codes. Import from CSV/paste.
- **SKU page** with the **Lifeline**: Made (PO, supplier, landed cost) → Stock (on hand, incoming) → Sold (units, sell-through, revenue) → Returned (rate, reasons) → Next (restock suggestion or open restock PO).

### Production
- Columns are stages (Fabric → Cutting → Stitching → QC → Dispatch → Received; editable in Settings). Each PO card: PO number, style/colour, supplier, quantity, owner, expected date, status badges (Your call pending, Gone quiet, Late).
- Cards move by check-in answers, drag (records the person), or an applied proposal from chat; each card's history shows every move and its source.
- Tabs: Tracker, Purchase orders (list and detail: supplier, lines by size, unit price, total, accepted date, status: draft, awaiting approval, sent, accepted, in production, dispatched, received, cancelled).
- **New PO** form; **Draft buy** from a drop (Weft's suggested POs per supplier).
- Filters: drop, supplier, owner, needs attention.

### Suppliers
- Directory: name, type (factory, mill, trims, packaging), contact, typical lead time, open POs, check-ins pending, on-time record this month.
- Supplier page: details, their chat, POs, samples, check-in history.
- Add supplier creates their chat and invite link.

### Sales
- Filters: drop, date range.
- Headline numbers: revenue, orders, units, average order value, return rate.
- Size × style sell-through heatmap (click a cell → that SKU's Lifeline).
- Top SKUs; slow sellers; return reasons breakdown (click → the orders and their reasons); sales by discount code.
- Every number links to the orders behind it.

### Inventory
- Per SKU: on hand (from Shopify), incoming (open POs with expected dates), days of stock left at current sell rate, status (sold out, low, healthy, slow).
- **Restock suggestions** from Pattern: SKU, quantity, size split, supplier, lead time, expected arrival, the reasoning; **Draft PO** sends it to Your call.

### Creators
- Creators with handle, discount code, posts (date, drop), orders, revenue, share of drop orders, repeat-buyer rate.
- Creator page: their orders and the SKUs they drove.
- Add creator / log a post (Priya); creator posts dated before a drop are linked to it so delays show their effect.

### Scenarios
- Start from a call, a PO, a drop, the Scenarios list, or the palette. A scenario is a private copy of the plan.
- Change things the usual way inside it: move a PO to another supplier (lead time, price), change dates or quantities, move the drop date.
- **Comparison**: reality vs scenario: arrival dates, drop status, broken creator posts, cost and margin difference; each difference expands to the graph path that caused it.
- **Apply to plan**: a sheet lists every change and every message that will go to which supplier or channel; on confirm, the plan updates and messages are sent. If reality changed meanwhile on the same items, the sheet shows them and asks which to keep. **Discard** removes it.
- Owners and Managers apply; Members can create and discard their own.

### Brand map
- The graph: drops, styles, SKUs, suppliers, POs, stages, creators, orders (aggregated), decisions, messages, each type with its colour and icon.
- Focus on any node to see its neighbourhood; See why paths highlight here; zoom, drag, search.
- Collapsed **Graph query** section shows the query behind a highlighted path.

### Conversations
- Team channels (`#ops`, `#marketing`), supplier chats (one per supplier; their guests see only that), direct messages, and a chat with each teammate.
- Composer: text, @mentions (people, @weft, @shuttle, @pattern), files and photos.
- Cards in chat: PO card (accept/decline for the supplier), check-in card (one-tap answers, date picker), Your call card (team only), scenario applied notice. Cards are live.
- Facts Weft understands from free text show as chips under the message; low-impact ones apply, high-impact ones become proposals for a call; any chip can be corrected.
- Supplier guests receive an email for each new PO and check-in with a link straight to the card.

### Talking to Weft, Shuttle and Pattern
- Ask Weft anywhere (Ask bar, @weft, or its chat); Weft answers or routes to Shuttle or Pattern and shows who answered.
- Answers cite sources as numbered links and offer See why. When the plan doesn't know, they say so and say what's missing.
- Anything a teammate would create or change is shown as a preview or a call first.
- **Morning brief** from Weft at 8:00: what needs you, what changed overnight, what's at risk.
- Teammate pages (Settings): editable plain-language instructions, what it may do without asking, and its activity log.

### See why
- For any answer, alert, call, card move or teammate action: the trigger, the sources (each linking to its message, check-in, order or edit), and the graph path, highlighted on the Brand map.

### Fact Editor
- Opens from a chip, a field, a card or See why. Shows what Weft understood, the source, and editable fields.
- Save correction / Remove / Link to a different item; the change shows "edited by <name>" and flows everywhere.

### Settings
- Workspace name; people and roles; Shopify connection status and resync; Production stages; teammates' instructions; the demo clock (Owner only).
- Roles:

  | Can… | Owner | Manager | Member | Supplier guest |
  |---|---|---|---|---|
  | Use Today, Collections, Supply, Commerce, Strategy, Conversations, ask teammates | ✓ | ✓ | ✓ | — (own chat only) |
  | Correct facts, move cards, create scenarios, log creator posts | ✓ | ✓ | ✓ | — |
  | Approve calls, approve/send POs, send follow-ups, apply scenarios | ✓ | ✓ | — | — |
  | Add suppliers, invite Members and supplier guests, edit stages and teammate instructions | ✓ | ✓ | — | — |
  | Invite Managers, change roles, connect Shopify, use the demo clock | ✓ | — | — | — |
  | Accept POs, answer check-ins, chat in their own supplier chat | — | — | — | ✓ |

## States and Edge Cases
- **Empty workspace**: Today shows the setup checklist; every screen has a one-line explanation and its first action.
- **Shopify not connected**: Commerce screens explain what they'll show and offer Connect; Today stays in Countdown.
- **Shopify product not mapped to a SKU**: listed under "Unmatched products" in Catalog with suggested matches.
- **Supplier never answers a check-in**: reminder after 24h; when the expected date passes, **Gone quiet** on Today, Production and the supplier page, plus a follow-up draft.
- **Supplier doesn't accept a PO**: "Not accepted" after 48h, flagged on Today.
- **Vague answers** ("soon sir"): Weft asks back with a date picker.
- **Conflicting sources** (chat says 26th, check-in says 28th): flagged with both sources; a person picks.
- **Ambiguous item** in chat (which leggings?): chip marked unsure with candidates; nothing changes until picked.
- **Proposal superseded** by a newer one: the old call is marked superseded.
- **Sample rejected**: Weft asks whether to request a new one; the drop shows at risk if there isn't time.
- **Quantity or price change after acceptance**: a call; the supplier must re-accept.
- **Stock goes negative or oversold**: shown as oversold on the Lifeline and Inventory.
- **Scenario out of date at apply**: handled in the apply sheet.
- **Teammate unavailable**: chat keeps working; teammates say they'll catch up, and do.
- **Deleting a message**: warns which facts came only from it; they're removed on delete.
- **Files**: up to 25 MB; images preview; photos up to 10 per colour.
- **Offline**: "Reconnecting…" banner; queued messages send in order.
- **Persistence**: everything persists across sessions and devices.
- **Formats**: ₹ with Indian grouping (₹2,52,000; ₹27.3L), dates "28 Nov", times in IST.

## Look and Feel
Source: the Weft Design System canvas.
- **Feel**: warm paper, confident ink, serif for the moments that matter; calm until something needs you.
- **Colour**: Canvas `#F4F3EC` (chrome), Surface `#FFFEF8` (content card), Raised `#ECEAE1`, Ink `#1A1A1A`, Ink 2 `#5F5E5A`. Accents: Fathom `#034F46` (brand, heroes, suppliers), Dawn `#F0D7FF` (Weft, scenarios), Glow `#FFA946` (styles, pending), Flare `#FF6C4C` (drops, late), Signal `#FFBCF2` (creators), Pulse `#7F1C34` (decisions, errors). Status: On track `#CEF5CA/#114E0B`, At risk `#FCEBCF/#6B4300`, Late `#F8E4E4/#7F1C34`, pending = dashed glow border.
- **Entity colours**: each node type has one colour and icon used in chips, Brand map and pages.
- **Type**: EB Garamond (display and big numerals, lining figures, −3% tracking), Figtree (all UI), JetBrains Mono (numbers, IDs, SKU codes).
- **Shape**: radius 8 (chips), 10 (controls), 16–20 (cards), 24 (panels); hairlines at 8–14% ink; black pill-ish primary buttons.
- **Layout**: content sits in a large rounded surface card inset in the canvas chrome, sidebar on the left; works at phone width.
- **Motion**: quick and purposeful: chips fade in, cards slide between stages, graph nodes animate in, heatmap cells fill.
- **Voice**: short, plain, specific, numbers first; teammates speak as themselves ("Shuttle: Kavya asked to change a date"); no exclamation marks, always cites sources.
- Light and dark themes.

## Acceptance Criteria
**Setup & roles**
- Magic-link sign-in works for all roles; a supplier guest can reach only their own chat and cards, by any route. (Sign-in and Setup, Settings)
- Members cannot approve calls, send POs or apply scenarios by any route. (Settings)

**Plan**
- Creating Black Drop with 3 styles, the stated colours and S/M/L produces exactly 15 SKUs with codes, visible in Catalog and on the drop. (Journey 4)
- Today shows Countdown with days left and readiness while the drop is before its date. (Today)
- A style shows its photos, SKU table with thumbnails, samples and costing with landed cost ₹490 and margin 80% for Core Leggings at ₹2,499. (Catalog)

**Buy & make**
- Draft buy produces suggested POs per supplier from the drop plan; after approval, PO-014 appears as a card in the Sri Lakshmi chat and an email reaches the supplier contact. (Journey 6)
- Murugan accepting PO-014 with 20 Nov sets expected dates for each stage in Production. (Journey 7)
- A check-in answer moves the card and records the source; dragging a card records the person. (Journey 8, Production)
- Answering **Delayed → 28 Nov** changes nothing in the plan and raises a call naming PO-014, the drop and the 3 creator posts, with sources. Approving applies it; Today and Production update without refresh. (Journey 9)
- A promise past its date with no answer shows Gone quiet on Today and Production within a minute of the date passing. (Journey 10)

**Scenarios**
- A scenario moving PO-014 to Kavya (10 days, ₹440) shows on time, +₹12,000 and no broken creator posts; changes in it don't touch the plan until applied. (Journey 11)
- Apply to plan lists every change and message; on confirm, PO-014 moves, both suppliers get their messages, and the call resolves. (Journey 11)

**Sell & restock**
- With the development store seeded and the demo clock on day 9, Today shows 62% sold, ₹27.3L, 958 orders and the heatmap with black leggings M sold out. (Journey 14)
- Every Sales number links to its orders; a heatmap cell opens that SKU's Lifeline. (Sales)
- "How's the drop doing" returns Pattern's answer naming the sell-out, the creator share and the olive tank return reason, each with sources. (Journey 15)
- Inventory shows on hand, incoming and days left per SKU; Pattern's restock for black leggings M shows 250, Sri Lakshmi, ~24 Dec. (Inventory)
- Approving the restock makes Shuttle send the PO card and schedule check-ins; the Lifeline shows the restock. (Journey 16)
- Creators shows @runwithria with RIA15, 41% of drop orders and 38% repeat buyers. (Creators)

**Trust**
- Every answer, call, card move and teammate action has See why with sources and a highlighted path on the Brand map. (See why)
- Correcting a date in the Fact Editor updates the plan, Today, Production and any open scenario without refresh, and shows who corrected it. (Journey 18)
- "Why did we move PO-014 to Kavya?" returns the decision, who, when and the scenario, with sources. (Journey 17)

**Experience**
- ⌘K reaches any drop, style, SKU, supplier, PO, chat or scenario; ⌘J opens the Ask bar on every screen. (App Shell)
- Every screen has a designed empty state and works in light and dark themes and at phone width. (Look and Feel)

## Out of Scope
- WhatsApp bridge, voice notes, attachment parsing
- Shipping, support workflows, finance, ads
- Scenarios that simulate sales, stock or cash
- Creator CRM beyond codes and posts
- Website/interview onboarding; connectors other than Shopify
- Multiple workspaces / multi-tenancy
- Threads, reactions, email notifications for team members, mobile app

## Open Questions
- **Demo deadline (founder):** when and where is the demo? It sets the build order and what gets seeded.
- **Your own shop (founder):** will the real brand run on Shopify? The demo uses a Shopify development store either way.
- **Restock logic (spec):** simple sell-rate × lead time + safety stock for M1, or something smarter?
- **Stock source (spec):** Shopify is the source of truth for on-hand stock and Weft adds incoming from POs; confirm in spec.
