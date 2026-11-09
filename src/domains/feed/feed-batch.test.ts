import { describe, expect, it } from "vitest";
import { buildFeedContinuationHref, FEED_BATCH_SIZE, getFeedBatch, getFeedRequest } from "./feed-batch";
import type { FeedItem } from "./types";

const items: FeedItem[] = Array.from({ length: 59 }, (_, index) => ({
  id: String(index), type: index % 2 ? "writing" : "social",
  source: index % 2 ? "notion" : "telegram", title: `Item ${index}`, summary: "",
  displayedAt: null, sourcePublishedAt: null,
  destination: { kind: "internal", href: `/articles/${index}` }, media: [],
}));

describe("feed cursor batches", () => {
  it("traverses the complete ordered feed in bounded batches", () => {
    const seen: FeedItem[] = [];
    const sizes: number[] = [];
    let after: string | null = null;
    do {
      const batch = getFeedBatch(items, {}, after);
      expect(batch.invalidCursor).toBe(false);
      expect(batch.items.length).toBeLessThanOrEqual(FEED_BATCH_SIZE);
      sizes.push(batch.items.length);
      seen.push(...batch.items);
      after = batch.nextCursor;
    } while (after);
    expect(sizes).toEqual([24, 24, 11]);
    expect(seen).toEqual(items);
    expect(getFeedBatch(items, {}, items.at(-1)!.id)).toMatchObject({ items: [], nextCursor: null, invalidCursor: false });
  });
  it("filters before selecting a cursor batch", () => {
    const first = getFeedBatch(items, { source: "telegram", type: "social" });
    const next = getFeedBatch(items, { source: "telegram", type: "social" }, first.nextCursor);
    expect(first.items).toHaveLength(24);
    expect(next.items.map((item) => item.id)).toEqual(["48", "50", "52", "54", "56", "58"]);
    expect(next.nextCursor).toBeNull();
  });
  it("does not repeat delivered items when new content is inserted before the cursor", () => {
    const cursor = getFeedBatch(items, {}).nextCursor;
    const updated = [{ ...items[0], id: "new" }, ...items];
    expect(getFeedBatch(updated, {}, cursor).items).toEqual(items.slice(24, 48));
  });
  it("finishes exact, short and empty feeds without another request", () => {
    expect(getFeedBatch(items.slice(0, 24), {}).nextCursor).toBeNull();
    expect(getFeedBatch(items.slice(0, 3), {}).nextCursor).toBeNull();
    expect(getFeedBatch([], {})).toEqual({ items: [], nextCursor: null, invalidCursor: false });
    expect(getFeedBatch(items, { source: "missing" })).toEqual({ items: [], nextCursor: null, invalidCursor: false });
  });
  it("rejects removed or cross-filter cursors instead of restarting the feed", () => {
    expect(getFeedBatch(items, {}, "missing").invalidCursor).toBe(true);
    expect(getFeedBatch(items, { type: "writing" }, "0").invalidCursor).toBe(true);
  });
  it("normalizes filters and ignores the withdrawn numbered page parameter", () => {
    expect(getFeedRequest({ type: "writing", page: "7" })).toEqual({ filter: { type: "writing", source: null }, after: null, invalidCursor: false });
    expect(getFeedRequest({ type: "invalid", after: "" }).filter.type).toBeNull();
    expect(getFeedRequest({ after: ["a", "b"] }).invalidCursor).toBe(true);
  });
  it("encodes a shareable native continuation and clears it on filter reset", () => {
    const href = buildFeedContinuationHref({ type: "social", source: "telegram" }, "social:a&b?+");
    const url = new URL(href, "https://sorcererxw.com");
    expect(url.searchParams.get("after")).toBe("social:a&b?+");
    expect(url.searchParams.get("type")).toBe("social");
    expect(url.searchParams.get("source")).toBe("telegram");
    expect(buildFeedContinuationHref({ type: "writing" }, null)).toBe("/?type=writing");
    expect(buildFeedContinuationHref({}, null)).toBe("/");
  });
});
