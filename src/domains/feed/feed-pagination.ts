import { applyFeedFilter, parseFeedFilter } from "./overview-feed";
import type { FeedFilter, FeedItem } from "./types";

export const FEED_PAGE_SIZE = 24;
export type FeedSearchParams = Record<string, string | string[] | undefined>;
export type FeedPagination = {
  page: number;
  totalPages: number;
  previousHref: string | null;
  nextHref: string | null;
};

export function getFeedRequest(params: FeedSearchParams = {}) {
  const url = new URL("https://sorcererxw.com/");
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") url.searchParams.set(key, value);
  }
  const rawPage = url.searchParams.get("page") ?? "1";
  const candidate = /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;
  return {
    filter: parseFeedFilter(url),
    page: Number.isSafeInteger(candidate) ? candidate : 1,
  };
}

export function buildFeedPageHref(filter: FeedFilter, page: number) {
  const params = new URLSearchParams();
  if (filter.type) params.set("type", filter.type);
  if (filter.source) params.set("source", filter.source);
  if (page > 1) params.set("page", String(page));
  return params.size ? `/?${params.toString()}` : "/";
}

export function getFeedCanonicalPath(filter: FeedFilter, page: number) {
  return filter.type || filter.source ? "/" : buildFeedPageHref({}, page);
}

export function paginateFeed(items: FeedItem[], filter: FeedFilter, page: number) {
  const matchingItems = applyFeedFilter(items, filter);
  const totalPages = Math.max(1, Math.ceil(matchingItems.length / FEED_PAGE_SIZE));
  const start = (page - 1) * FEED_PAGE_SIZE;
  return {
    items: matchingItems.slice(start, start + FEED_PAGE_SIZE),
    outOfRange: page > totalPages,
    pagination: {
      page,
      totalPages,
      previousHref: page > 1 ? buildFeedPageHref(filter, page - 1) : null,
      nextHref: page < totalPages ? buildFeedPageHref(filter, page + 1) : null,
    } satisfies FeedPagination,
  };
}
