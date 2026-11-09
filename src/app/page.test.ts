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
  OverviewFeed: ({ items, pagination }: { items: Array<{ id: string }>; pagination: { page: number } }) =>
    createElement("div", { "data-feed-page": pagination.page }, items.map((item) => createElement("article", { key: item.id }, item.id))),
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
    const metadata = await generateMetadata({});

    expect(metadata.description).toBe("Home intro description");
    expect(mocks.loadNotionHomePage).toHaveBeenCalledTimes(1);
    expect(listArticles).not.toHaveBeenCalled();
    expect(listProjects).not.toHaveBeenCalled();
    expect(listThoughts).not.toHaveBeenCalled();
    expect(listStoredXSocialPosts).not.toHaveBeenCalled();
  });
});


describe("homepage paged response", () => {
  it("keeps page metadata independent of feed data and gives page two its own canonical", async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ page: "2" }) });
    expect(metadata.alternates?.canonical).toBe("https://sorcererxw.com/?page=2");
    expect(listArticles).not.toHaveBeenCalled();
    expect(listThoughts).not.toHaveBeenCalled();
  });

  it("passes only the requested page into rendering and JSON-LD", async () => {
    vi.mocked(listArticles).mockResolvedValueOnce(Array.from({ length: 59 }, (_, index) => ({
      slug: `entry-${index}`, title: `Entry ${index}`, summary: `Summary ${index}`,
      date: new Date(2026, 0, 59 - index),
    })));
    const markup = renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({ page: "2" }) }));
    expect(markup.match(/<article>/g)).toHaveLength(24);
    expect(markup).toContain("article:entry-24");
    expect(markup).toContain("article:entry-47");
    expect(markup).not.toContain("entry-23");
    expect(markup).not.toContain("entry-48");
  });
});
