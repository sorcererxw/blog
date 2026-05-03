import type {
  ArticleDetail,
  NotionArticleDetailRecord,
} from "@/domains/article/article-detail-types";
import type {
  ArticleDetailCache,
} from "@/integrations/kv/article-detail-cache";
import {
  articleDetailCacheKey,
  createNoopArticleDetailCache,
} from "@/integrations/kv/article-detail-cache";
import type { NotionArticleDetailSource } from "@/integrations/notion/article-detail";

export type GetArticleBySlugInput = {
  source: NotionArticleDetailSource;
  cache?: ArticleDetailCache;
  slug: string;
  includeWip?: boolean;
};

export const normalizeArticleDetail = (
  record: NotionArticleDetailRecord,
): ArticleDetail => ({
  id: record.id,
  slug: record.slug,
  title: record.title,
  summary: record.summary,
  date: record.date,
  cover: record.cover ?? null,
  icon: record.icon ?? null,
  blocks: [...record.blocks],
});

export const getArticleBySlug = async ({
  source,
  cache = createNoopArticleDetailCache(),
  slug,
  includeWip = false,
}: GetArticleBySlugInput): Promise<ArticleDetail | null> => {
  const cacheKey = articleDetailCacheKey(slug, includeWip);
  const cached = await cache.getDetail(cacheKey);

  if (cached) {
    return cached;
  }

  const record = await source.getArticleBySlug({ slug, includeWip });

  if (!record || (!includeWip && record.wip)) {
    return null;
  }

  const normalized = normalizeArticleDetail(record);
  await cache.setDetail(cacheKey, normalized);

  return normalized;
};
