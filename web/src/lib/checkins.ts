import { q } from "./graph";
import { activeGraph, daysBetween, drop, impactOf } from "./plan";

const REMAINING_STAGE_DAYS = 7; // cutting 2 + stitching 4 + QC 1, after fabric lands
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/**
 * Raise a delay call for a PO: runs the impact traversal and creates a Call that waits for an Owner/Manager.
 * `sourceId` is the CheckIn or Message the news came from.
 */
export async function raiseDelay(po: string, fabricDate: string, sourceId: string): Promise<{ summary: string }> {
  const g = await activeGraph();
  const imp = await impactOf(po, g);
  const lands = addDays(fabricDate, REMAINING_STAGE_DAYS);
  const late = daysBetween(imp.dropDate, lands);
  const posts = imp.posts.filter((p) => p.handle);
  const summary =
    `${imp.supplier} says fabric for ${imp.po} arrives ${fmt(fabricDate)}. If accepted, ${imp.po} lands ~${fmt(lands)}` +
    (late > 0
      ? `, ${late} days after the ${imp.drop} (${fmt(imp.dropDate)}), and breaks ${posts.length} creator posts on ${fmt(posts[0]?.date ?? imp.dropDate)} (${posts.map((p) => p.handle).join(", ")}).`
      : `, still before the ${imp.drop}.`);
  await q(
    `MATCH (po:PO {id:$po}), (s:Teammate {id:'shuttle'}), (src {id:$src})
     OPTIONAL MATCH (old:Call {status:'open', kind:'delay'})-[:ABOUT]->(po)
     SET old.status = 'superseded'
     CREATE (c:Call {id:'call-delay-' + $po + '-' + $stamp, kind:'delay', status:'open', at:$at, newEta:$lands,
                     title:'Supplier says fabric is delayed', summary:$summary})-[:ABOUT]->(po),
            (c)-[:RAISED_BY]->(s), (c)-[:SOURCED_FROM]->(src)`,
    { po, src: sourceId, lands, summary, stamp: Date.now().toString(36), at: `${(await drop(g)).today}T10:42` },
    g,
  );
  return { summary };
}

/** A supplier answers a check-in. Small news applies straight away; a date change becomes a call. */
export async function answerCheckIn(id: string, answer: "yes" | "delayed", date?: string) {
  const g = await activeGraph();
  const [ci] = await q<{ po: string }>("MATCH (po:PO)-[:HAS_CHECKIN]->(ci:CheckIn {id:$id}) RETURN po.id AS po", { id }, g);
  if (!ci) throw new Error("Unknown check-in");
  if (answer === "yes") {
    await q(
      `MATCH (po:PO)-[:HAS_CHECKIN]->(ci:CheckIn {id:$id})
       SET ci.status = 'answered', ci.answer = 'Yes, arrived', po.stage = 'Cutting'`,
      { id },
      g,
    );
    return { ok: true as const, po: ci.po };
  }
  if (!date) throw new Error("Pick the new date");
  await q("MATCH (ci:CheckIn {id:$id}) SET ci.status = 'answered', ci.answer = 'Delayed to ' + $date", { id, date }, g);
  const { summary } = await raiseDelay(ci.po, date, id);
  return { ok: true as const, po: ci.po, summary };
}
