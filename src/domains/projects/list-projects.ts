import {
  createNoopProjectListCache,
  projectListCacheKey,
  type ProjectListCache,
} from "@/integrations/kv/projects-cache";
import type {
  NotionProjectRecord,
  ProjectListItem,
} from "@/domains/projects/types";
import type { NotionProjectSource } from "@/integrations/notion/projects";

export type ListProjectsInput = {
  source: NotionProjectSource;
  cache?: ProjectListCache;
};

const newestFirst = (
  left: NotionProjectRecord,
  right: NotionProjectRecord,
) => right.period.getTime() - left.period.getTime();

export const normalizeProjectListItem = (
  record: NotionProjectRecord,
): ProjectListItem => ({
  title: record.title,
  description: record.description,
  url: record.url,
  emoji: record.emoji,
  period: record.period,
});

export const listProjects = async ({
  source,
  cache = createNoopProjectListCache(),
}: ListProjectsInput): Promise<ProjectListItem[]> => {
  const cacheKey = projectListCacheKey();
  const cached = await cache.getList(cacheKey);
  if (cached) {
    return [...cached];
  }

  const records = await source.listProjects();
  const normalized = records
    .slice()
    .sort(newestFirst)
    .map(normalizeProjectListItem);

  await cache.setList(cacheKey, normalized);

  return normalized;
};
