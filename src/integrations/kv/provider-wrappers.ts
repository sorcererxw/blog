import type { NotionArticleDetailRecord } from "@/domains/article/article-detail-types";
import type { NotionArticleRecord } from "@/domains/article/types";
import type { HomePageRecord, HomePageSource } from "@/integrations/notion/home";
import type { NotionArticleSource } from "@/integrations/notion/articles";
import type { NotionArticleDetailSource } from "@/integrations/notion/article-detail";
import type { NotionProjectRecord } from "@/domains/projects/types";
import type { NotionProjectSource } from "@/integrations/notion/projects";
import { sortThoughtsNewestFirst } from "@/domains/thoughts/snapshot";
import type { ThoughtListItem } from "@/domains/thoughts/types";
import { getWorkerEnv, waitUntilInWorker } from "@/lib/cloudflare-env";

import {
  createKvProviderCache,
  createNoopProviderCache,
  readThroughProviderCache,
  type ProviderCache,
} from "./provider-cache";

export const PUBLIC_PROVIDER_CACHE_TTL_SECONDS = 600;
export const PUBLIC_PROVIDER_CACHE_STALE_TTL_SECONDS = 60 * 60 * 24 * 7;
export const PUBLIC_PROVIDER_KV_EDGE_CACHE_TTL_SECONDS = 300;
const THOUGHTS_FULL_RECONCILE_INTERVAL_MS = 24 * 60 * 60 * 1000;

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

const swrOptions = {
  freshTtlSeconds: PUBLIC_PROVIDER_CACHE_TTL_SECONDS,
  kvEdgeCacheTtlSeconds: PUBLIC_PROVIDER_KV_EDGE_CACHE_TTL_SECONDS,
  scheduleBackground: waitUntilInWorker,
  staleTtlSeconds: PUBLIC_PROVIDER_CACHE_STALE_TTL_SECONDS,
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
        swrOptions,
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
        swrOptions,
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
        swrOptions,
      ),
  };
}

export function withCachedArticleDetailSource(
  source: NotionArticleDetailSource,
  cache: ProviderCache,
): NotionArticleDetailSource {
  return {
    getArticleBySlug: (options) =>
      readThroughProviderCache<NotionArticleDetailRecord | null>(
        cache,
        key.articleDetail(options.slug, options.includeWip === true),
        () => source.getArticleBySlug(options),
        {
          ...swrOptions,
          shouldCache: (value) => value !== null,
        },
      ),
  };
}

export type ThoughtProviderOptions = {
  channelUsername?: string;
  fetchImpl?: typeof fetch;
  knownIds?: ReadonlySet<string>;
  maxPages?: number;
  revalidateSeconds?: number;
};

const mergeThoughtLists = (
  staleThoughts: ThoughtListItem[],
  freshThoughts: ThoughtListItem[],
): ThoughtListItem[] => {
  const byId = new Map<string, ThoughtListItem>();

  for (const item of staleThoughts) {
    byId.set(item.id, item);
  }

  for (const item of freshThoughts) {
    byId.set(item.id, item);
  }

  return sortThoughtsNewestFirst(Array.from(byId.values()));
};

export function withCachedThoughtProvider(
  provider: (options?: ThoughtProviderOptions) => Promise<ThoughtListItem[]>,
  cache: ProviderCache,
  {
    now = () => Date.now(),
    scheduleBackground = waitUntilInWorker,
  }: {
    now?: () => number;
    scheduleBackground?: (promise: Promise<unknown>) => void;
  } = {},
) {
  return (options: ThoughtProviderOptions = {}) =>
    readThroughProviderCache<ThoughtListItem[]>(
      cache,
      key.thoughts(options),
      () => provider(options),
      {
        ...swrOptions,
        now,
        scheduleBackground,
        async refreshLoad(staleThoughts, meta) {
          const currentTime = now();
          const needsFullReconcile =
            staleThoughts.length === 0 ||
            !meta.fullReconcileAt ||
            currentTime - meta.fullReconcileAt >= THOUGHTS_FULL_RECONCILE_INTERVAL_MS;

          if (needsFullReconcile) {
            return {
              fullReconcileAt: currentTime,
              value: await provider(options),
            };
          }

          const knownIds = new Set(staleThoughts.map((item) => item.id));
          const incremental = await provider({
            ...options,
            knownIds,
          });

          return {
            fullReconcileAt: meta.fullReconcileAt,
            value: mergeThoughtLists(staleThoughts, incremental),
          };
        },
      },
    );
}
