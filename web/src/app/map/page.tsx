import BrandMap, { type MapLink, type MapNode } from "@/components/BrandMap";
import { ro } from "@/lib/graph";
import { activeGraph } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function Map({ searchParams }: { searchParams: Promise<{ focus?: string; search?: string }> }) {
  const { focus: raw, search } = await searchParams;
  const g = await activeGraph();
  let focus = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  // Full-text indexes (created in the seed) on SKU, Style, Supplier, PO and Creator.
  if (search?.trim()) {
    const term = search.trim().replace(/[^\w\s-]/g, "") + "*";
    const hits = await Promise.all(
      ["SKU", "Style", "Supplier", "PO", "Creator"].map((label) =>
        ro<{ id: string }>("CALL db.idx.fulltext.queryNodes($label, $term) YIELD node RETURN node.id AS id", { label, term }, g).catch(() => []),
      ),
    );
    focus = hits.flat().map((h) => h.id);
  }

  const [nodes, links] = await Promise.all([
    ro<MapNode>(
      `MATCH (n) RETURN n.id AS id, labels(n)[0] AS label,
         coalesce(n.name, n.handle, n.code, n.title, n.text, n.question, n.kind, n.id) AS name`,
      {},
      g,
    ),
    ro<MapLink>("MATCH (a)-[r]->(b) RETURN a.id AS source, b.id AS target, type(r) AS type", {}, g),
  ]);

  // See why: connect the nodes an answer relied on with the shortest bounded paths between them.
  const path = new Set<string>();
  for (let i = 1; i < (search ? 0 : focus.length); i++) {
    const [row] = await ro<{ ids: string[] }>(
      `MATCH (a {id:$a}), (b {id:$b})
       MATCH p = (a)-[*1..5]-(b)
       WITH p, length(p) AS len ORDER BY len LIMIT 1
       RETURN [n IN nodes(p) | n.id] AS ids`,
      { a: focus[0], b: focus[i] },
      g,
    );
    row?.ids.forEach((id) => path.add(id));
  }

  return (
    <>
      <div>
        <h1 className="h1" style={{ fontSize: 44 }}>Brand map</h1>
        <p className="lede" style={{ fontSize: 15 }}>
          The plan as it lives in FalkorDB: {nodes.length} nodes, {links.length} relationships.
          {focus.length > 0 && !search && <> Highlighted: the path behind the last answer ({focus.join(", ")}).</>}
          {search && <> Search &ldquo;{search}&rdquo; matched {focus.length} nodes via the full-text index.</>}
        </p>
      </div>
      <form className="row" action="/map" style={{ flexWrap: "nowrap", maxWidth: 560 }}>
        <label htmlFor="map-search" style={{ position: "absolute", left: -9999 }}>Search the graph</label>
        <input id="map-search" name="search" className="input" defaultValue={search ?? ""} placeholder="Search SKUs, styles, suppliers, POs, creators… e.g. olive" />
        <button className="btn lg">Search</button>
      </form>
      <BrandMap nodes={nodes} links={links} focus={focus} path={[...path]} />
    </>
  );
}
