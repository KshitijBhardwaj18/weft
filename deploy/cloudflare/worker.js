// Weft on Cloudflare: a stable workers.dev URL in front of the app origin.
// ORIGIN is the app server (today a Cloudflare Tunnel to the Next.js server); swap it without changing the public URL.
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = new URL(env.ORIGIN);
    const target = new URL(url.pathname + url.search, origin);
    const res = await fetch(new Request(target, req), { redirect: "manual" });
    const loc = res.headers.get("location");
    if (!loc) return res;
    // Keep visitors on the public host when the app redirects.
    const headers = new Headers(res.headers);
    headers.set("location", loc.replace(origin.origin, url.origin).replace(/^https?:\/\/localhost(:\d+)?/, url.origin));
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};
