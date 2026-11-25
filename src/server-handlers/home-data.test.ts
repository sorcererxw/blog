import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadNotionHomePage: vi.fn(async () => ({
    blocks: [],
    id: "home",
  })),
}));

vi.mock("@/domains/article/list-articles", () => ({
  listArticles: vi.fn(async () => [
    {
      cover: null,
      date: new Date("2026-05-18T00:00:00.000Z"),
      icon: null,
      id: "article-1",
      slug: "tanstack-migration",
      summary: "Migrating to TanStack Start.",
      title: "TanStack Migration",
    },
  ]),
}));

vi.mock("@/domains/projects/list-projects", () => ({
  listProjects: vi.fn(async () => []),
}));

vi.mock("@/domains/social/x-sync", () => ({
  listStoredXSocialPosts: vi.fn(async () => []),
}));

vi.mock("@/domains/thoughts/list-thoughts", () => ({
  listThoughts: vi.fn(async () => []),
}));

vi.mock("@/integrations/kv/provider-wrappers", () => ({
  createPublicProviderCache: vi.fn(async () => ({
    get: vi.fn(async () => null),
    set: vi.fn(async () => undefined),
  })),
  withCachedArticleSource: vi.fn((source) => source),
  withCachedHomeSource: vi.fn((source) => source),
  withCachedProjectSource: vi.fn((source) => source),
  withCachedThoughtProvider: vi.fn((provider) => provider),
}));

vi.mock("@/integrations/notion/home", () => ({
  createNotionHomeSource: vi.fn((loadHomePage) => ({ loadHomePage })),
  getHomeDescription: vi.fn(() => "Home intro description"),
  loadNotionHomePage: mocks.loadNotionHomePage,
}));

import { loadHomePageData } from "./home-data";

describe("loadHomePageData", () => {
  it("loads homepage intro, serialized feed items, and SEO structured data", async () => {
    const result = await loadHomePageData();

    expect(mocks.loadNotionHomePage).toHaveBeenCalledTimes(1);
    expect(result.seo.description).toBe("Home intro description");
    expect(result.seo.title).toBe("sorcererxw");
    expect(result.feedItems).toHaveLength(1);
    expect(result.feedItems[0]?.title).toBe("TanStack Migration");
    expect(result.seo.structuredData.length).toBeGreaterThanOrEqual(3);
  });
});
