import { NextResponse, type NextRequest } from "next/server";
import { supplierFromCookie, validSupplierToken } from "@/lib/supplier-access";

// The team sits behind the demo login. Suppliers get in with a signed link to their own view only.
const PUBLIC = ["/welcome", "/login", "/api/login", "/api/integrations"];

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  if (req.cookies.get("weft_session")?.value) return NextResponse.next();

  // A supplier's signed link: remember it in a cookie, then drop the token from the URL.
  const own = pathname.match(/^\/supplier\/([\w-]+)$/)?.[1];
  const k = searchParams.get("k");
  if (own && k && (await validSupplierToken(own, k))) {
    const clean = req.nextUrl.clone();
    clean.searchParams.delete("k");
    const res = NextResponse.redirect(clean);
    res.cookies.set("weft_supplier", `${own}.${k}`, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
    res.cookies.set("weft_guest", own, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
    return res;
  }
  const supplier = await supplierFromCookie(req.cookies.get("weft_supplier")?.value);
  if (supplier) {
    const mine = [`/supplier/${supplier}`, `/api/chat/sup-${supplier}`, `/api/checkins/`];
    if (mine.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : p + "/"))) return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  return NextResponse.redirect(new URL(pathname === "/" ? "/welcome" : "/login", req.url));
}

export const config = { matcher: ["/((?!_next/|favicon.ico|weft-demo.mp4|.*\\.(?:png|jpg|svg|webp|gif)$).*)"] };
