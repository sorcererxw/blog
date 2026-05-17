import { describe, expect, it } from "vitest";

import {
  assignFeedLayout,
  estimateFeedModule,
  getFeedModuleSize,
  type FeedLayoutItem,
  type TextMeasurer,
} from "./feed-layout-engine";

const measure: TextMeasurer = ({ text, lineHeight }) => ({
  height: Math.max(lineHeight, Math.ceil(text.length / 10) * lineHeight),
  lineCount: Math.max(1, Math.ceil(text.length / 10)),
});

const item = (overrides: Partial<FeedLayoutItem> = {}): FeedLayoutItem => ({
  id: "item:1",
  media: [],
  presentationIntent: null,
  source: "notion",
  summary: "Short summary",
  title: "Title",
  type: "writing",
  ...overrides,
});

describe("feed layout engine", () => {
  it("keeps module size as presentation-owned state", () => {
    expect(getFeedModuleSize(item())).toBe("standard");
    expect(getFeedModuleSize(item({ presentationIntent: "feature" }))).toBe("feature");
    expect(getFeedModuleSize(item({ source: "telegram", type: "social" }))).toBe("compact");
    expect(
      getFeedModuleSize(
        item({
          media: [{ alt: "", height: 360, src: "https://example.com/photo.jpg", width: 640 }],
          source: "telegram",
          type: "social",
        }),
      ),
    ).toBe("standard");
  });

  it("estimates text, media, intent, and fixed chrome from one presentation layer", () => {
    const estimate = estimateFeedModule(
      item({
        media: [{ alt: "", height: 300, src: "https://example.com/photo.jpg", width: 600 }],
        summary: "A longer summary that wraps over several measured lines.",
      }),
      {
        columnWidth: 300,
        measureText: measure,
      },
    );

    expect(estimate.textHeight).toBeGreaterThan(0);
    expect(estimate.mediaHeight).toBe(150);
    expect(estimate.height).toBeGreaterThan(estimate.mediaHeight + estimate.textHeight);
  });

  it("assigns items to shortest columns while preserving item order within placement", () => {
    const layout = assignFeedLayout(
      [
        item({ id: "a", summary: "a".repeat(110) }),
        item({ id: "b", summary: "b".repeat(10) }),
        item({ id: "c", summary: "c".repeat(10) }),
      ],
      {
        columnCount: 2,
        containerWidth: 640,
        gap: 16,
        measureText: measure,
      },
    );

    expect(layout.columns).toHaveLength(2);
    expect(layout.columns.flatMap((column) => column.items.map((entry) => entry.item.id))).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(layout.columns[0].items.map((entry) => entry.item.id)).toEqual(["a"]);
    expect(layout.columns[1].items.map((entry) => entry.item.id)).toEqual(["b", "c"]);
  });

  it("recalculates estimates when container width changes", () => {
    const narrow = assignFeedLayout([item({ summary: "x".repeat(120) })], {
      columnCount: 1,
      containerWidth: 240,
      gap: 16,
      measureText: measure,
    });
    const wide = assignFeedLayout([item({ summary: "x".repeat(120) })], {
      columnCount: 1,
      containerWidth: 480,
      gap: 16,
      measureText: ({ text, lineHeight, maxWidth }) => ({
        height: Math.ceil(text.length / Math.max(1, Math.floor(maxWidth / 24))) * lineHeight,
        lineCount: Math.ceil(text.length / Math.max(1, Math.floor(maxWidth / 24))),
      }),
    });

    expect(wide.columns[0].height).toBeLessThan(narrow.columns[0].height);
  });
});
