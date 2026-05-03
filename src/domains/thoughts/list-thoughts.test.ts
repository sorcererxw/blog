import { describe, expect, it } from "vitest";

import { listThoughts } from "@/domains/thoughts/list-thoughts";

describe("listThoughts", () => {
  it("rehydrates serialized dates and sorts snapshot items newest first", () => {
    const result = listThoughts([
      {
        id: "1",
        date: "2026-03-29T09:00:00.000Z",
        link: "https://t.me/s/tech_bb/1",
        richText: [{ plainText: "older" }],
        photos: [],
        replyTo: null,
        forwardedFrom: null,
        webpage: null,
        reactions: [],
      },
      {
        id: "2",
        date: "2026-03-29T12:00:00.000Z",
        link: "https://t.me/s/tech_bb/2",
        richText: [{ plainText: "newest" }],
        photos: [],
        replyTo: "1",
        forwardedFrom: "tech_bb",
        webpage: null,
        reactions: [{ emoticon: "🔥", count: 3 }],
      },
    ]);

    expect(result.map((item) => item.id)).toEqual(["2", "1"]);
    expect(result[0]?.date).toBeInstanceOf(Date);
  });

  it("returns an explicit empty list for an empty snapshot", () => {
    expect(listThoughts([])).toEqual([]);
  });
});
