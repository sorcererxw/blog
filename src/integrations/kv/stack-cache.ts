import type { StackListItem } from "@/domains/stack/types";

export type StackListCache = {
  getList: (key: string) => Promise<StackListItem[] | null>;
  setList: (key: string, value: StackListItem[]) => Promise<void>;
};

export const stackListCacheKey = () => "blog2:stack:list:public";

export const createNoopStackListCache = (): StackListCache => ({
  async getList() {
    return null;
  },
  async setList() {
    return undefined;
  },
});

export const createMemoryStackListCache = (): StackListCache => {
  const store = new Map<string, StackListItem[]>();

  return {
    async getList(key) {
      return store.get(key) ?? null;
    },
    async setList(key, value) {
      store.set(key, value);
    },
  };
};
