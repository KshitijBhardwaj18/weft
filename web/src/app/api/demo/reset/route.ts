import { cookies } from "next/headers";
import { WS_COOKIE } from "@/lib/graph";
import { resetWorkspace } from "@/lib/workspace";

// Puts this visitor's workspace back to the seeded demo.
export async function POST() {
  const id = (await cookies()).get(WS_COOKIE)?.value;
  if (!id) return Response.json({ error: "No demo workspace" }, { status: 400 });
  await resetWorkspace(id);
  return Response.json({ ok: true });
}
