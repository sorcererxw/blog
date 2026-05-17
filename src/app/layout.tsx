import "./globals.css";

import type { ReactNode } from "react";
import { Instrument_Sans, Newsreader, Outfit, Roboto_Slab } from "next/font/google";

import { SiteFooter } from "@/domains/shell/site-footer";
import { SiteHeader } from "@/domains/shell/site-header";
import { getRuntimeInfo } from "@/lib/cloudflare-env";
import { cn } from "@/lib/utils";

const sansFont = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans-system",
  display: "swap",
});

const uiFont = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui-system",
  display: "swap",
});

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-editorial-system",
  display: "swap",
});

const headingFont = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading-system",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  const runtime = getRuntimeInfo();
  const includeStack = !runtime.isProduction;

  return (
    <html
      className={cn(
        "h-full antialiased font-sans",
        sansFont.variable,
        uiFont.variable,
        editorialFont.variable,
        headingFont.variable,
      )}
      lang="en"
    >
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen flex-col">
          <SiteHeader includeStack={includeStack} />
          <main className="flex-1 py-12">{children}</main>
          <SiteFooter includeStack={includeStack} />
        </div>
      </body>
    </html>
  );
}
