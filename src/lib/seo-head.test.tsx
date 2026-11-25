import { describe, expect, it } from "vitest";

import { buildSeo } from "@/domains/seo/build-seo";

import { seoToHead } from "./seo-head";

describe("seoToHead", () => {
  it("exposes the brand icon as the route favicon and canonical link", () => {
    const head = seoToHead(
      buildSeo({
        description: "A personal site overview.",
        kind: "home",
        pathname: "/",
        title: "Personal Site",
      }),
    );

    expect(head.links).toEqual([
      { href: "https://sorcererxw.com/", rel: "canonical" },
      { href: "/favicon.svg", rel: "icon", type: "image/svg+xml" },
      { href: "/favicon.svg", rel: "shortcut icon", type: "image/svg+xml" },
    ]);
  });

  it("keeps the root browser title to the brand name", () => {
    const head = seoToHead(
      buildSeo({
        description: "A personal site overview.",
        kind: "home",
        pathname: "/",
        title: "sorcererxw",
      }),
    );

    expect(head.meta).toContainEqual({ title: "sorcererxw" });
  });

  it("formats article browser titles with the brand suffix and OpenGraph metadata", () => {
    const head = seoToHead(
      buildSeo({
        description: "A technical article.",
        kind: "article",
        pathname: "/articles/example",
        publishedTime: "2026-05-18T00:00:00.000Z",
        title: "Example article",
      }),
    );

    expect(head.meta).toContainEqual({ title: "Example article | sorcererxw" });
    expect(head.meta).toContainEqual({
      content: "A technical article.",
      name: "description",
    });
    expect(head.meta).toContainEqual({
      content: "article",
      property: "og:type",
    });
    expect(head.meta).toContainEqual({
      content: "2026-05-18T00:00:00.000Z",
      property: "article:published_time",
    });
  });
});
