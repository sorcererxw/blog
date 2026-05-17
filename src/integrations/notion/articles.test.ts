import { afterEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const getPrimaryDataSourceIdMock = vi.fn();

vi.mock("@notionhq/client", () => ({
  Client: class {
    dataSources = {
      query: queryMock,
    };
  },
}));

vi.mock("@/lib/cloudflare-env", () => ({
  getWorkerEnv: () => ({
    NOTION_SECRET: "test-notion-secret",
    NOTION_BLOG_DATABASE_ID: "blog-database-id",
    APP_ENV: "production",
  }),
  getRuntimeInfo: () => ({
    isProduction: true,
  }),
}));

vi.mock("@/integrations/notion/data-source", () => ({
  getPrimaryDataSourceId: getPrimaryDataSourceIdMock,
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("createBlogArticleSource", () => {
  it("queries the env-owned Notion blog database and preserves external covers", async () => {
    getPrimaryDataSourceIdMock.mockResolvedValue("data-source-1");
    queryMock.mockResolvedValue({
      results: [
        {
          id: "article-1",
          icon: { type: "emoji", emoji: "✦" },
          cover: { external: { url: "https://example.com/cover.jpg" } },
          properties: {
            Name: {
              type: "title",
              title: [{ plain_text: "Article One" }],
            },
            Slug: {
              type: "rich_text",
              rich_text: [{ plain_text: "article-one" }],
            },
            Summary: {
              type: "rich_text",
              rich_text: [{ plain_text: "Article summary" }],
            },
            Date: {
              type: "date",
              date: { start: "2026-05-01" },
            },
          },
        },
      ],
    });

    const { createBlogArticleSource } = await import("@/integrations/notion/articles");
    const source = createBlogArticleSource();
    const records = await source.listArticles();

    expect(getPrimaryDataSourceIdMock).toHaveBeenCalledWith(
      expect.any(Object),
      "blog-database-id",
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data_source_id: "data-source-1",
        sorts: [{ property: "Date", direction: "descending" }],
      }),
    );
    expect(records[0]).toMatchObject({
      slug: "article-one",
      title: "Article One",
      summary: "Article summary",
      cover: "https://example.com/cover.jpg",
      icon: { kind: "emoji", value: "✦" },
    });
  });

  it("preserves Notion file covers for article list records", async () => {
    getPrimaryDataSourceIdMock.mockResolvedValue("data-source-1");
    queryMock.mockResolvedValue({
      results: [
        {
          id: "article-1",
          cover: { file: { url: "https://secure.notion-static.com/cover.png" } },
          properties: {
            Name: {
              type: "title",
              title: [{ plain_text: "Article One" }],
            },
            Slug: {
              type: "rich_text",
              rich_text: [{ plain_text: "article-one" }],
            },
          },
        },
      ],
    });

    const { createBlogArticleSource } = await import("@/integrations/notion/articles");
    const source = createBlogArticleSource();
    const records = await source.listArticles();

    expect(records[0]?.cover).toBe("https://secure.notion-static.com/cover.png");
  });
});
