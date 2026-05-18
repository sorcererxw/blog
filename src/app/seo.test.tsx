import { describe, expect, it } from "vitest";

import { buildSeo } from "@/domains/seo/build-seo";

import { seoToMetadata } from "./seo";

describe("seoToMetadata", () => {
  it("exposes the brand icon as the route favicon", () => {
    const metadata = seoToMetadata(
      buildSeo({
        description: "A personal site overview.",
        kind: "home",
        pathname: "/",
        title: "Personal Site",
      }),
    );

    expect(metadata.icons).toEqual({
      icon: [{ type: "image/svg+xml", url: "/favicon.svg" }],
      shortcut: [{ type: "image/svg+xml", url: "/favicon.svg" }],
    });
  });

  it("keeps the root browser title to the brand name", () => {
    const metadata = seoToMetadata(
      buildSeo({
        description: "A personal site overview.",
        kind: "home",
        pathname: "/",
        title: "sorcererxw",
      }),
    );

    expect(metadata.title).toBe("sorcererxw");
  });

  it("formats article browser titles with the brand suffix", () => {
    const metadata = seoToMetadata(
      buildSeo({
        description: "A technical article.",
        kind: "article",
        pathname: "/articles/example",
        title: "Example article",
      }),
    );

    expect(metadata.title).toBe("Example article | sorcererxw");
  });
});
