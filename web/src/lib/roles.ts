import { cookies } from "next/headers";

/** Workspace roles. Sign-in comes later; for now the person you act as is chosen in the sidebar (cookie). */
export type Role = "Owner" | "Manager" | "Member";
export const PEOPLE = [
  { id: "kshitij", name: "Kshitij", role: "Owner" as Role },
  { id: "rohan", name: "Rohan", role: "Manager" as Role },
  { id: "priya", name: "Priya", role: "Member" as Role },
];

export async function actingAs() {
  const id = (await cookies()).get("weft_as")?.value;
  return PEOPLE.find((p) => p.id === id) ?? PEOPLE[0];
}

/** Owners and Managers decide calls, send to suppliers, and apply scenarios. */
export async function canDecide() {
  const me = await actingAs();
  return me.role === "Owner" || me.role === "Manager";
}
