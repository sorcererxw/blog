import { applyFeedFilter, parseFeedFilter } from "./overview-feed";
import type { FeedFilter, FeedItem } from "./types";

export const FEED_BATCH_SIZE = 24;
export type FeedSearchParams = Record<string, string | string[] | undefined>;

export function getFeedRequest(params: FeedSearchParams = {}) {
  const url = new URL("https://sorcererxw.com/");
  for (const key of ["type", "source"] as const) {
    const value = params[key];
    if (typeof value === "string") url.searchParams.set(key, value);
  }
  return {
    filter: parseFeedFilter(url),
    after: typeof params.after === "string" ? params.after || null : null,
    invalidCursor: Array.isArray(params.after),
  };
}

export function buildFeedContinuationHref(filter: FeedFilter, after: string | null) {
  const params = new URLSearchParams();
  if (filter.type) params.set("type", filter.type);
  if (filter.source) params.set("source", filter.source);
  if (after) params.set("after", after);
  return params.size ? `/?${params.toString()}` : "/";
}

export function getFeedBatch(items: FeedItem[], filter: FeedFilter, after: string | null = null) {
  const matching = applyFeedFilter(items, filter);
  const cursorIndex = after === null ? -1 : matching.findIndex((item) => item.id === after);
  if (after !== null && cursorIndex === -1) {
    return { items: [], nextCursor: null, invalidCursor: true };
  }
  const start = cursorIndex + 1;
  const batch = matching.slice(start, start + FEED_BATCH_SIZE);
  return {
    items: batch,
    nextCursor: start + batch.length < matching.length ? batch.at(-1)!.id : null,
    invalidCursor: false,
  };
}
