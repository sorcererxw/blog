import { describe, expect, it } from "vitest";

import {
  parseTelegramWidgetRichText,
  scrapeTelegramPublicPageThoughtRecords,
} from "./public-page";

describe("parseTelegramWidgetRichText", () => {
  it("keeps rich text structure for links, bold text, hashtags, and quotes", () => {
    const segments = parseTelegramWidgetRichText(
      'hello <strong>world</strong><br><a href="https://example.com">link</a> <a href="/s/tech_bb?hashtag=ai">#ai</a><blockquote>quoted</blockquote>',
    );

    expect(segments).toEqual([
      { plainText: "hello " },
      { plainText: "world", bold: true },
      { plainText: "\n" },
      { plainText: "link", url: "https://example.com" },
      { plainText: " " },
      { plainText: "#ai", url: "/s/tech_bb?hashtag=ai", hashTag: true },
      { plainText: "quoted", quote: true },
    ]);
  });
});

describe("scrapeTelegramPublicPageThoughtRecords", () => {
  it("keeps scraped message rich text instead of flattening to one plainText segment", async () => {
    const html = `
      <div class="tgme_widget_message_wrap js-widget_message_wrap">
        <div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="tech_bb/123">
          <div class="tgme_widget_message_text js-message_text" dir="auto">
            before <strong>bold</strong><br>
            <a href="https://example.com">link</a>
          </div>
          <div class="tgme_widget_message_footer compact js-message_footer">
            <div class="tgme_widget_message_info short js-message_info">
              <span class="tgme_widget_message_meta">
                <a class="tgme_widget_message_date" href="https://t.me/tech_bb/123">
                  <time datetime="2026-04-06T10:00:00+00:00" class="time">10:00</time>
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;

    const records = await scrapeTelegramPublicPageThoughtRecords({
      html,
      channelUsername: "tech_bb",
    });

    expect(records).toHaveLength(1);
    expect(records[0]?.richText).toEqual([
      { plainText: "before " },
      { plainText: "bold", bold: true },
      { plainText: "\n" },
      { plainText: "link", url: "https://example.com" },
    ]);
  });
});
