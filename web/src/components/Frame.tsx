"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import AskPanel from "./AskPanel";
import Tour from "./Tour";

// The landing page and login render bare; everything else gets the app shell.
export default function Frame({ children, guest = false }: { children: React.ReactNode; guest?: boolean }) {
  const bare = ["/welcome", "/login"].includes(usePathname());
  if (bare) return <>{children}</>;
  // Suppliers see only their own page: no team navigation, no Ask, no tour.
  if (guest) return <div className="shell"><main className="main" style={{ margin: 12 }}>{children}</main></div>;
  return (
    <>
      <div className="shell">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
      <AskPanel />
      <Tour />
    </>
  );
}
