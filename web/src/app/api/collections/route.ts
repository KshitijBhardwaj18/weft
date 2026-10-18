import { after } from "next/server";
import { postMessage, supplierChannelId } from "@/lib/chat";
import { notifySupplier } from "@/lib/integrations/notify";
import { planCollection, type PlanInput } from "@/lib/planning";
import { actingAs, canDecide } from "@/lib/roles";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// An Owner or Manager plans a new collection; its POs go to the suppliers straight away.
export async function POST(req: Request) {
  if (!(await canDecide())) return Response.json({ error: "Only an Owner or Manager can plan a collection." }, { status: 403 });
  const input = (await req.json()) as PlanInput;
  const styles = (input.styles ?? []).filter((s) => s.name?.trim() && s.units > 0 && s.colours?.length && s.supplierId);
  if (!input.name?.trim() || !input.date || !styles.length) return Response.json({ error: "Give the collection a name, a launch date and at least one style." }, { status: 400 });
  if (input.split.S + input.split.M + input.split.L !== 100) return Response.json({ error: "The size split has to add up to 100%." }, { status: 400 });

  const me = await actingAs();
  const { dropId, pos } = await planCollection({ ...input, name: input.name.trim(), styles }, me);
  for (const p of pos) {
    await postMessage({ channel: supplierChannelId(p.supplierId), author: me.name, authorKind: "person", text: `New order ${p.id}: ${p.qty} pcs of ${p.label} for ${input.name.trim()}, due ${fmt(p.eta)}.` });
  }
  after(async () => {
    for (const p of pos) await notifySupplier(p.supplierId, { kind: "po", poId: p.id }).catch(() => {});
  });
  return Response.json({ dropId, pos: pos.map((p) => p.id) });
}
