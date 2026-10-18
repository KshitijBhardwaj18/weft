import { cookies } from "next/headers";
import { FalkorDB } from "falkordb";

const connect = () => FalkorDB.connect({ url: process.env.FALKORDB_URL ?? "falkor://localhost:6380" });

// On Node: one connection per server process (survives Next.js dev hot reloads).
// On Cloudflare Workers a socket belongs to the request that opened it, so each request gets its own.
const g = globalThis as unknown as { __falkor?: Promise<FalkorDB> };
const onWorkers = globalThis.navigator?.userAgent === "Cloudflare-Workers";
const perRequest = new WeakMap<object, Promise<FalkorDB>>();

export async function db(): Promise<FalkorDB> {
  if (!onWorkers) return (g.__falkor ??= connect());
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { ctx } = getCloudflareContext();
  let c = perRequest.get(ctx);
  if (!c) perRequest.set(ctx, (c = connect()));
  return c;
}

export const PLAN = "weft"; // the live plan: the source of truth
export const LIVE_SNAPSHOT = "weft_live"; // day-9 snapshot used by the demo clock
export const META = "weft_meta"; // workspace settings (active phase, scenarios)

// Code uses logical graph names. A demo visitor's requests resolve them inside the visitor's own
// workspace (`ws_<id>__weft`, ...), copied from the templates with GRAPH.COPY at sign-in.
// Requests without a workspace (webhooks, scripts, the real brand) use the names as they are.
export const WS_COOKIE = "weft_ws";
const WS_ID = /^[a-z0-9]{6,24}$/;
export const wsPrefix = (id: string) => `ws_${id}__`;

async function workspace(): Promise<string> {
  try {
    const id = (await cookies()).get(WS_COOKIE)?.value ?? "";
    return WS_ID.test(id) ? id : "";
  } catch {
    return ""; // outside a request
  }
}

export async function physical(name: string): Promise<string> {
  const id = await workspace();
  return id ? wsPrefix(id) + name : name;
}

type Params = Record<string, string | number | boolean | null | Array<unknown> | Record<string, unknown>>;

export async function q<T = Record<string, unknown>>(cypher: string, params: Params = {}, graph = PLAN): Promise<T[]> {
  const res = await (await db()).selectGraph(await physical(graph)).query<T>(cypher, { params: params as never });
  return res.data ?? [];
}

export async function ro<T = Record<string, unknown>>(cypher: string, params: Params = {}, graph = PLAN): Promise<T[]> {
  const res = await (await db()).selectGraph(await physical(graph)).roQuery<T>(cypher, { params: params as never });
  return res.data ?? [];
}

// GRAPH.COPY: scenarios and snapshots are full copies of the plan graph.
export async function copyGraph(from: string, to: string) {
  const d = await db();
  const [src, dst] = [await physical(from), await physical(to)];
  if ((await d.list()).includes(dst)) await d.selectGraph(dst).delete();
  await d.selectGraph(src).copy(dst);
}

export async function deleteGraph(name: string) {
  const d = await db();
  const p = await physical(name);
  if ((await d.list()).includes(p)) await d.selectGraph(p).delete();
}
