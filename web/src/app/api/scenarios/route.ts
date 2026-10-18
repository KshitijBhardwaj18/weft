import { after } from "next/server";
import { notifySupplier } from "@/lib/integrations/notify";
import { canDecide } from "@/lib/roles";
import { applyScenario, createScenario, discardScenario } from "@/lib/scenarios";

export async function POST(req: Request) {
  const body = (await req.json()) as { action: "create" | "apply" | "discard"; po?: string; to?: string; id?: string };
  if (body.action === "create" && body.po && body.to) return Response.json(await createScenario(body.po, body.to));
  if (body.action === "apply" && body.id) {
    if (!(await canDecide())) return Response.json({ error: "Waiting for an Owner or Manager." }, { status: 403 });
    const s = await applyScenario(body.id);
    if (s) after(() => notifySupplier(s.to, { kind: "po", poId: s.po }));
    return Response.json({ ok: true });
  }
  if (body.action === "discard" && body.id) {
    await discardScenario(body.id);
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Bad request" }, { status: 400 });
}
