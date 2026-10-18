import { q } from "@/lib/graph";
import { activeGraph, daysBetween, impactOf } from "@/lib/plan";

const REMAINING_STAGE_DAYS = 7; // cutting 2 + stitching 4 + QC 1, after fabric lands
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// A supplier answers a check-in. Small news applies; a date change becomes a call with its impact.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { answer, date } = (await req.json()) as { answer: "yes" | "delayed"; date?: string };
  const g = await activeGraph();
  const [ci] = await q<{ po: string }>(
    "MATCH (po:PO)-[:HAS_CHECKIN]->(ci:CheckIn {id:$id}) RETURN po.id AS po",
    { id },
    g,
  );
  if (!ci) return Response.json({ error: "Unknown check-in" }, { status: 404 });

  if (answer === "yes") {
    await q(
      `MATCH (po:PO)-[:HAS_CHECKIN]->(ci:CheckIn {id:$id})
       SET ci.status = 'answered', ci.answer = 'Yes, arrived', po.stage = 'Cutting'`,
      { id },
      g,
    );
    return Response.json({ ok: true });
  }

  if (!date) return Response.json({ error: "Pick the new date" }, { status: 400 });
  const imp = await impactOf(ci.po, g);
  const lands = addDays(date, REMAINING_STAGE_DAYS);
  const late = daysBetween(imp.dropDate, lands);
  const posts = imp.posts.filter((p) => p.handle);
  const summary =
    `${imp.supplier} says fabric for ${imp.po} arrives ${fmt(date)}. If accepted, ${imp.po} lands ~${fmt(lands)}` +
    (late > 0
      ? `, ${late} days after the ${imp.drop} (${fmt(imp.dropDate)}), and breaks ${posts.length} creator posts on ${fmt(posts[0]?.date ?? imp.dropDate)} (${posts.map((p) => p.handle).join(", ")}).`
      : `, still before the ${imp.drop}.`);

  await q(
    `MATCH (po:PO {id:$po})-[:HAS_CHECKIN]->(ci:CheckIn {id:$id}), (s:Teammate {id:'shuttle'})
     SET ci.status = 'answered', ci.answer = 'Delayed to ' + $date
     CREATE (c:Call {id:'call-delay-' + $po, kind:'delay', status:'open', at:$at, newEta:$lands,
                     title:'Supplier says fabric is delayed', summary:$summary})-[:ABOUT]->(po),
            (c)-[:RAISED_BY]->(s), (c)-[:SOURCED_FROM]->(ci)`,
    { po: ci.po, id, date, lands, summary, at: new Date().toISOString() },
    g,
  );
  return Response.json({ ok: true, summary });
}
