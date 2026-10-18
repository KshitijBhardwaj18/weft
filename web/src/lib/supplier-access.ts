// Suppliers open Weft from a signed link (email or WhatsApp), not the team login.
// The token is an HMAC of the supplier id, so a link only opens that supplier's own view.
const secret = () => process.env.SESSION_SECRET ?? "weft-dev-secret";

async function hmac(text: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`supplier:${text}`)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "").slice(0, 32);
}

export const supplierToken = (supplierId: string) => hmac(supplierId);

export async function validSupplierToken(supplierId: string, token: string | null | undefined): Promise<boolean> {
  return !!token && token === (await hmac(supplierId));
}

/** Cookie value `<supplierId>.<token>` → the supplier id, when the token is valid. */
export async function supplierFromCookie(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const [id, token] = value.split(".");
  return (await validSupplierToken(id, token)) ? id : null;
}

export async function supplierLink(appUrl: string, supplierId: string, query = ""): Promise<string> {
  return `${appUrl}/supplier/${supplierId}?k=${await supplierToken(supplierId)}${query ? `&${query}` : ""}`;
}
