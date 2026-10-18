import { LIVE_SNAPSHOT, META, PLAN, db, wsPrefix } from "./graph";

// Each demo visitor gets a private copy of the demo brand, made with GRAPH.COPY from the
// template graphs that `pnpm seed` writes (`tpl__weft`, ...). Workspaces expire after a day.
const GRAPHS = [PLAN, LIVE_SNAPSHOT, META];
const tpl = (name: string) => `tpl__${name}`;
const REGISTRY = "weft_workspaces";
const TTL_MS = 24 * 3_600_000;

async function copyTemplates(prefix: string) {
  const d = await db();
  const have = await d.list();
  for (const name of GRAPHS) {
    if (!have.includes(tpl(name))) throw new Error(`Template ${tpl(name)} is missing: run pnpm seed`);
    if (have.includes(prefix + name)) await d.selectGraph(prefix + name).delete();
    await d.selectGraph(tpl(name)).copy(prefix + name);
  }
}

async function dropWorkspace(id: string) {
  const d = await db();
  for (const name of await d.list()) if (name.startsWith(wsPrefix(id))) await d.selectGraph(name).delete();
}

export async function createWorkspace(): Promise<string> {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  await copyTemplates(wsPrefix(id));
  const reg = (await db()).selectGraph(REGISTRY);
  await reg.query("CREATE (:Workspace {id:$id, at:$at})", { params: { id, at: Date.now() } });
  // Clean up workspaces nobody has used for a day.
  const stale = await reg.query<{ id: string }>("MATCH (w:Workspace) WHERE w.at < $cut RETURN w.id AS id", { params: { cut: Date.now() - TTL_MS } });
  for (const { id: old } of stale.data ?? []) await dropWorkspace(old);
  await reg.query("MATCH (w:Workspace) WHERE w.at < $cut DELETE w", { params: { cut: Date.now() - TTL_MS } });
  return id;
}

/** Back to the seeded demo: the workspace's graphs, scenarios included, are replaced by fresh copies. */
export async function resetWorkspace(id: string) {
  await dropWorkspace(id);
  await copyTemplates(wsPrefix(id));
}
