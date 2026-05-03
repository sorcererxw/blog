import { articleListCacheKey, createNoopArticleListCache, type ArticleListCache } from "@/integrations/kv/article-cache";
import type { NotionArticleRecord } from "@/domains/article/types";
import type { NotionArticleSource } from "@/integrations/notion/articles";
import type { ArticleListItem } from "@/domains/article/types";

export type ListArticlesInput = {
  source: NotionArticleSource;
  cache?: ArticleListCache;
  includeWip?: boolean;
};

export const normalizeArticleListItem = (
  record: NotionArticleRecord,
): ArticleListItem => ({
  slug: record.slug,
  title: record.title,
  summary: record.summary,
  date: record.date,
  cover: record.cover ?? null,
  icon: record.icon ?? null,
});

export const listArticles = async ({
  source,
  cache = createNoopArticleListCache(),
  includeWip = false,
}: ListArticlesInput): Promise<ArticleListItem[]> => {
  const cacheKey = articleListCacheKey(includeWip);
  const cached = await cache.getList(cacheKey);
  if (cached) {
    return [...cached].sort((left, right) => right.date.getTime() - left.date.getTime());
  }

  const records = await source.listArticles({ includeWip });
  const normalized = records
    .filter((record) => includeWip || !record.wip)
    .map(normalizeArticleListItem)
    .sort((left, right) => right.date.getTime() - left.date.getTime());

  await cache.setList(cacheKey, normalized);

  return normalized;
};

