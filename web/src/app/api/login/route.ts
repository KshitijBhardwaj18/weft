import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

export async function POST(req: Request) {
  const form = await req.formData();
  const ok = String(form.get("email")).trim().toLowerCase() === DEMO_EMAIL && String(form.get("password")) === DEMO_PASSWORD;
  if (!ok) return Response.redirect(new URL("/login?error=1", req.url), 303);
  const res = Response.redirect(new URL("/?tour=1", req.url), 303);
  const h = new Headers(res.headers);
  h.append("Set-Cookie", "weft_session=demo; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800");
  h.append("Set-Cookie", "weft_as=kshitij; Path=/; SameSite=Lax; Max-Age=604800");
  return new Response(null, { status: 303, headers: h });
}
