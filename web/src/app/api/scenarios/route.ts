import { applyScenario, createScenario, discardScenario } from "@/lib/scenarios";

export async function POST(req: Request) {
  const body = (await req.json()) as { action: "create" | "apply" | "discard"; po?: string; to?: string; id?: string };
  if (body.action === "create" && body.po && body.to) return Response.json(await createScenario(body.po, body.to));
  if (body.action === "apply" && body.id) {
    await applyScenario(body.id);
    return Response.json({ ok: true });
  }
  if (body.action === "discard" && body.id) {
    await discardScenario(body.id);
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Bad request" }, { status: 400 });
}
