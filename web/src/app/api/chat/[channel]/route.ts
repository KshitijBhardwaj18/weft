import { after } from "next/server";
import { channel, messages, postMessage } from "@/lib/chat";
import { ro } from "@/lib/graph";
import { activeGraph } from "@/lib/plan";
import { processMessage } from "@/lib/proposals";
import { actingAs } from "@/lib/roles";

export async function GET(_req: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel: id } = await params;
  return Response.json(await messages(id));
}

// Post a message as the current team member, or as the supplier on a supplier chat.
export async function POST(req: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel: id } = await params;
  const { text, as } = (await req.json()) as { text: string; as?: "team" | "supplier" };
  if (!text?.trim()) return Response.json({ error: "Write something first." }, { status: 400 });
  const ch = await channel(id);
  if (!ch) return Response.json({ error: "Unknown channel" }, { status: 404 });

  let author = (await actingAs()).name;
  let authorKind: "person" | "supplier" = "person";
  if (as === "supplier" && ch.supplierId) {
    const [s] = await ro<{ contact: string }>("MATCH (s:Supplier {id:$id}) RETURN s.contact AS contact", { id: ch.supplierId }, await activeGraph());
    author = s?.contact ?? "Supplier";
    authorKind = "supplier";
  }
  const msg = await postMessage({ channel: id, author, authorKind, text: text.trim() });
  // Teammates read the message after the response is sent; their replies arrive over the stream.
  after(() => processMessage(msg).catch((e) => console.error("processMessage", e)));
  return Response.json(msg);
}
