import {
  createNoopStackListCache,
  stackListCacheKey,
  type StackListCache,
} from "@/integrations/kv/stack-cache";
import type { NotionStackRecord, StackListItem } from "@/domains/stack/types";
import type { NotionStackSource } from "@/integrations/notion/stack";

export type ListStackInput = {
  source: NotionStackSource;
  cache?: StackListCache;
};

const byName = (left: NotionStackRecord, right: NotionStackRecord) =>
  left.name.localeCompare(right.name);

export const normalizeStackListItem = (
  record: NotionStackRecord,
): StackListItem => ({
  name: record.name,
  link: record.link,
  description: record.description,
  platforms: record.platforms,
  tags: record.tags,
  icon: record.icon ?? null,
});

export const listStack = async ({
  source,
  cache = createNoopStackListCache(),
}: ListStackInput): Promise<StackListItem[]> => {
  const cacheKey = stackListCacheKey();
  const cached = await cache.getList(cacheKey);

  if (cached) {
    return [...cached].sort((left, right) => left.name.localeCompare(right.name));
  }

  const records = await source.listStack();
  const normalized = records
    .slice()
    .sort(byName)
    .map(normalizeStackListItem);

  await cache.setList(cacheKey, normalized);

  return normalized;
};
