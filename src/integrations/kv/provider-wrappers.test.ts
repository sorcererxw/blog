import { describe, expect, it, vi } from "vitest";

import {
  createMemoryProviderCache,
} from "./provider-cache";
import {
  withCachedArticleDetailSource,
  withCachedArticleSource,
  withCachedHomeSource,
  withCachedProjectSource,
  withCachedThoughtProvider,
} from "./provider-wrappers";

describe("provider wrappers", () => {
  it("wraps the Notion article provider outside the provider implementation", async () => {
    const provider = {
      listArticles: vi.fn(async () => [
        {
          date: new Date("2026-05-18T00:00:00.000Z"),
          id: "article-1",
          slug: "cached",
          summary: "Cached summary",
          title: "Cached article",
        },
      ]),
    };
    const source = withCachedArticleSource(provider, createMemoryProviderCache());

    await source.listArticles();
    const cached = await source.listArticles();

    expect(provider.listArticles).toHaveBeenCalledTimes(1);
    expect(cached[0]?.date).toBeInstanceOf(Date);
    expect(cached[0]?.slug).toBe("cached");
  });

  it("keeps separate article cache keys for published and WIP lists", async () => {
    const provider = {
      listArticles: vi.fn(async ({ includeWip }: { includeWip?: boolean } = {}) => [
        {
          date: new Date("2026-05-18T00:00:00.000Z"),
          id: includeWip ? "wip" : "published",
          slug: includeWip ? "wip" : "published",
          summary: "",
          title: "",
          wip: includeWip,
        },
      ]),
    };
    const source = withCachedArticleSource(provider, createMemoryProviderCache());

    await source.listArticles();
    await source.listArticles({ includeWip: true });
    await source.listArticles();
    await source.listArticles({ includeWip: true });

    expect(provider.listArticles).toHaveBeenCalledTimes(2);
  });

  it("wraps home, project, article detail, and thoughts providers", async () => {
    const cache = createMemoryProviderCache();
    const homeProvider = {
      loadHomePage: vi.fn(async () => ({ blocks: [], id: "home" })),
    };
    const projectProvider = {
      listProjects: vi.fn(async () => [
        {
          description: "Project",
          emoji: null,
          id: "project-1",
          period: new Date("2026-05-18T00:00:00.000Z"),
          title: "Project",
          url: "https://example.com",
        },
      ]),
    };
    const detailProvider = {
      getArticleBySlug: vi.fn(async () => ({
        blocks: [],
        date: new Date("2026-05-18T00:00:00.000Z"),
        id: "article-1",
        slug: "article",
        summary: "Summary",
        title: "Article",
      })),
    };
    const thoughtsProvider = vi.fn(async () => [
      {
        date: new Date("2026-05-18T00:00:00.000Z"),
        forwardedFrom: null,
        id: "thought-1",
        link: "https://t.me/s/tech_bb/1",
        photos: [],
        reactions: [],
        replyTo: null,
        richText: [{ plainText: "Thought" }],
        webpage: null,
      },
    ]);

    const home = withCachedHomeSource(homeProvider, cache);
    const projects = withCachedProjectSource(projectProvider, cache);
    const detail = withCachedArticleDetailSource(detailProvider, cache);
    const thoughts = withCachedThoughtProvider(thoughtsProvider, cache);

    await home.loadHomePage();
    await home.loadHomePage();
    await projects.listProjects();
    await projects.listProjects();
    await detail.getArticleBySlug({ slug: "article" });
    await detail.getArticleBySlug({ slug: "article" });
    await thoughts();
    await thoughts();

    expect(homeProvider.loadHomePage).toHaveBeenCalledTimes(1);
    expect(projectProvider.listProjects).toHaveBeenCalledTimes(1);
    expect(detailProvider.getArticleBySlug).toHaveBeenCalledTimes(1);
    expect(thoughtsProvider).toHaveBeenCalledTimes(1);
  });
});
