import { afterEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const collectPaginatedAPIMock = vi.fn();
const getPrimaryDataSourceIdMock = vi.fn();

vi.mock("@notionhq/client", () => ({
  Client: class {
    dataSources = {
      query: queryMock,
    };

    blocks = {
      children: {
        list: vi.fn(),
      },
    };
  },
  collectPaginatedAPI: collectPaginatedAPIMock,
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

describe("createNotionArticleDetailSource", () => {
  it("normalizes recursive rich Notion blocks for article detail pages", async () => {
    getPrimaryDataSourceIdMock.mockResolvedValue("data-source-1");
    queryMock.mockResolvedValue({
      results: [
        {
          id: "page-1",
          icon: { type: "emoji", emoji: "✦" },
          cover: { external: { url: "https://example.com/cover.jpg" } },
          properties: {
            Name: {
              type: "title",
              title: [{ plain_text: "Deep Dive" }],
            },
            Slug: {
              type: "rich_text",
              rich_text: [{ plain_text: "deep-dive" }],
            },
            Summary: {
              type: "rich_text",
              rich_text: [{ plain_text: "Long form summary" }],
            },
            Date: {
              type: "date",
              date: { start: "2026-03-01" },
            },
          },
        },
      ],
    });

    collectPaginatedAPIMock.mockImplementation(async (_list, params: { block_id: string }) => {
      if (params.block_id === "page-1") {
        return [
          {
            id: "heading-1",
            type: "heading_2",
            has_children: false,
            heading_2: {
              rich_text: [
                {
                  plain_text: "Intro",
                  annotations: { bold: true },
                },
              ],
              is_toggleable: false,
            },
          },
          {
            id: "callout-1",
            type: "callout",
            has_children: true,
            callout: {
              rich_text: [
                {
                  plain_text: "Remember this",
                },
              ],
              icon: { type: "emoji", emoji: "💡" },
              color: "blue_background",
            },
          },
          {
            id: "code-1",
            type: "code",
            has_children: false,
            code: {
              language: "typescript",
              rich_text: [
                {
                  plain_text: "export const answer = 42;",
                },
              ],
              caption: [{ plain_text: "Code sample" }],
            },
          },
          {
            id: "bookmark-1",
            type: "bookmark",
            has_children: false,
            bookmark: {
              url: "https://example.com/reference",
              caption: [{ plain_text: "Bookmark caption" }],
            },
          },
        ];
      }

      if (params.block_id === "callout-1") {
        return [
          {
            id: "paragraph-1",
            type: "paragraph",
            has_children: false,
            paragraph: {
              rich_text: [
                {
                  plain_text: "Nested paragraph",
                  href: "https://example.com/nested",
                  annotations: {
                    italic: true,
                  },
                },
              ],
            },
          },
        ];
      }

      return [];
    });

    const { createNotionArticleDetailSource } = await import("@/integrations/notion/article-detail");
    const source = createNotionArticleDetailSource();
    const article = await source.getArticleBySlug({ slug: "deep-dive" });

    expect(article).toMatchObject({
      slug: "deep-dive",
      title: "Deep Dive",
      summary: "Long form summary",
      cover: "https://example.com/cover.jpg",
      icon: { kind: "emoji", value: "✦" },
    });

    expect(article?.blocks).toMatchObject([
      {
        kind: "heading",
        level: 2,
        id: "heading-1",
        richText: [
          {
            plainText: "Intro",
            bold: true,
          },
        ],
      },
      {
        kind: "callout",
        emoji: "💡",
        richText: [
          {
            plainText: "Remember this",
          },
        ],
        children: [
          {
            kind: "paragraph",
            richText: [
              {
                plainText: "Nested paragraph",
                href: "https://example.com/nested",
                italic: true,
              },
            ],
          },
        ],
      },
      {
        kind: "code",
        language: "typescript",
        text: "export const answer = 42;",
        caption: [
          {
            plainText: "Code sample",
          },
        ],
      },
      {
        kind: "bookmark",
        url: "https://example.com/reference",
        caption: "Bookmark caption",
      },
    ]);

    expect(collectPaginatedAPIMock).toHaveBeenCalledTimes(2);
    expect(getPrimaryDataSourceIdMock).toHaveBeenCalledWith(
      expect.any(Object),
      "blog-database-id",
    );
  });

  it("produces Shiki html for notion code blocks", async () => {
    getPrimaryDataSourceIdMock.mockResolvedValue("data-source-1");
    queryMock.mockResolvedValue({
      results: [
        {
          id: "page-1",
          properties: {
            Name: {
              type: "title",
              title: [{ plain_text: "Deep Dive" }],
            },
            Slug: {
              type: "rich_text",
              rich_text: [{ plain_text: "deep-dive" }],
            },
          },
        },
      ],
    });

    collectPaginatedAPIMock.mockImplementation(async (_list, params: { block_id: string }) => {
      if (params.block_id === "page-1") {
        return [
          {
            id: "code-1",
            type: "code",
            has_children: false,
            code: {
              language: "typescript",
              rich_text: [
                {
                  plain_text: "export const answer = 42;",
                },
              ],
            },
          },
        ];
      }

      return [];
    });

    const { createNotionArticleDetailSource } = await import("@/integrations/notion/article-detail");
    const source = createNotionArticleDetailSource();
    const article = await source.getArticleBySlug({ slug: "deep-dive" });
    const codeBlock = article?.blocks.find((block) => block.kind === "code");

    expect(codeBlock).toMatchObject({
      kind: "code",
      language: "typescript",
      text: "export const answer = 42;",
    });
    expect(codeBlock && "highlightedHtml" in codeBlock ? codeBlock.highlightedHtml : null).toContain(
      'class="shiki',
    );
  });

  it("marks html code blocks that start with the render marker for direct rendering", async () => {
    getPrimaryDataSourceIdMock.mockResolvedValue("data-source-1");
    queryMock.mockResolvedValue({
      results: [
        {
          id: "page-1",
          properties: {
            Name: {
              type: "title",
              title: [{ plain_text: "Screenshot Render" }],
            },
            Slug: {
              type: "rich_text",
              rich_text: [{ plain_text: "screenshot-render" }],
            },
          },
        },
      ],
    });

    collectPaginatedAPIMock.mockImplementation(async (_list, params: { block_id: string }) => {
      if (params.block_id === "page-1") {
        return [
          {
            id: "code-render-1",
            type: "code",
            has_children: false,
            code: {
              language: "html",
              rich_text: [
                {
                  plain_text:
                    '<!--render--><section data-rendered-html="true">Rendered demo</section>',
                },
              ],
            },
          },
          {
            id: "code-plain-html",
            type: "code",
            has_children: false,
            code: {
              language: "html",
              rich_text: [
                {
                  plain_text: '<section data-rendered-html="false">Plain demo</section>',
                },
              ],
            },
          },
        ];
      }

      return [];
    });

    const { createNotionArticleDetailSource } = await import("@/integrations/notion/article-detail");
    const source = createNotionArticleDetailSource();
    const article = await source.getArticleBySlug({ slug: "screenshot-render" });

    expect(article?.blocks).toEqual([
      expect.objectContaining({
        kind: "code",
        language: "html",
        renderHtml: true,
        text: '<!--render--><section data-rendered-html="true">Rendered demo</section>',
      }),
      expect.objectContaining({
        kind: "code",
        language: "html",
        renderHtml: false,
        text: '<section data-rendered-html="false">Plain demo</section>',
      }),
    ]);
    expect(
      article?.blocks[0] && "highlightedHtml" in article.blocks[0]
        ? article.blocks[0].highlightedHtml
        : null,
    ).toBeNull();
    expect(
      article?.blocks[1] && "highlightedHtml" in article.blocks[1]
        ? article.blocks[1].highlightedHtml
        : null,
    ).toContain('class="shiki');
  });

  it("normalizes Notion file covers for article detail pages", async () => {
    getPrimaryDataSourceIdMock.mockResolvedValue("data-source-1");
    queryMock.mockResolvedValue({
      results: [
        {
          id: "page-1",
          cover: { file: { url: "https://secure.notion-static.com/cover.png" } },
          properties: {
            Name: {
              type: "title",
              title: [{ plain_text: "Deep Dive" }],
            },
            Slug: {
              type: "rich_text",
              rich_text: [{ plain_text: "deep-dive" }],
            },
          },
        },
      ],
    });
    collectPaginatedAPIMock.mockResolvedValue([]);

    const { createNotionArticleDetailSource } = await import("@/integrations/notion/article-detail");
    const source = createNotionArticleDetailSource();
    const article = await source.getArticleBySlug({ slug: "deep-dive" });

    expect(article?.cover).toBe("https://secure.notion-static.com/cover.png");
  });
});
