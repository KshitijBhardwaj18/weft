import Anthropic from "@anthropic-ai/sdk";
import { ro } from "@/lib/graph";
import { activeGraph, phase } from "@/lib/plan";

const client = new Anthropic();

const SCHEMA = `Graph schema (FalkorDB, openCypher). Every node has an \`id\`.
(:Drop {name, date, phase, today, orders})
(:Style {name, price, fabric})-[:IN_DROP]->(:Drop)
(:SKU {code, line, colour, size, planned, sold, onHand, returns, returnReason})-[:OF_STYLE]->(:Style)
(:PO {qty, unitPrice, eta, stage, status})-[:SUPPLIES]->(:SKU)
(:PO)-[:MADE_BY]->(:Supplier {name, type, city, leadDays, contact})
(:Person {name, role})-[:OWNS]->(:PO); (:Person)-[:DECIDED]->(:Decision)
(:PO)-[:HAS_CHECKIN]->(:CheckIn {question, due, status, answer}); (:CheckIn)-[:ASKED]->(:Supplier)
(:Style)-[:HAS_SAMPLE]->(:Sample {kind, status, date, note})
(:Creator {handle, code, orders, repeatRate})-[:POSTED]->(:CreatorPost {date, says})-[:PROMOTES]->(:Drop)
(:Creator)-[:DROVE {orders}]->(:SKU)
(:Call {kind, title, summary, status, at})-[:ABOUT]->(any); (:Call)-[:RAISED_BY]->(:Teammate {name, role})
(:Decision {text, at, by})-[:ABOUT]->(any); (:Decision|:Drop|:CreatorPost)-[:SOURCED_FROM]->(:Message {author, channel, text, at})
Money is INR. Dates are ISO strings. Revenue = SKU.sold × Style.price.`;

const SYSTEM = `You are the AI team inside Weft, the operating system for a D2C fashion brand's drops.
Three teammates share one graph and you answer as exactly one of them:
- Weft (chief of staff): general questions, decisions, "what needs me", why things happened.
- Shuttle (production lead): suppliers, POs, check-ins, delays, samples.
- Pattern (sales analyst): sales, sell-through, stock, restocks, returns, creators.

Always answer from the graph: call run_cypher (read-only) as many times as you need, following relationships across supply and sales.
Start your reply with the teammate's name and a colon, e.g. "Pattern: ...".
Be short, plain and specific, numbers first. Cite the graph nodes you relied on by id in square brackets, e.g. [PO-014] [LEG-BLK-M].
When the graph doesn't hold the answer, say so plainly.

${SCHEMA}`;

const tools: Anthropic.Tool[] = [
  {
    name: "run_cypher",
    description:
      "Run a read-only openCypher query against the brand's FalkorDB graph and get rows back as JSON. Use MATCH/OPTIONAL MATCH/WITH/RETURN and aggregations. Write clauses are rejected.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "A read-only openCypher query." },
        why: { type: "string", description: "One short line: what this query checks." },
      },
      required: ["query", "why"],
      additionalProperties: false,
    },
    strict: true,
  },
];

type Trace = { why: string; query: string; rows: number; error?: string };

export async function POST(req: Request) {
  const { question } = (await req.json()) as { question: string };
  if (!question?.trim()) return Response.json({ error: "Ask something first." }, { status: 400 });

  const graph = await activeGraph();
  const p = await phase();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: `(Drop phase: ${p}.) ${question}` },
  ];
  const trace: Trace[] = [];
  const ids = new Set<string>();

  try {
    for (let turn = 0; turn < 8; turn++) {
      const res = await client.beta.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        system: SYSTEM,
        tools: tools as Anthropic.Beta.BetaTool[],
        messages,
        output_config: { effort: "low" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      } as Anthropic.Beta.MessageCreateParamsNonStreaming);

      if (res.stop_reason === "refusal") {
        return Response.json({ teammate: "Weft", answer: "I can't help with that one.", trace, ids: [] });
      }
      messages.push({ role: "assistant", content: res.content as Anthropic.Beta.BetaContentBlockParam[] });

      const uses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      if (res.stop_reason !== "tool_use" || uses.length === 0) {
        const text = res.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        const m = text.match(/^(Weft|Shuttle|Pattern):\s*/);
        for (const id of text.matchAll(/\[([A-Za-z0-9_-]+)\]/g)) ids.add(id[1]);
        return Response.json({ teammate: m?.[1] ?? "Weft", answer: m ? text.slice(m[0].length) : text, trace, ids: [...ids] });
      }

      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const u of uses) {
        const { query, why } = u.input as { query: string; why: string };
        try {
          const rows = await ro(query, {}, graph);
          trace.push({ why, query, rows: rows.length });
          results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(rows.slice(0, 60)) });
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          trace.push({ why, query, rows: 0, error });
          results.push({ type: "tool_result", tool_use_id: u.id, content: error, is_error: true });
        }
      }
      messages.push({ role: "user", content: results });
    }
    return Response.json({ teammate: "Weft", answer: "That took too many steps. Try a narrower question.", trace, ids: [...ids] });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "Add ANTHROPIC_API_KEY to web/.env.local and restart the dev server." }, { status: 500 });
    }
    if (e instanceof Anthropic.RateLimitError) return Response.json({ error: "Rate limited. Try again in a moment." }, { status: 429 });
    if (e instanceof Anthropic.APIError) return Response.json({ error: e.message }, { status: 502 });
    throw e;
  }
}
