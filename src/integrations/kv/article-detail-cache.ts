import type { ArticleDetail } from "@/domains/article/article-detail-types";

export type ArticleDetailCache = {
  getDetail: (key: string) => Promise<ArticleDetail | null>;
  setDetail: (key: string, value: ArticleDetail) => Promise<void>;
};

export const articleDetailCacheKey = (slug: string, includeWip: boolean) =>
  includeWip
    ? `blog2:articles:detail:wip:${slug}`
    : `blog2:articles:detail:published:${slug}`;

export const createNoopArticleDetailCache = (): ArticleDetailCache => ({
  async getDetail() {
    return null;
  },
  async setDetail() {
    return undefined;
  },
});

export const createMemoryArticleDetailCache = (): ArticleDetailCache => {
  const store = new Map<string, ArticleDetail>();

  return {
    async getDetail(key) {
      return store.get(key) ?? null;
    },
    async setDetail(key, value) {
      store.set(key, value);
    },
  };
};

export const articleDetailMemoryCache = createMemoryArticleDetailCache();
