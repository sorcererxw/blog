import { describe, expect, it } from "vitest";

import {
  parseTelegramWidgetRichText,
  scrapeTelegramPublicPageThoughtRecords,
} from "./public-page";

const page = ({
  before,
  body,
}: {
  before?: string | null;
  body: string;
}) => `
  <html>
    <body>
      <main class="tgme_channel_history">
        ${
          before
            ? `<div class="tgme_widget_message_centered js-messages_more_wrap">
                <a href="/s/tech_bb?before=${before}" class="tme_messages_more js-messages_more" data-before="${before}"></a>
              </div>`
            : ""
        }
        ${body}
      </main>
    </body>
  </html>
`;

const message = ({
  body,
  date = "2026-04-06T10:00:00+00:00",
  id,
}: {
  body: string;
  date?: string;
  id: number;
}) => `
  <div class="tgme_widget_message_wrap js-widget_message_wrap">
    <div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="tech_bb/${id}">
      <div class="tgme_widget_message_bubble">
        ${body}
        <div class="tgme_widget_message_footer compact js-message_footer">
          <a class="tgme_widget_message_date" href="https://t.me/tech_bb/${id}">
            <time datetime="${date}" class="time">10:00</time>
          </a>
        </div>
      </div>
    </div>
  </div>
`;

const response = (html: string) =>
  Promise.resolve(new Response(html, { status: 200 }));

describe("parseTelegramWidgetRichText", () => {
  it("keeps Telegram text formatting as rich text segments", () => {
    const segments = parseTelegramWidgetRichText(
      'hello <strong>bold</strong> <em>italic</em> <u>under</u> <s>gone</s> <code>x</code><br><a href="https://example.com">link</a> <a href="/s/tech_bb?hashtag=ai">#ai</a><blockquote>quoted</blockquote>',
    );

    expect(segments).toEqual([
      { plainText: "hello " },
      { plainText: "bold", bold: true },
      { plainText: " " },
      { plainText: "italic", italic: true },
      { plainText: " " },
      { plainText: "under", underline: true },
      { plainText: " " },
      { plainText: "gone", strike: true },
      { plainText: " " },
      { plainText: "x", monospace: true },
      { plainText: "\n" },
      { plainText: "link", url: "https://example.com" },
      { plainText: " " },
      { plainText: "#ai", url: "/s/tech_bb?hashtag=ai", hashTag: true },
      { plainText: "quoted", quote: true },
    ]);
  });
});

describe("scrapeTelegramPublicPageThoughtRecords", () => {
  it("parses rich text, reply, forwarded source, reactions, direct photos, and link preview images", async () => {
    const records = await scrapeTelegramPublicPageThoughtRecords({
      html: page({
        body: message({
          id: 123,
          body: `
            <a class="tgme_widget_message_reply" href="https://t.me/tech_bb/100">
              <div class="tgme_widget_message_text js-message_reply_text">older</div>
            </a>
            <div class="tgme_widget_message_forwarded_from">
              <a class="tgme_widget_message_forwarded_from_name" href="https://t.me/source"><span dir="auto">Source Channel</span></a>
            </div>
            <a class="tgme_widget_message_photo_wrap" href="https://t.me/tech_bb/123" style="width:800px;background-image:url('https://cdn5.telesco.pe/file/photo-1.jpg')">
              <i class="tgme_widget_message_photo" style="padding-top:50%"></i>
            </a>
            <a class="tgme_widget_message_photo_wrap" href="https://t.me/tech_bb/123" style="width:400px;height:300px;background-image:url('https://cdn4.telesco.pe/file/photo-2.jpg')"></a>
            <div class="tgme_widget_message_text js-message_text" dir="auto">
              before <strong>bold</strong><br>
              <a href="https://example.com">link</a>
            </div>
            <a class="tgme_widget_message_link_preview" href="https://example.com">
              <div class="link_preview_site_name">Example</div>
              <i class="link_preview_image" style="width:320px;background-image:url('https://cdn5.telesco.pe/file/preview.jpg');padding-top:50%"></i>
              <div class="link_preview_title" dir="auto">Preview title</div>
              <div class="link_preview_description" dir="auto">Preview description</div>
            </a>
            <div class="tgme_widget_message_reactions js-message_reactions">
              <span class="tgme_reaction"><i class="emoji"><b>👍</b></i>3</span>
            </div>
          `,
        }),
      }),
    });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      forwardedFrom: "Source Channel",
      id: 123,
      link: "https://t.me/s/tech_bb/123",
      replyTo: "100",
      reactions: [{ emoticon: "👍", count: 3 }],
    });
    expect(records[0]?.richText).toEqual([
      { plainText: "before " },
      { plainText: "bold", bold: true },
      { plainText: "\n" },
      { plainText: "link", url: "https://example.com" },
    ]);
    expect(records[0]?.photos).toEqual([
      {
        height: 400,
        id: 123000,
        originalUrl: "https://cdn5.telesco.pe/file/photo-1.jpg",
        thumbnailUrl: "https://cdn5.telesco.pe/file/photo-1.jpg",
        width: 800,
      },
      {
        height: 300,
        id: 123001,
        originalUrl: "https://cdn4.telesco.pe/file/photo-2.jpg",
        thumbnailUrl: "https://cdn4.telesco.pe/file/photo-2.jpg",
        width: 400,
      },
    ]);
    expect(records[0]?.webpage).toMatchObject({
      description: "Preview description",
      displayUrl: "Example",
      photo: {
        originalUrl: "https://cdn5.telesco.pe/file/preview.jpg",
      },
      title: "Preview title",
      url: "https://example.com",
    });
  });

  it("crawls public pagination, dedupes records, and returns newest first", async () => {
    const first = page({
      before: "20",
      body: [
        message({
          id: 30,
          date: "2026-04-06T12:00:00+00:00",
          body: `<div class="tgme_widget_message_text js-message_text">newest</div>`,
        }),
        message({
          id: 20,
          date: "2026-04-06T11:00:00+00:00",
          body: `<div class="tgme_widget_message_text js-message_text">middle</div>`,
        }),
      ].join(""),
    });
    const second = page({
      body: [
        message({
          id: 20,
          date: "2026-04-06T11:00:00+00:00",
          body: `<div class="tgme_widget_message_text js-message_text">middle duplicate</div>`,
        }),
        message({
          id: 10,
          date: "2026-04-06T10:00:00+00:00",
          body: `<div class="tgme_widget_message_text js-message_text">oldest</div>`,
        }),
      ].join(""),
    });
    const fetched: string[] = [];

    const records = await scrapeTelegramPublicPageThoughtRecords({
      fetchImpl: async (input) => {
        const url = String(input);
        fetched.push(url);
        return url.includes("before=20") ? response(second) : response(first);
      },
    });

    expect(fetched).toEqual([
      "https://t.me/s/tech_bb",
      "https://t.me/s/tech_bb?before=20",
    ]);
    expect(records.map((record) => record.id)).toEqual([30, 20, 10]);
  });

  it("stops when Telegram repeats a before token", async () => {
    const html = page({
      before: "20",
      body: message({
        id: 20,
        body: `<div class="tgme_widget_message_text js-message_text">repeat</div>`,
      }),
    });
    let calls = 0;

    const records = await scrapeTelegramPublicPageThoughtRecords({
      fetchImpl: async () => {
        calls += 1;
        return response(html);
      },
    });

    expect(calls).toBe(2);
    expect(records.map((record) => record.id)).toEqual([20]);
  });
});
