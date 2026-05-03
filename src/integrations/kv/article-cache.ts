import type { ArticleListItem } from "@/domains/article/types";

export type ArticleListCache = {
  getList: (key: string) => Promise<ArticleListItem[] | null>;
  setList: (key: string, value: ArticleListItem[]) => Promise<void>;
};

export const articleListCacheKey = (includeWip: boolean) =>
  includeWip ? "blog2:articles:list:wip" : "blog2:articles:list:published";

export const createNoopArticleListCache = (): ArticleListCache => ({
  async getList() {
    return null;
  },
  async setList() {
    return undefined;
  },
});

export const createMemoryArticleListCache = (): ArticleListCache => {
  const store = new Map<string, ArticleListItem[]>();
  return {
    async getList(key) {
      return store.get(key) ?? null;
    },
    async setList(key, value) {
      store.set(key, value);
    },
  };
};

export const articleListMemoryCache = createMemoryArticleListCache();
