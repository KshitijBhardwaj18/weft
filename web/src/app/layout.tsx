import type { Metadata } from "next";
import { EB_Garamond, Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Frame from "@/components/Frame";
import { viewer } from "@/lib/session";

const garamond = EB_Garamond({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-garamond" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Weft · one live plan from planning to restock",
  description: "One live plan for every drop: from factory to shop and back into the next restock.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const me = await viewer();
  return (
    <html lang="en" className={`${garamond.variable} ${figtree.variable} ${mono.variable}`}>
      <body>
        <Suspense>
          <Frame guest={!me.team && !!me.supplier}>{children}</Frame>
        </Suspense>
      </body>
    </html>
  );
}
