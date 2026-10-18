import BrandMap, { type MapLink, type MapNode } from "@/components/BrandMap";
import { ro } from "@/lib/graph";
import { activeGraph } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function Map({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const { focus: raw } = await searchParams;
  const focus = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const g = await activeGraph();

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
  for (let i = 1; i < focus.length; i++) {
    const [row] = await ro<{ ids: string[] }>(
      `MATCH (a {id:$a}), (b {id:$b})
       MATCH p = (a)-[*1..5]-(b)
       RETURN [n IN nodes(p) | n.id] AS ids ORDER BY length(p) LIMIT 1`,
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
          {focus.length > 0 && <> Highlighted: the path behind the last answer ({focus.join(", ")}).</>}
        </p>
      </div>
      <BrandMap nodes={nodes} links={links} focus={focus} path={[...path]} />
    </>
  );
}
