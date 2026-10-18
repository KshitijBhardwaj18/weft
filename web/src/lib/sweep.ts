import { q } from "./graph";
import { activeGraph, drop } from "./plan";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** A check-in whose due date has passed with no answer has gone quiet; Shuttle drafts a follow-up for each. */
export async function sweepQuiet(): Promise<number> {
  const g = await activeGraph();
  const today = (await drop(g)).today;
  const rows = await q<{ ci: string; question: string; due: string; contact: string; supplier: string }>(
    `MATCH (po:PO)-[:HAS_CHECKIN]->(ci:CheckIn {status:'open'}), (po)-[:MADE_BY]->(maker:Supplier) WHERE ci.due < $today
     OPTIONAL MATCH (ci)-[:ASKED]->(asked:Supplier)
     WITH ci, coalesce(asked, maker) AS sup
     MERGE (ci)-[:ASKED]->(sup)
     SET ci.status = 'quiet'
     RETURN ci.id AS ci, ci.question AS question, ci.due AS due, sup.contact AS contact, sup.name AS supplier`,
    { today },
    g,
  );
  for (const r of rows) {
    await q(
      `MATCH (ci:CheckIn {id:$ci}), (t:Teammate {id:'shuttle'})
       OPTIONAL MATCH (x:Call {kind:'followup'})-[:ABOUT]->(ci)
       WITH ci, t, x WHERE x IS NULL
       CREATE (c:Call {id:'call-followup-' + $ci, kind:'followup', status:'open', at:$at, title:'Drafted a follow-up to ' + $contact, summary:$summary})-[:ABOUT]->(ci),
              (c)-[:RAISED_BY]->(t)`,
      { ci: r.ci, contact: r.contact, at: `${today}T09:00`, summary: `To ${r.supplier}: "${r.question.replace(/\?$/, "")}" was due ${fmt(r.due)} and hasn't been answered. Any update?` },
      g,
    );
  }
  return rows.length;
}

/** Demo clock: move every collection's "today" forward, then sweep for check-ins that went quiet. */
export async function advanceClock(days: number) {
  const g = await activeGraph();
  const today = (await drop(g)).today;
  const next = new Date(Date.parse(today) + days * 86_400_000).toISOString().slice(0, 10);
  await q("MATCH (d:Drop) SET d.today = $next", { next }, g);
  return { today: next, quiet: await sweepQuiet() };
}
