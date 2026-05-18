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
});
