import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SiteLink } from "@/components/navigation/site-link";
import { PublicBoundary } from "@/components/shell/public-boundary";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import appCss from "@/styles/globals.css?url";

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

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      className="h-full antialiased font-display"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body className="relative min-h-full bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <div className="isolate relative flex min-h-svh flex-col">
          <SiteHeader />
          <main className="flex-1 py-12">{children}</main>
          <SiteFooter />
        </div>
        <Scripts />
      </body>
    </html>
  );
}

function RootNotFound() {
  return (
    <div className="mx-auto flex justify-center">
      <PublicBoundary
        actions={[
          { href: "/", label: "Open homepage" },
          { href: "/?type=writing", label: "Open writing" },
        ]}
        message="The requested page is missing. Open the homepage or return to the reading surfaces."
        title="Page not found."
      />
    </div>
  );
}

function RootErrorBoundary() {
  return (
    <section className="mx-auto grid w-[min(100%_-_2rem,40rem)] gap-5">
      <div className="space-y-5">
        <p className="m-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Publication boundary
        </p>
        <h1 className="publication-home-title text-4xl">
          The page hit an unexpected error.
        </h1>
        <p className="publication-home-summary">
          Retry the page or return to the public reading surfaces. The failure
          was captured in the app boundary.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="publication-link"
            onClick={() => window.location.reload()}
            type="button"
          >
            Try again
          </button>
          <SiteLink className="publication-link" href="/">
            Open homepage
          </SiteLink>
          <SiteLink className="publication-link" href="/?type=writing">
            Open writing
          </SiteLink>
        </div>
      </div>
    </section>
  );
}

export const Route = createRootRoute({
  component: () => <Outlet />,
  errorComponent: RootErrorBoundary,
  head: () => ({
    links: [
      { href: appCss, rel: "stylesheet" },
      { href: "/favicon.svg", rel: "icon", type: "image/svg+xml" },
      { href: "/favicon.svg", rel: "shortcut icon", type: "image/svg+xml" },
    ],
    meta: [
      { charSet: "utf-8" },
      { content: "width=device-width, initial-scale=1", name: "viewport" },
      { title: "sorcererxw" },
    ],
  }),
  notFoundComponent: RootNotFound,
  shellComponent: RootDocument,
});
