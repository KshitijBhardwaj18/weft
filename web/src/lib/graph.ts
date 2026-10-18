import { FalkorDB } from "falkordb";

// One connection per server process (survives Next.js dev hot reloads).
const g = globalThis as unknown as { __falkor?: Promise<FalkorDB> };

export function db(): Promise<FalkorDB> {
  g.__falkor ??= FalkorDB.connect({ url: process.env.FALKORDB_URL ?? "falkor://localhost:6380" });
  return g.__falkor;
}

export const PLAN = "weft"; // the live plan: the source of truth
export const LIVE_SNAPSHOT = "weft_live"; // day-9 snapshot used by the demo clock
export const META = "weft_meta"; // workspace settings (active phase)

type Params = Record<string, string | number | boolean | null | Array<unknown> | Record<string, unknown>>;

export async function q<T = Record<string, unknown>>(cypher: string, params: Params = {}, graph = PLAN): Promise<T[]> {
  const res = await (await db()).selectGraph(graph).query<T>(cypher, { params: params as never });
  return res.data ?? [];
}

export async function ro<T = Record<string, unknown>>(cypher: string, params: Params = {}, graph = PLAN): Promise<T[]> {
  const res = await (await db()).selectGraph(graph).roQuery<T>(cypher, { params: params as never });
  return res.data ?? [];
}

export async function graphs(): Promise<string[]> {
  return (await db()).list();
}

// GRAPH.COPY: scenarios and snapshots are full copies of the plan graph.
export async function copyGraph(from: string, to: string) {
  const d = await db();
  if ((await d.list()).includes(to)) await d.selectGraph(to).delete();
  await d.selectGraph(from).copy(to);
}

export async function deleteGraph(name: string) {
  const d = await db();
  if ((await d.list()).includes(name)) await d.selectGraph(name).delete();
}
