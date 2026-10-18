import { EventEmitter } from "node:events";
import { physical, q, ro } from "./graph";
import { activeGraph } from "./plan";

/**
 * Conversations live in the plan graph:
 *   (:Channel {id, kind: 'supplier'|'team'|'agent', name, supplierId?, teammate?})
 *   (:Message {id, author, authorKind: 'person'|'supplier'|'teammate'|'system', text, at, card?})-[:IN]->(:Channel)
 * `card` is a JSON string for structured messages (PO, check-in, call, fact).
 */
export type ChannelKind = "supplier" | "team" | "agent";
export type Channel = { id: string; kind: ChannelKind; name: string; supplierId: string | null; teammate: string | null };
export type AuthorKind = "person" | "supplier" | "teammate" | "system";
export type ChatMessage = { id: string; channel: string; author: string; authorKind: AuthorKind; text: string; at: string; card: string | null };

// In-process pub/sub for real-time delivery (SSE). One bus per server process.
const g = globalThis as unknown as { __weftBus?: EventEmitter };
export const bus: EventEmitter = (g.__weftBus ??= new EventEmitter().setMaxListeners(200));

export async function channels(): Promise<Channel[]> {
  return ro<Channel>(
    `MATCH (c:Channel) RETURN c.id AS id, c.kind AS kind, c.name AS name, c.supplierId AS supplierId, c.teammate AS teammate ORDER BY c.kind, c.name`,
    {},
    await activeGraph(),
  );
}

export async function channel(id: string): Promise<Channel | undefined> {
  const [c] = await ro<Channel>(
    `MATCH (c:Channel {id:$id}) RETURN c.id AS id, c.kind AS kind, c.name AS name, c.supplierId AS supplierId, c.teammate AS teammate`,
    { id },
    await activeGraph(),
  );
  return c;
}

export async function messages(channelId: string, limit = 100): Promise<ChatMessage[]> {
  return ro<ChatMessage>(
    `MATCH (m:Message)-[:IN]->(c:Channel {id:$id})
     RETURN m.id AS id, c.id AS channel, m.author AS author, m.authorKind AS authorKind, m.text AS text, m.at AS at, m.card AS card
     ORDER BY m.at ASC LIMIT $limit`,
    { id: channelId, limit },
    await activeGraph(),
  );
}

/** Persist a message in the graph and push it to every open stream on that channel. */
export async function postMessage(input: {
  channel: string;
  author: string;
  authorKind: AuthorKind;
  text: string;
  card?: Record<string, unknown> | null;
}): Promise<ChatMessage> {
  const graph = await activeGraph();
  // Stamp messages on the demo clock (the drop's "today") so they sort after the seeded history.
  const [d] = await ro<{ today: string }>("MATCH (d:Drop) RETURN d.today AS today", {}, graph);
  const now = new Date().toISOString();
  const msg: ChatMessage = {
    id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    channel: input.channel,
    author: input.author,
    authorKind: input.authorKind,
    text: input.text,
    at: d?.today ? `${d.today}${now.slice(10)}` : now,
    card: input.card ? JSON.stringify(input.card) : null,
  };
  await q(
    `MATCH (c:Channel {id:$channel})
     CREATE (:Message {id:$id, author:$author, authorKind:$authorKind, text:$text, at:$at, card:$card})-[:IN]->(c)`,
    msg,
    graph,
  );
  bus.emit(`msg:${await physical(msg.channel)}`, msg);
  return msg;
}

/** The supplier chat for a supplier id (e.g. 'sri' -> 'sup-sri'). */
export const supplierChannelId = (supplierId: string) => `sup-${supplierId}`;
