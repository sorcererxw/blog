import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadNotionHomePage: vi.fn(async () => ({
    blocks: [],
    id: "home",
  })),
}));

vi.mock("@/components/feed/overview-feed-view", () => ({
  OverviewFeed: () => null,
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

import { generateMetadata } from "./page";

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
