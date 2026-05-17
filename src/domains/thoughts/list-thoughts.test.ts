import { describe, expect, it } from "vitest";

import { buildThoughtList, listThoughts } from "@/domains/thoughts/list-thoughts";

describe("buildThoughtList", () => {
  it("normalizes Telegram records and sorts items newest first", () => {
    const result = buildThoughtList([
      {
        id: 1,
        date: new Date("2026-03-29T09:00:00.000Z"),
        link: "https://t.me/s/tech_bb/1",
        richText: [{ plainText: "older" }],
        photos: [],
        replyTo: null,
        forwardedFrom: null,
        webpage: null,
        reactions: [],
      },
      {
        id: 2,
        date: new Date("2026-03-29T12:00:00.000Z"),
        link: "https://t.me/s/tech_bb/2",
        richText: [{ plainText: "newest" }],
        photos: [],
        replyTo: 1,
        forwardedFrom: "tech_bb",
        webpage: null,
        reactions: [{ emoticon: "🔥", count: 3 }],
      },
    ]);

    expect(result.map((item) => item.id)).toEqual(["2", "1"]);
    expect(result[0]).toMatchObject({
      forwardedFrom: "tech_bb",
      replyTo: "1",
    });
  });
});

describe("listThoughts", () => {
  it("loads public Telegram records with the configured revalidation window", async () => {
    const calls: Array<{ init?: RequestInit; url: string }> = [];
    const result = await listThoughts({
      fetchImpl: async (input, init) => {
        calls.push({ init, url: String(input) });
        return new Response(
          `
            <div class="tgme_widget_message_wrap js-widget_message_wrap">
              <div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="tech_bb/2">
                <div class="tgme_widget_message_bubble">
                  <div class="tgme_widget_message_text js-message_text">runtime</div>
                  <a class="tgme_widget_message_date" href="https://t.me/tech_bb/2">
                    <time datetime="2026-03-29T12:00:00.000Z">12:00</time>
                  </a>
                </div>
              </div>
            </div>
          `,
          { status: 200 },
        );
      },
      revalidateSeconds: 123,
    });

    expect(result.map((item) => item.id)).toEqual(["2"]);
    expect(calls[0]?.url).toBe("https://t.me/s/tech_bb");
    expect((calls[0]?.init as RequestInit & { next?: { revalidate?: number } }).next?.revalidate).toBe(123);
  });
});
