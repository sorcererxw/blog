import type { ThoughtListItem } from "./types.ts";

export type ThoughtSnapshotItem = Omit<ThoughtListItem, "date"> & {
  date: string;
};

const newestFirst = (left: ThoughtListItem, right: ThoughtListItem) =>
  right.date.getTime() - left.date.getTime();

export const sortThoughtsNewestFirst = (
  items: ThoughtListItem[],
): ThoughtListItem[] => [...items].sort(newestFirst);

export const fromThoughtSnapshotItem = (
  item: ThoughtSnapshotItem,
): ThoughtListItem => ({
  ...item,
  date: new Date(item.date),
});

export const toThoughtSnapshotItem = (
  item: ThoughtListItem,
): ThoughtSnapshotItem => ({
  ...item,
  date: item.date.toISOString(),
});
