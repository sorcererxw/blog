import type { NotionArticleDetailRecord } from "@/domains/article/article-detail-types";
import type { NotionArticleRecord } from "@/domains/article/types";
import type { HomePageRecord, HomePageSource } from "@/integrations/notion/home";
import type { NotionArticleSource } from "@/integrations/notion/articles";
import type { NotionArticleDetailSource } from "@/integrations/notion/article-detail";
import type { NotionProjectRecord } from "@/domains/projects/types";
import type { NotionProjectSource } from "@/integrations/notion/projects";
import type { ThoughtListItem } from "@/domains/thoughts/types";
import { getWorkerEnv } from "@/lib/cloudflare-env";

import {
  createKvProviderCache,
  createNoopProviderCache,
  readThroughProviderCache,
  type ProviderCache,
} from "./provider-cache";

export const PUBLIC_PROVIDER_CACHE_TTL_SECONDS = 600;

const key = {
  articleDetail: (slug: string, includeWip: boolean) =>
    includeWip
      ? `blog2:provider:notion:article-detail:wip:${slug}:v1`
      : `blog2:provider:notion:article-detail:published:${slug}:v1`,
  articles: (includeWip: boolean) =>
    includeWip
      ? "blog2:provider:notion:articles:wip:v1"
      : "blog2:provider:notion:articles:published:v1",
  home: "blog2:provider:notion:home:v1",
  projects: "blog2:provider:notion:projects:public:v1",
  thoughts: ({
    channelUsername,
    maxPages,
    revalidateSeconds,
  }: {
    channelUsername?: string;
    maxPages?: number;
    revalidateSeconds?: number;
  }) =>
    [
      "blog2:provider:telegram:thoughts:v1",
      channelUsername ?? "tech_bb",
      maxPages ?? "all",
      revalidateSeconds ?? PUBLIC_PROVIDER_CACHE_TTL_SECONDS,
    ].join(":"),
};

export async function createPublicProviderCache(): Promise<ProviderCache> {
  const env = await getWorkerEnv();

  return env.BLOG_CACHE
    ? createKvProviderCache(env.BLOG_CACHE, PUBLIC_PROVIDER_CACHE_TTL_SECONDS)
    : createNoopProviderCache();
}

export function withCachedHomeSource(
  source: HomePageSource,
  cache: ProviderCache,
): HomePageSource {
  return {
    loadHomePage: () =>
      readThroughProviderCache<HomePageRecord>(
        cache,
        key.home,
        source.loadHomePage,
      ),
  };
}

export function withCachedArticleSource(
  source: NotionArticleSource,
  cache: ProviderCache,
): NotionArticleSource {
  return {
    listArticles: (options = {}) =>
      readThroughProviderCache<NotionArticleRecord[]>(
        cache,
        key.articles(options.includeWip === true),
        () => source.listArticles(options),
      ),
  };
}

export function withCachedProjectSource(
  source: NotionProjectSource,
  cache: ProviderCache,
): NotionProjectSource {
  return {
    listProjects: () =>
      readThroughProviderCache<NotionProjectRecord[]>(
        cache,
        key.projects,
        source.listProjects,
      ),
  };
}

export function withCachedArticleDetailSource(
  source: NotionArticleDetailSource,
  cache: ProviderCache,
): NotionArticleDetailSource {
  return {
    async getArticleBySlug(options) {
      const cached = await cache.get<NotionArticleDetailRecord>(
        key.articleDetail(options.slug, options.includeWip === true),
      );

      if (cached) {
        return cached;
      }

      const value = await source.getArticleBySlug(options);

      if (value) {
        await cache.set(key.articleDetail(options.slug, options.includeWip === true), value);
      }

      return value;
    },
  };
}

export type ThoughtProviderOptions = {
  channelUsername?: string;
  fetchImpl?: typeof fetch;
  maxPages?: number;
  revalidateSeconds?: number;
};

export function withCachedThoughtProvider(
  provider: (options?: ThoughtProviderOptions) => Promise<ThoughtListItem[]>,
  cache: ProviderCache,
) {
  return (options: ThoughtProviderOptions = {}) =>
    readThroughProviderCache<ThoughtListItem[]>(
      cache,
      key.thoughts(options),
      () => provider(options),
    );
}
