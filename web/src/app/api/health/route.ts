import { db } from "@/lib/graph";

export const dynamic = "force-dynamic";

// For uptime monitors: 200 when the demo database answers and its templates exist, 503 otherwise.
export async function GET() {
  try {
    const graphs = await (await db()).list();
    const ok = ["tpl__weft", "tpl__weft_live", "tpl__weft_meta"].every((g) => graphs.includes(g));
    return Response.json({ ok, database: "up", templates: ok }, { status: ok ? 200 : 503 });
  } catch (e) {
    return Response.json({ ok: false, database: "down", error: e instanceof Error ? e.message : String(e) }, { status: 503 });
  }
}
