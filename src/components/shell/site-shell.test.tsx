import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import {
  getCurrentPublicRoute,
  getFooterLinks,
  getPublicRoutes,
} from "@/domains/shell/site-links";

describe("site shell", () => {
  it("maps the current public route from the pathname", () => {
    expect(getCurrentPublicRoute("/")).toBe("home");
    expect(getCurrentPublicRoute("/blog")).toBeNull();
    expect(getCurrentPublicRoute("/thoughts")).toBe("thoughts");
    expect(getCurrentPublicRoute("/projects")).toBe("projects");
    expect(getCurrentPublicRoute("/stack")).toBeNull();
    expect(getCurrentPublicRoute("/articles/hello-world")).toBe("blog");
    expect(getPublicRoutes("blog").find((route) => route.key === "blog")).toBeUndefined();
    expect(getPublicRoutes("home").map((route) => route.key)).toEqual([]);
  });

  it("renders the header with the brand and theme toggle", () => {
    const markup = renderToStaticMarkup(<SiteHeader currentPath="/" />);

    expect(markup).toContain('href="/"');
    expect(markup).not.toContain('href="/blog"');
    expect(markup).not.toContain('href="/thoughts"');
    expect(markup).not.toContain('href="/projects"');
    expect(markup).not.toContain('href="/stack"');
    expect(markup).toContain('src="/favicon.svg"');
    expect(markup).toContain(">sorcererxw<");
    expect(markup).not.toContain("sorcererxw&#x27;s blog");
    expect(markup).toContain("items-center");
    expect(markup).toContain('aria-label="Switch to dark theme"');
    expect(markup).not.toContain("Public routes");
    expect(markup).not.toContain("border-b");
    expect(markup).not.toContain(">Home<");
  });

  it("keeps compatibility routes out of route lists", () => {
    expect(getPublicRoutes("blog").map((route) => route.key)).toEqual([]);
    expect(getFooterLinks().find((group) => group.title === "站内")).toBeUndefined();
    expect(getFooterLinks().find((group) => group.title === "站外")?.links.map((route) => route.label)).toEqual([
      "Jike",
      "Github",
      "Telegram",
    ]);
  });

  it("renders a grouped footer map without logo or brand", () => {
    const markup = renderToStaticMarkup(<SiteFooter />);

    expect(markup).not.toContain("Colophon");
    expect(markup).not.toContain("sorcererxw&#x27;s blog");
    expect(markup).not.toContain("/favicon.svg");
    expect(markup).toContain("© 2026 sorcererxw");
    expect(markup).toContain("Footer site map");
    expect(markup).toContain("sm:justify-self-end");
    expect(markup).not.toContain("border-t");
    expect(markup).not.toContain(">Home<");
    expect(markup).not.toContain(">站内<");
    expect(markup).not.toContain(">站外<");
    expect(markup).toContain('href="https://github.com/sorcererxw"');
    expect(markup).toContain('href="https://t.me/s/tech_bb"');
    expect(markup).toContain('href="https://jike.sorcererxw.com"');
    expect(markup).not.toContain('href="/stack"');
    expect(markup).not.toContain('href="/blog"');
    expect(markup).not.toContain('href="/projects"');
    expect(markup).not.toContain('href="/thoughts"');
    expect(markup).not.toContain('aria-label="Locale switcher"');
    expect(markup).not.toContain(">EN<");
    expect(markup).not.toContain(">ZH<");
    expect(markup).not.toContain("A reading-first technical publication");
    expect(markup).not.toContain("Writing first. Thoughts, projects, and stack live nearby.");
  });
});
