import { morningBrief } from "@/lib/brief";

export async function GET() {
  try {
    return Response.json(await morningBrief());
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
