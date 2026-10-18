import type { Metadata } from "next";
import { EB_Garamond, Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AskPanel from "@/components/AskPanel";

const garamond = EB_Garamond({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-garamond" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Weft",
  description: "One live plan for every drop: from factory to shop and back into the next restock.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${garamond.variable} ${figtree.variable} ${mono.variable}`}>
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
        <AskPanel />
      </body>
    </html>
  );
}
