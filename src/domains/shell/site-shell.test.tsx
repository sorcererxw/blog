import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "@/domains/shell/site-footer";
import { SiteHeader } from "@/domains/shell/site-header";
import {
  getCurrentPublicRoute,
  getFooterLinks,
  getPublicRoutes,
} from "@/domains/shell/site-links";

describe("site shell", () => {
  it("maps the current public route from the pathname", () => {
    expect(getCurrentPublicRoute("/")).toBe("home");
    expect(getCurrentPublicRoute("/blog")).toBe("blog");
    expect(getCurrentPublicRoute("/thoughts")).toBe("thoughts");
    expect(getCurrentPublicRoute("/projects")).toBe("projects");
    expect(getCurrentPublicRoute("/stack")).toBe("stack");
    expect(getCurrentPublicRoute("/articles/hello-world")).toBe("blog");
    expect(getPublicRoutes("blog").find((route) => route.key === "blog")?.active).toBe(true);
    expect(getPublicRoutes("stack").find((route) => route.key === "stack")?.active).toBe(true);
    expect(getPublicRoutes("blog").map((route) => route.key)).toEqual([
      "home",
      "blog",
      "thoughts",
      "projects",
      "stack",
    ]);
  });

  it("renders the header with the full public navigation", () => {
    const markup = renderToStaticMarkup(<SiteHeader currentPath="/blog" />);

    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/blog"');
    expect(markup).toContain('href="/thoughts"');
    expect(markup).toContain('href="/projects"');
    expect(markup).toContain('href="/stack"');
    expect(markup).toContain('href="/favicon.svg"');
    expect(markup).toContain("sorcererxw&#x27;s blog");
    expect(markup).toContain("items-center");
    expect(markup).toMatch(/<a[^>]*href="\/blog"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/blog"/);
  });

  it("can hide the stack entry for production route lists", () => {
    expect(getPublicRoutes("blog", { includeStack: false }).map((route) => route.key)).toEqual([
      "home",
      "blog",
      "thoughts",
      "projects",
    ]);
    expect(getFooterLinks({ includeStack: false }).find((group) => group.title === "站内")?.links.map((route) => route.label)).toEqual([
      "Home",
      "Blog",
      "Thoughts",
      "Projects",
    ]);
    expect(getFooterLinks({ includeStack: false }).find((group) => group.title === "站外")?.links.map((route) => route.label)).toEqual([
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
    expect(markup).not.toContain(">站内<");
    expect(markup).not.toContain(">站外<");
    expect(markup).toContain('href="https://github.com/sorcererxw"');
    expect(markup).toContain('href="https://t.me/s/tech_bb"');
    expect(markup).toContain('href="https://jike.sorcererxw.com"');
    expect(markup).toContain('href="/stack"');
    expect(markup).toContain('href="/blog"');
    expect(markup).toContain('href="/projects"');
    expect(markup).toContain('href="/thoughts"');
    expect(markup).not.toContain('aria-label="Locale switcher"');
    expect(markup).not.toContain(">EN<");
    expect(markup).not.toContain(">ZH<");
    expect(markup).not.toContain("A reading-first technical publication");
    expect(markup).not.toContain("Writing first. Thoughts, projects, and stack live nearby.");
  });
});
