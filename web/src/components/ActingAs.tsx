"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PEOPLE = [
  { id: "kshitij", name: "Kshitij", role: "Owner" },
  { id: "rohan", name: "Rohan", role: "Manager" },
  { id: "priya", name: "Priya", role: "Member" },
];

/** Who you're acting as (roles are enforced by the API). Sign-in replaces this later. */
export default function ActingAs() {
  const router = useRouter();
  const [me, setMe] = useState("kshitij");
  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )weft_as=([^;]+)/);
    if (m) setMe(m[1]);
  }, []);
  const p = PEOPLE.find((x) => x.id === me) ?? PEOPLE[0];

  return (
    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "12px 10px 4px", borderTop: "1px solid var(--line)" }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ink)", color: "var(--surface)", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{p.name[0]}</span>
      <label htmlFor="acting-as" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span className="muted" style={{ fontSize: 11 }}>Acting as</span>
        <select
          id="acting-as"
          value={me}
          onChange={(e) => {
            document.cookie = `weft_as=${e.target.value}; path=/; max-age=31536000`;
            setMe(e.target.value);
            router.refresh();
          }}
          style={{ border: "none", background: "transparent", font: "600 14px var(--sans)", color: "var(--ink)", padding: 0 }}
        >
          {PEOPLE.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.role}</option>)}
        </select>
      </label>
    </div>
  );
}
