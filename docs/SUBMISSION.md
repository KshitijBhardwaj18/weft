# Graph Hacks submission: Weft

**Project name:** Weft

**Tagline:** The company harness for D2C brands: one live plan of everything the brand makes and sells, on a FalkorDB graph, with AI teammates that chase every update.

**Tracks:** Track 03, Company Brain (primary). Also Track 02, Agent Memory and Coordination, and Track 01, Agents That Act on Connected Data.

**Links**
- Live demo: https://weft.kshitijbhardwaj.space (demo login `founder@blackdrop.in` / `blackdrop`, also shown on the login page; a guided tour starts after sign-in)
- Repository: https://github.com/KshitijBhardwaj18/weft
- Demo video (4½ min, 1080p): https://weft.kshitijbhardwaj.space/weft-demo.mp4 (also in the repo at `docs/demo/weft-demo.mp4`)
- Write-up: https://github.com/KshitijBhardwaj18/weft/blob/main/docs/blog/weft-falkordb.md

**Description**

A D2C product is planned, made, sold and restocked, and every stage lives in a different tool: a spreadsheet for the plan, WhatsApp groups for the factory, Shopify for orders, and the founder's memory for reorders. The failures happen at the joins. A fabric delay sits in a chat while three creators promise the launch date. A size sells out on day four and the reorder waits, because nobody compared sell-through with lead time. The restock lands and the stock count is still wrong.

Weft is the company harness for D2C brands. It keeps one live plan of the whole brand as a FalkorDB graph: drops, styles, SKUs, suppliers, POs, check-ins, orders, creators, messages and decisions, each linked to its source. Suppliers, the team and three AI teammates talk in one place, and every message is part of the plan: a supplier's "cutting done" moves the order forward on its own, and anyone can chat with a teammate or @mention one in a thread. Shuttle (production) checks in with suppliers and turns a delay into a call with its impact, found by one multi-hop query from the PO to the creator posts that promise the date. Pattern (sales) drafts restocks from sell-through, stock and lead time; approval creates the PO, and goods receipt puts it on stock. Weft (chief of staff) answers anything about the drop. Each teammate reads the graph through read-only Cypher, and *See why* lists every query behind an answer. Scenarios are full `GRAPH.COPY` copies of the plan, compared with reality and applied with the decision recorded.

**FalkorDB features used:** multi-hop Cypher (delay impact), `GRAPH.COPY` (scenarios and apply), multiple graphs in one instance (plan, live snapshot, settings, scenarios), `algo.pageRank` (supplier single points of failure), full-text and range indexes (Brand map search, id lookups), `GRAPH.RO_QUERY` (every teammate tool call).

**AI assistance disclosure:** Built with Claude Code (Claude Opus) as a pair programmer. The team designed the product, the graph model and the queries, and reviewed the code.
