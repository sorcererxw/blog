import "./globals.css";

import type { ReactNode } from "react";
import { Courier_Prime, Libre_Bodoni } from "next/font/google";

import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { cn } from "@/lib/utils";

const headingFont = Libre_Bodoni({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading-system",
  display: "swap",
});

const courierPrimeFont = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime-system",
  display: "swap",
});

const themeInitScript = `
(function () {
  try {
    var storedTheme = window.localStorage.getItem("blog-theme");
    var theme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    var root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.dataset.theme = theme;
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={cn(
        "h-full antialiased font-display",
        headingFont.variable,
        courierPrimeFont.variable,
      )}
      lang="en"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 py-12">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
