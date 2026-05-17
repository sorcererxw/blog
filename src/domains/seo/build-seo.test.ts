import { describe, expect, it } from "vitest";

import { buildSeo } from "./build-seo";

describe("buildSeo", () => {
  it("builds canonical, robots, and social metadata for indexable pages", () => {
    const seo = buildSeo({
      description: "Technical notes about Astro and Cloudflare.",
      kind: "collection",
      pathname: "/",
      title: "Engineering writing overview",
    });

    expect(seo.title).toBe("Engineering writing overview | sorcererxw'blog");
    expect(seo.canonicalUrl).toBe("https://sorcererxw.com/");
    expect(seo.robots).toBe("index,follow,max-image-preview:large");
    expect(seo.openGraph.type).toBe("website");
    expect(seo.twitter.card).toBe("summary");
    expect(seo.openGraph.image).toBeNull();
  });

  it("marks non-indexable pages with noindex robots", () => {
    const seo = buildSeo({
      description: "Boundary copy",
      indexable: false,
      kind: "boundary",
      pathname: "/articles/missing",
      title: "Page not found.",
    });

    expect(seo.robots).toBe("noindex,nofollow,max-image-preview:large");
    expect(seo.indexable).toBe(false);
  });

  it("uses article metadata when the route kind is article", () => {
    const seo = buildSeo({
      description: "How the Astro migration landed on Cloudflare.",
      image: {
        alt: "Article cover",
        url: "https://images.example.com/cover.jpg",
      },
      kind: "article",
      modifiedTime: "2026-04-15T00:00:00.000Z",
      pathname: "/articles/modern-astro",
      publishedTime: "2026-04-14T00:00:00.000Z",
      title: "Building the new blog shell",
    });

    expect(seo.openGraph.type).toBe("article");
    expect(seo.openGraph.publishedTime).toBe("2026-04-14T00:00:00.000Z");
    expect(seo.openGraph.modifiedTime).toBe("2026-04-15T00:00:00.000Z");
    expect(seo.twitter.image?.url).toBe("https://images.example.com/cover.jpg");
  });
});
