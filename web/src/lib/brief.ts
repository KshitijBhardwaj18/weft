import { META, q, ro } from "./graph";
import { runAgent, type Trace } from "./agent";
import { activeGraph, drop, phase } from "./plan";

export type Brief = { text: string; ids: string[]; trace: Trace[]; at: string };

const PROMPT = `Write Kshitij's morning brief for today (use the Drop's "today" as the date). Exactly three short bullets, under 80 words in all:
1. What needs his decision now (open calls).
2. What is at risk and why (late or quiet POs, low stock).
3. What is going well.
Plain words. No title, no bold, no markdown: start straight with the first bullet, each on its own line starting with "- ". Cite node ids in brackets.`;

/** Weft's morning brief, written once per day per collection and kept in the workspace's settings graph. */
export async function morningBrief(): Promise<Brief> {
  const g = await activeGraph();
  const [d, p] = await Promise.all([drop(g), phase()]);
  const key = `${p}:${d.id}:${d.today}`;
  const [cached] = await ro<{ text: string; ids: string; trace: string; at: string }>("MATCH (b:Brief {key:$key}) RETURN b.text AS text, b.ids AS ids, b.trace AS trace, b.at AS at", { key }, META);
  if (cached) return { text: cached.text, ids: JSON.parse(cached.ids), trace: JSON.parse(cached.trace), at: cached.at };
  const a = await runAgent(PROMPT, { as: "Weft" });
  const b = { text: a.answer.trim(), ids: a.ids, trace: a.trace, at: new Date().toISOString() };
  await q("MERGE (x:Brief {key:$key}) SET x.text = $text, x.ids = $ids, x.trace = $trace, x.at = $at", { key, text: b.text, ids: JSON.stringify(b.ids), trace: JSON.stringify(b.trace), at: b.at }, META);
  return b;
}
