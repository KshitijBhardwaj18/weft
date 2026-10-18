import { NextResponse, type NextRequest } from "next/server";

// The demo sits behind a demo login. Public: the landing page, login, and integration webhooks.
const PUBLIC = ["/welcome", "/login", "/api/login", "/api/integrations"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  if (req.cookies.get("weft_session")?.value) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  return NextResponse.redirect(new URL(pathname === "/" ? "/welcome" : "/login", req.url));
}

export const config = { matcher: ["/((?!_next/|favicon.ico|weft-demo.mp4|.*\\.(?:png|jpg|svg|webp|gif)$).*)"] };
