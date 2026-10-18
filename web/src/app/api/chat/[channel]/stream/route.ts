import { bus, type ChatMessage } from "@/lib/chat";
import { physical } from "@/lib/graph";

export const dynamic = "force-dynamic";

// Server-Sent Events: every message posted to this channel is pushed to open clients in real time.
export async function GET(req: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel: id } = await params;
  const channel = await physical(id); // one bus key per workspace and channel
  const enc = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (msg: ChatMessage) => controller.enqueue(enc.encode(`data: ${JSON.stringify(msg)}\n\n`));
      const beat = setInterval(() => controller.enqueue(enc.encode(": ping\n\n")), 15_000);
      bus.on(`msg:${channel}`, send);
      cleanup = () => {
        clearInterval(beat);
        bus.off(`msg:${channel}`, send);
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try { controller.close(); } catch {}
      });
      controller.enqueue(enc.encode(": open\n\n"));
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive" },
  });
}
