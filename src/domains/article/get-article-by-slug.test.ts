import { describe, expect, it, vi } from "vitest";

import { createMemoryArticleDetailCache } from "@/integrations/kv/article-detail-cache";
import { createNotionArticleDetailSource } from "@/integrations/notion/article-detail";
import { getArticleBySlug } from "@/domains/article/get-article-by-slug";

describe("getArticleBySlug", () => {
  it("returns a single article detail for a slug and preserves detail blocks", async () => {
    const source = createNotionArticleDetailSource(
      vi.fn(async ({ slug }) => {
        if (slug !== "hello-world") {
          return null;
        }

        return {
          id: "article-1",
          slug: "hello-world",
          title: "Hello World",
          summary: "A short introduction",
          date: new Date("2026-02-11T00:00:00.000Z"),
          cover: "https://example.com/cover.jpg",
          icon: { kind: "emoji", value: "✦" },
          blocks: [
            { kind: "heading", level: 2, text: "Getting started" },
            { kind: "paragraph", text: "This is the first section." },
            { kind: "quote", text: "A representative excerpt." },
          ],
        };
      }),
    );

    const cache = createMemoryArticleDetailCache();

    const article = await getArticleBySlug({
      source,
      cache,
      slug: "hello-world",
    });

    expect(article).toEqual({
      id: "article-1",
      slug: "hello-world",
      title: "Hello World",
      summary: "A short introduction",
      date: new Date("2026-02-11T00:00:00.000Z"),
      cover: "https://example.com/cover.jpg",
      icon: { kind: "emoji", value: "✦" },
      blocks: [
        { kind: "heading", level: 2, text: "Getting started" },
        { kind: "paragraph", text: "This is the first section." },
        { kind: "quote", text: "A representative excerpt." },
      ],
    });
  });

  it("excludes WIP articles by default", async () => {
    const source = createNotionArticleDetailSource(
      vi.fn(async () => ({
        id: "article-wip",
        slug: "draft-post",
        title: "Draft Post",
        summary: "Draft summary",
        date: new Date("2026-02-12T00:00:00.000Z"),
        wip: true,
        blocks: [{ kind: "paragraph", text: "Hidden while WIP." }],
      })),
    );

    const article = await getArticleBySlug({
      source,
      slug: "draft-post",
    });

    expect(article).toBeNull();
  });

  it("returns null when the slug does not exist", async () => {
    const source = createNotionArticleDetailSource(vi.fn(async () => null));

    const article = await getArticleBySlug({
      source,
      slug: "missing-post",
    });

    expect(article).toBeNull();
  });
});
