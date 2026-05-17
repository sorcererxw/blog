import { afterEach, describe, expect, it, vi } from "vitest";

const collectPaginatedAPIMock = vi.fn();

vi.mock("@notionhq/client", () => ({
  Client: class {
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
    NOTION_INTRO_PAGE_ID: "intro-page-id",
    APP_ENV: "production",
  }),
  getRuntimeInfo: () => ({
    isProduction: true,
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("createNotionHomeSource", () => {
  it("loads the env-owned intro page and recursively normalizes blocks", async () => {
    collectPaginatedAPIMock.mockImplementation(async (_list, params: { block_id: string }) => {
      if (params.block_id === "intro-page-id") {
        return [
          {
            id: "heading-1",
            type: "heading_1",
            has_children: true,
            heading_1: {
              rich_text: [{ plain_text: "Intro heading" }],
            },
          },
        ];
      }

      if (params.block_id === "heading-1") {
        return [
          {
            id: "paragraph-1",
            type: "paragraph",
            has_children: false,
            paragraph: {
              rich_text: [{ plain_text: "Nested intro body" }],
            },
          },
        ];
      }

      return [];
    });

    const { createNotionHomeSource } = await import("@/integrations/notion/home");
    const source = createNotionHomeSource();
    const record = await source.loadHomePage();

    expect(record.id).toBe("intro-page-id");
    expect(collectPaginatedAPIMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ block_id: "intro-page-id" }),
    );
    expect(record.blocks).toMatchObject([
      {
        id: "heading-1",
        type: "heading_1",
        children: [
          {
            id: "paragraph-1",
            type: "paragraph",
          },
        ],
      },
    ]);
  });
});
