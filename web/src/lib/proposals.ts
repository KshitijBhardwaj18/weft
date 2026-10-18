import Anthropic from "@anthropic-ai/sdk";
import { runAgent } from "./agent";
import { channel, messages, postMessage, type ChatMessage } from "./chat";
import { raiseDelay } from "./checkins";
import { q } from "./graph";
import { activeGraph, pos } from "./plan";

const client = new Anthropic();
const STAGES = ["Fabric", "Cutting", "Stitching", "QC", "Dispatch", "Received"];
const TEAMMATES = { weft: "Weft", shuttle: "Shuttle", pattern: "Pattern" } as const;

type Update =
  | { kind: "stage"; po: string; stage: string; evidence: string }
  | { kind: "delay"; po: string; date: string; evidence: string };

const proposeTool: Anthropic.Tool = {
  name: "propose_updates",
  description:
    "Record plan updates stated in the message. Use 'stage' when a PO moved to a later production stage (e.g. 'cutting done' => Stitching, 'QC started' => QC). Use 'delay' when the message says fabric or goods will arrive on a new date. Return an empty list when the message states no such update.",
  input_schema: {
    type: "object",
    properties: {
      updates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["stage", "delay"] },
            po: { type: "string", description: "PO id, e.g. PO-014" },
            stage: { type: "string", enum: STAGES, description: "For kind=stage: the stage the PO is now in." },
            date: { type: "string", description: "For kind=delay: new arrival date, ISO YYYY-MM-DD." },
            evidence: { type: "string", description: "The words in the message that state this." },
          },
          required: ["kind", "po", "evidence"],
          additionalProperties: false,
        },
      },
    },
    required: ["updates"],
    additionalProperties: false,
  },
};

/** Ask Claude which plan updates a chat message states, given the open POs. */
async function extract(msg: ChatMessage, context: string): Promise<Update[]> {
  const res = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    output_config: { effort: "low" },
    tools: [proposeTool],
    system:
      "You read messages in a D2C brand's supplier and team chats and record plan updates. Always call propose_updates exactly once (with an empty list if nothing changed). Only record what the message clearly states. Resolve dates like '28th' to the next such date after today.",
    messages: [{ role: "user", content: `${context}\n\nMessage from ${msg.author}: "${msg.text}"` }],
  } as Anthropic.MessageCreateParamsNonStreaming);
  const use = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  return ((use?.input as { updates?: Update[] })?.updates ?? []).filter((u) => u.po && (u.kind === "stage" ? !!u.stage : !!u.date));
}

/** A teammate answers in the chat it was asked in. */
async function reply(channelId: string, as: "Weft" | "Shuttle" | "Pattern", question: string) {
  const recent = (await messages(channelId, 200)).slice(-8).map((m) => `${m.author}: ${m.text}`).join("\n");
  try {
    const a = await runAgent(question, { as, context: recent });
    await postMessage({ channel: channelId, author: a.teammate, authorKind: "teammate", text: a.answer, card: { type: "answer", trace: a.trace, ids: a.ids } });
  } catch (e) {
    await postMessage({ channel: channelId, author: as, authorKind: "teammate", text: `I couldn't answer just now (${e instanceof Error ? e.message : "error"}).` });
  }
}

/**
 * Teammates read every new message:
 *  - in a teammate's own chat, that teammate answers;
 *  - an @weft / @shuttle / @pattern mention gets an answer in place;
 *  - in supplier and team chats, Shuttle proposes plan updates: forward stage moves apply, date changes become a call.
 */
export async function processMessage(msg: ChatMessage): Promise<void> {
  if (msg.authorKind === "teammate" || msg.authorKind === "system") return;
  const ch = await channel(msg.channel);
  if (!ch) return;

  if (ch.kind === "agent") {
    await reply(ch.id, TEAMMATES[ch.teammate as keyof typeof TEAMMATES] ?? "Weft", msg.text);
    return;
  }

  const mention = msg.text.match(/@(weft|shuttle|pattern)\b/i)?.[1]?.toLowerCase() as keyof typeof TEAMMATES | undefined;
  if (mention) await reply(ch.id, TEAMMATES[mention], msg.text);

  const g = await activeGraph();
  const open = await pos(g);
  const scope = ch.supplierId ? open.filter((p) => p.supplierId === ch.supplierId) : open;
  if (!scope.length) return;
  const today = (await q<{ t: string }>("MATCH (d:Drop) RETURN d.today AS t", {}, g))[0]?.t;
  const context = `Today is ${today}. Open POs:\n${scope.map((p) => `${p.id}: ${p.label}, ${p.supplier}, stage ${p.stage}, due ${p.eta}`).join("\n")}`;

  let updates: Update[] = [];
  try {
    updates = await extract(msg, context);
  } catch {
    return;
  }

  for (const u of updates) {
    const po = scope.find((p) => p.id === u.po);
    if (!po) continue;
    if (u.kind === "stage") {
      // Low impact: a forward move applies on its own and is recorded against the message.
      if (STAGES.indexOf(u.stage) <= STAGES.indexOf(po.stage)) continue;
      await q(
        `MATCH (p:PO {id:$po}), (m:Message {id:$mid}) SET p.stage = $stage
         CREATE (:Fact {id:'fact-' + $mid + '-' + $po, text:$text, status:'applied'})-[:FROM]->(m)`,
        { po: u.po, stage: u.stage, mid: msg.id, text: `${u.po} moved to ${u.stage}` },
        g,
      );
      await postMessage({
        channel: ch.id, author: "Shuttle", authorKind: "teammate",
        text: `Moved ${u.po} to ${u.stage}, from ${msg.author}'s message.`,
        card: { type: "fact", applied: true, po: u.po, evidence: u.evidence, source: msg.id, teamOnly: true },
      });
    } else {
      // High impact: a date change never applies itself; it becomes a call with its impact.
      const { summary } = await raiseDelay(u.po, u.date, msg.id);
      await postMessage({
        channel: ch.id, author: "Shuttle", authorKind: "teammate",
        text: `This changes a date, so it's your call. ${summary}`,
        card: { type: "call", po: u.po, evidence: u.evidence, source: msg.id, teamOnly: true },
      });
    }
  }
}
