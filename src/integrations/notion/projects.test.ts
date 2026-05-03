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

vi.mock("@/config/server", () => ({
  NotionSecret: "test-notion-secret",
}));

vi.mock("@/config/runtime", () => ({
  getRuntimeConfig: () => ({
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

describe("listProjectsFromNotion", () => {
  it("reads the Link property from notion url fields", async () => {
    getPrimaryDataSourceIdMock.mockResolvedValue("data-source-1");
    queryMock.mockResolvedValue({
      results: [
        {
          id: "project-1",
          url: "https://www.notion.so/project-1",
          icon: { type: "emoji", emoji: "🛰" },
          properties: {
            Name: {
              type: "title",
              title: [{ plain_text: "Project One" }],
            },
            Description: {
              type: "rich_text",
              rich_text: [{ plain_text: "A project with a proper external link." }],
            },
            Link: {
              type: "url",
              url: "https://example.com/project-one",
            },
            Period: {
              type: "date",
              date: { start: "2026-03-01" },
            },
          },
        },
      ],
    });

    const { listProjectsFromNotion } = await import("@/integrations/notion/projects");
    const records = await listProjectsFromNotion();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      title: "Project One",
      description: "A project with a proper external link.",
      url: "https://example.com/project-one",
      emoji: "🛰",
    });
  });

  it("falls back to the notion page url when Link is empty", async () => {
    getPrimaryDataSourceIdMock.mockResolvedValue("data-source-1");
    queryMock.mockResolvedValue({
      results: [
        {
          id: "project-2",
          url: "https://www.notion.so/project-2",
          icon: { type: "emoji", emoji: "🧭" },
          properties: {
            Name: {
              type: "title",
              title: [{ plain_text: "Project Two" }],
            },
            Description: {
              type: "rich_text",
              rich_text: [{ plain_text: "A project without a dedicated Link property." }],
            },
            Link: {
              type: "url",
              url: null,
            },
            Period: {
              type: "date",
              date: { start: "2026-02-01" },
            },
          },
        },
      ],
    });

    const { listProjectsFromNotion } = await import("@/integrations/notion/projects");
    const records = await listProjectsFromNotion();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      title: "Project Two",
      url: "https://www.notion.so/project-2",
    });
  });
});
