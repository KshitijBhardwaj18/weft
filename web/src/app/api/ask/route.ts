import Anthropic from "@anthropic-ai/sdk";
import { runAgent } from "@/lib/agent";

export async function POST(req: Request) {
  const { question } = (await req.json()) as { question: string };
  if (!question?.trim()) return Response.json({ error: "Ask something first." }, { status: 400 });
  try {
    return Response.json(await runAgent(question));
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "Add ANTHROPIC_API_KEY to web/.env.local and restart the dev server." }, { status: 500 });
    }
    if (e instanceof Anthropic.RateLimitError) return Response.json({ error: "Rate limited. Try again in a moment." }, { status: 429 });
    if (e instanceof Anthropic.APIError) return Response.json({ error: e.message }, { status: 502 });
    throw e;
  }
}
