import { describe, expect, it, vi } from "vitest";

import { createMemoryArticleListCache } from "@/integrations/kv/article-cache";
import { listArticles } from "@/domains/article/list-articles";
import { createNotionArticleSource } from "@/integrations/notion/articles";

describe("listArticles", () => {
  it("returns newest published articles first and excludes WIP entries", async () => {
    const source = createNotionArticleSource(
      vi.fn(async () => [
        {
          id: "article-old",
          slug: "older-post",
          title: "Older Post",
          summary: "Older summary",
          date: new Date("2026-01-03T00:00:00.000Z"),
          cover: "https://example.com/older.jpg",
          icon: { kind: "emoji", value: "🧪" },
        },
        {
          id: "article-wip",
          slug: "draft-post",
          title: "Draft Post",
          summary: "Draft summary",
          date: new Date("2026-01-04T00:00:00.000Z"),
          wip: true,
        },
        {
          id: "article-new",
          slug: "newest-post",
          title: "Newest Post",
          summary: "Newest summary",
          date: new Date("2026-02-01T00:00:00.000Z"),
          cover: "https://example.com/newest.jpg",
          icon: { kind: "url", value: "https://example.com/icon.png" },
        },
      ]),
    );

    const cache = createMemoryArticleListCache();

    const items = await listArticles({
      source,
      cache,
    });

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.slug)).toEqual(["newest-post", "older-post"]);
    expect(items[0]).toMatchObject({
      slug: "newest-post",
      title: "Newest Post",
      summary: "Newest summary",
      cover: "https://example.com/newest.jpg",
      icon: { kind: "url", value: "https://example.com/icon.png" },
    });
    expect(items[0].date.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(items[1].date.toISOString()).toBe("2026-01-03T00:00:00.000Z");
  });
});

