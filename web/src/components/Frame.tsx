"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import AskPanel from "./AskPanel";
import Tour from "./Tour";

// The landing page and login render bare; everything else gets the app shell.
export default function Frame({ children }: { children: React.ReactNode }) {
  const bare = ["/welcome", "/login"].includes(usePathname());
  if (bare) return <>{children}</>;
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
