import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { WS_COOKIE } from "@/lib/graph";
import { createWorkspace } from "@/lib/workspace";

// Signing in with the demo login gives this visitor a private copy of the demo brand.
export async function POST(req: Request) {
  const form = await req.formData();
  const ok = String(form.get("email")).trim().toLowerCase() === DEMO_EMAIL && String(form.get("password")) === DEMO_PASSWORD;
  if (!ok) return new Response(null, { status: 303, headers: { Location: "/login?error=1" } });
  let ws: string;
  try {
    ws = await createWorkspace();
  } catch (e) {
    console.error("login: workspace copy failed", e);
    return new Response(null, { status: 303, headers: { Location: "/login?error=down" } });
  }
  const h = new Headers({ Location: "/?tour=1" });
  const week = "Path=/; SameSite=Lax; Max-Age=86400";
  h.append("Set-Cookie", `weft_session=demo; HttpOnly; ${week}`);
  h.append("Set-Cookie", `${WS_COOKIE}=${ws}; HttpOnly; ${week}`);
  h.append("Set-Cookie", `weft_as=kshitij; ${week}`);
  return new Response(null, { status: 303, headers: h });
}
