import type { ProjectListItem } from "@/domains/projects/types";

export type ProjectListCache = {
  getList: (key: string) => Promise<ProjectListItem[] | null>;
  setList: (key: string, value: ProjectListItem[]) => Promise<void>;
};

export const projectListCacheKey = () => "blog2:projects:list:public";

export const createNoopProjectListCache = (): ProjectListCache => ({
  async getList() {
    return null;
  },
  async setList() {
    return undefined;
  },
});

export const createMemoryProjectListCache = (): ProjectListCache => {
  const store = new Map<string, ProjectListItem[]>();

  return {
    async getList(key) {
      return store.get(key) ?? null;
    },
    async setList(key, value) {
      store.set(key, value);
    },
  };
};
