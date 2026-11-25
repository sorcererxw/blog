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

  it("estimates single media using rendered 16:10 geometry and includes quote blocks", () => {
    const portraitPhoto = estimateFeedModule(
      item({
        media: [{ alt: "", height: 1920, src: "https://example.com/tall.jpg", width: 1080 }],
        summary: "A longer summary that wraps over several measured lines.",
      }),
      {
        columnWidth: 320,
        measureText: measure,
      },
    );

    expect(portraitPhoto.mediaHeight).toBe(200);
    expect(portraitPhoto.textHeight).toBeGreaterThan(0);
    expect(portraitPhoto.height).toBeGreaterThan(
      portraitPhoto.mediaHeight + portraitPhoto.textHeight,
    );

    const plainX = estimateFeedModule(
      item({
        source: "x",
        summary: "Short note",
        title: "",
        type: "social",
      }),
      {
        columnWidth: 320,
        measureText: measure,
      },
    );
    const quotedX = estimateFeedModule(
      item({
        quote: {
          authorName: "Hours",
          authorUsername: "hours",
          media: [{ alt: "", height: 900, src: "https://pbs.twimg.com/media/1.jpg", width: 1600 }],
          text: "Quoted post text with enough content to add noticeable vertical height.",
          url: "https://x.com/hours/status/1",
        },
        source: "x",
        summary: "Short note",
        title: "",
        type: "social",
      }),
      {
        columnWidth: 320,
        measureText: measure,
      },
    );

    expect(quotedX.height).toBeGreaterThan(plainX.height + 180);
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

  it("prefers exact DOM measuredHeights and LPT-balances trailing undated items", () => {
    const layout = assignFeedLayout(
      [
        item({ displayedAt: "2026-05-03T00:00:00.000Z", id: "dated-1" }),
        item({ displayedAt: "2026-05-02T00:00:00.000Z", id: "dated-2" }),
        item({ displayedAt: "1970-01-01T00:00:00.000Z", id: "undated-short" }),
        item({ displayedAt: null, id: "undated-tall" }),
        item({ displayedAt: "1970-01-01T00:00:00.000Z", id: "undated-medium" }),
      ],
      {
        columnCount: 2,
        containerWidth: 640,
        gap: 8,
        measuredHeights: {
          "dated-1": 500,
          "dated-2": 200,
          "undated-medium": 180,
          "undated-short": 120,
          "undated-tall": 300,
        },
      },
    );

    expect(layout.columns[0].items.map((entry) => entry.item.id)).toEqual([
      "dated-1",
      "undated-medium",
    ]);
    expect(layout.columns[1].items.map((entry) => entry.item.id)).toEqual([
      "dated-2",
      "undated-tall",
      "undated-short",
    ]);
    expect(Math.abs(layout.columns[0].height - layout.columns[1].height)).toBeLessThanOrEqual(80);
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
