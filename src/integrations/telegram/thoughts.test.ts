import { describe, expect, it } from "vitest";

import { normalizeTelegramThoughtRecord } from "./thoughts";

describe("normalizeTelegramThoughtRecord", () => {
  it("converts ids and reply ids into the public string model", () => {
    const normalized = normalizeTelegramThoughtRecord({
      id: 202,
      date: new Date("2026-03-29T13:00:00.000Z"),
      link: "https://t.me/s/tech_bb/202",
      richText: [{ plainText: "runtime public thoughts" }],
      photos: [],
      replyTo: 201,
      forwardedFrom: null,
      webpage: null,
      reactions: [],
    });

    expect(normalized).toMatchObject({
      id: "202",
      replyTo: "201",
    });
  });
});
