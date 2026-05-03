import { describe, expect, it } from "vitest";

import {
  ASTRO_CLOUDFLARE_WEDGE,
  buildAstroCloudflareProof,
  getAstroCloudflareProofLinks,
} from "./query-wedge";

describe("query-wedge", () => {
  it("filters the current proof surfaces down to Astro and Cloudflare signals", () => {
    const proof = buildAstroCloudflareProof({
      articles: [
        {
          date: new Date("2026-04-14T00:00:00.000Z"),
          slug: "modern-astro",
          summary: "A first pass at the public blog surface on Cloudflare.",
          title: "Building the new blog shell",
        },
        {
          date: new Date("2026-04-10T00:00:00.000Z"),
          slug: "notion-pipeline",
          summary: "Notion content normalization for the site.",
          title: "Normalizing Notion content",
        },
      ],
      projects: [
        {
          description: "A compact public shell for the blog2 migration.",
          emoji: "☁",
          title: "Cloudflare shell",
          url: "https://example.com/projects/cloudflare-shell",
        },
      ],
      stack: [
        {
          description: "Edge runtime for the rebuild.",
          link: "https://workers.cloudflare.com/",
          name: "Cloudflare Workers",
          platforms: ["Web"],
          tags: ["Runtime", "Edge"],
        },
      ],
      thoughts: [
        {
          date: new Date("2026-04-01T00:00:00.000Z"),
          forwardedFrom: null,
          id: "55",
          link: "https://t.me/s/tech_bb/55",
          photos: [],
          reactions: [],
          replyTo: null,
          richText: [{ plainText: "Cloudflare snippets feel like lightweight middleware." }],
          webpage: null,
        },
      ],
    });

    expect(proof.articles.map((item) => item.slug)).toEqual(["modern-astro"]);
    expect(proof.projects).toHaveLength(1);
    expect(proof.stack).toHaveLength(1);
    expect(proof.thoughts).toHaveLength(1);
  });

  it("builds absolute proof links for the landing page schema", () => {
    const links = getAstroCloudflareProofLinks({
      articles: [
        {
          date: new Date("2026-04-14T00:00:00.000Z"),
          slug: "modern-astro",
          summary: "A first pass at the public blog surface on Cloudflare.",
          title: "Building the new blog shell",
        },
      ],
      projects: [],
      stack: [],
      thoughts: [
        {
          date: new Date("2026-04-01T00:00:00.000Z"),
          forwardedFrom: null,
          id: "55",
          link: "https://t.me/s/tech_bb/55",
          photos: [],
          reactions: [],
          replyTo: null,
          richText: [{ plainText: "Cloudflare snippets feel like lightweight middleware." }],
          webpage: null,
        },
      ],
    });

    expect(ASTRO_CLOUDFLARE_WEDGE.path).toBe("/topics/astro-cloudflare-publishing");
    expect(links).toEqual([
      {
        name: "Building the new blog shell",
        url: "https://sorcererxw.com/articles/modern-astro",
      },
      {
        name: "Cloudflare snippets feel like lightweight middleware.",
        url: "https://sorcererxw.com/thoughts#1_55",
      },
    ]);
  });
});
