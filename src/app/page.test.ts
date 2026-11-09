import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadNotionHomePage: vi.fn(async () => ({
    blocks: [],
    id: "home",
  })),
}));

vi.mock("@/components/feed/overview-feed-view", () => ({
  OverviewFeed: ({ items, nextCursor }: { items: Array<{ id: string }>; nextCursor: string | null }) =>
    createElement("div", { "data-next-cursor": nextCursor }, items.map((item) => createElement("article", { key: item.id }, item.id))),
}));

vi.mock("@/components/home/profile-hero", () => ({
  ProfileHero: () => null,
}));

vi.mock("@/domains/article/list-articles", () => ({
  listArticles: vi.fn(async () => []),
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

import { listArticles } from "@/domains/article/list-articles";
import { listProjects } from "@/domains/projects/list-projects";
import { listStoredXSocialPosts } from "@/domains/social/x-sync";
import { listThoughts } from "@/domains/thoughts/list-thoughts";

import HomePage, { generateMetadata } from "./page";

beforeEach(() => vi.clearAllMocks());

describe("homepage metadata", () => {
  it("does not load the provider-backed Overview Feed", async () => {
    const metadata = await generateMetadata();

    expect(metadata.description).toBe("Home intro description");
    expect(mocks.loadNotionHomePage).toHaveBeenCalledTimes(1);
    expect(listArticles).not.toHaveBeenCalled();
    expect(listProjects).not.toHaveBeenCalled();
    expect(listThoughts).not.toHaveBeenCalled();
    expect(listStoredXSocialPosts).not.toHaveBeenCalled();
  });
});


describe("homepage continuous feed response", () => {
  const seedArticles = () => vi.mocked(listArticles).mockResolvedValueOnce(Array.from({ length: 59 }, (_, index) => ({
    slug: `entry-${index}`, title: `Entry ${index}`, summary: `Summary ${index}`,
    date: new Date(2026, 0, 59 - index),
  })));

  it("keeps root metadata independent of feed data", async () => {
    const metadata = await generateMetadata();
    expect(metadata.alternates?.canonical).toBe("https://sorcererxw.com/");
    expect(listArticles).not.toHaveBeenCalled();
    expect(listThoughts).not.toHaveBeenCalled();
  });
  it("renders only the first batch and ignores withdrawn page numbers", async () => {
    seedArticles();
    const markup = renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({ page: "2" }) }));
    expect(markup.match(/<article>/g)).toHaveLength(24);
    expect(markup).toContain("article:entry-0");
    expect(markup).toContain("article:entry-23");
    expect(markup).not.toContain("entry-24");
    expect(markup).toContain('data-next-cursor="article:entry-23"');
  });
  it("provides a native SSR continuation without serializing other batches", async () => {
    seedArticles();
    const markup = renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({ after: "article:entry-23" }) }));
    expect(markup.match(/<article>/g)).toHaveLength(24);
    expect(markup).toContain("article:entry-24");
    expect(markup).toContain("article:entry-47");
    expect(markup).not.toContain("entry-23");
    expect(markup).not.toContain("entry-48");
    expect(markup).toContain('"url":"https://sorcererxw.com/"');
  });
  it("rejects an invalid native continuation with the route's 404 boundary", async () => {
    await expect(HomePage({ searchParams: Promise.resolve({ after: "missing" }) })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
});
