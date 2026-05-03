import thoughtsSnapshot from "./thoughts.snapshot.json";
import type { ThoughtListItem } from "./types";
import {
  fromThoughtSnapshotItem,
  sortThoughtsNewestFirst,
  type ThoughtSnapshotItem,
} from "./snapshot";

export const listThoughts = (
  snapshot: ThoughtSnapshotItem[] = thoughtsSnapshot as ThoughtSnapshotItem[],
): ThoughtListItem[] =>
  sortThoughtsNewestFirst(snapshot.map(fromThoughtSnapshotItem));
