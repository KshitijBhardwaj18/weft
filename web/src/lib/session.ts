import { cookies } from "next/headers";
import { supplierFromCookie } from "./supplier-access";

/** Who is making this request: a team member (demo login) and/or a supplier from a signed link. */
export async function viewer(): Promise<{ team: boolean; supplier: string | null }> {
  const c = await cookies();
  return { team: !!c.get("weft_session")?.value, supplier: await supplierFromCookie(c.get("weft_supplier")?.value) };
}
