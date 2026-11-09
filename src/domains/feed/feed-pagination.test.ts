import { describe, expect, it } from "vitest";
import { buildFeedPageHref, FEED_PAGE_SIZE, getFeedCanonicalPath, getFeedRequest, paginateFeed } from "./feed-pagination";
import type { FeedItem } from "./types";

const items: FeedItem[] = Array.from({ length: 59 }, (_, index) => ({
  id: String(index), type: index % 2 ? "writing" : "social",
  source: index % 2 ? "notion" : "telegram", title: `Item ${index}`, summary: "",
  displayedAt: null, sourcePublishedAt: null,
  destination: { kind: "internal", href: `/articles/${index}` }, media: [],
}));

describe("feed pagination", () => {
  it("bounds the response and preserves order across every page", () => {
    const pages = [1, 2, 3].map((page) => paginateFeed(items, {}, page));
    expect(FEED_PAGE_SIZE).toBe(24);
    expect(pages.map((page) => page.items.length)).toEqual([24, 24, 11]);
    expect(pages.flatMap((page) => page.items)).toEqual(items);
    expect(pages[0].pagination).toEqual({ page: 1, totalPages: 3, previousHref: null, nextHref: "/?page=2" });
    expect(pages[2].pagination).toEqual({ page: 3, totalPages: 3, previousHref: "/?page=2", nextHref: null });
    expect(paginateFeed(items, {}, 4).outOfRange).toBe(true);
  });
  it("filters the complete index before slicing and preserves filters in links", () => {
    const result = paginateFeed(items, { source: "telegram", type: "social" }, 2);
    expect(result.items.map((item) => item.id)).toEqual(["48", "50", "52", "54", "56", "58"]);
    expect(result.pagination.previousHref).toBe("/?type=social&source=telegram");
    expect(result.pagination.nextHref).toBeNull();
  });
  it("keeps an empty first page valid but rejects later pages", () => {
    expect(paginateFeed(items, { source: "missing" }, 1)).toMatchObject({ items: [], outOfRange: false, pagination: { totalPages: 1, nextHref: null, previousHref: null } });
    expect(paginateFeed(items, { source: "missing" }, 2).outOfRange).toBe(true);
  });
  it.each([undefined, "0", "-1", "1.5", "NaN", "Infinity", "9007199254740992", ["2", "3"]])("normalizes an invalid page value %s", (page) => {
    expect(getFeedRequest({ page }).page).toBe(1);
  });
  it("parses and constructs stable shareable URLs without unrelated query parameters", () => {
    expect(getFeedRequest({ page: "2", type: "writing", utm_source: "email" })).toEqual({ page: 2, filter: { type: "writing", source: null } });
    expect(getFeedRequest({ type: "invalid" }).filter.type).toBeNull();
    expect(buildFeedPageHref({}, 1)).toBe("/");
    expect(buildFeedPageHref({ source: "a&b" }, 2)).toBe("/?source=a%26b&page=2");
  });
  it("self-canonicalizes unfiltered pages and preserves the existing filter canonical", () => {
    expect(getFeedCanonicalPath({}, 1)).toBe("/");
    expect(getFeedCanonicalPath({}, 2)).toBe("/?page=2");
    expect(getFeedCanonicalPath({ source: "telegram" }, 2)).toBe("/");
  });
});
