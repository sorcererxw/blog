import { describe, expect, it } from "vitest";

import {
  buildTelegramThoughtRecord,
  normalizeTelegramThoughtRecord,
} from "./thoughts";

const makeMessage = (overrides: Record<string, unknown> = {}) => ({
  id: 101,
  date: new Date("2026-03-29T12:30:00.000Z"),
  text: "Hello from mtcute",
  entities: [
    {
      kind: "bold",
      offset: 0,
      length: 5,
      params: { kind: "bold" },
      text: "Hello",
      is: () => false,
    },
  ],
  media: {
    type: "webpage",
    preview: {
      title: "Tempura blog migration",
      description: "A public note about the new blog2 surface.",
      displayUrl: "tempura.example",
      url: "https://example.com",
      siteName: "Example",
      embedUrl: "https://example.com/embed",
      author: "Tempura",
      photo: null,
    },
    displaySize: "large",
    manual: false,
    safe: true,
  },
  replyToMessage: {
    id: 100,
    origin: "same_chat",
    chat: null,
    media: null,
    sender: null,
    threadId: null,
    todoItemId: null,
    isScheduled: false,
    isForumTopic: false,
    isQuote: false,
    quoteText: "",
    quoteEntities: [],
    quoteOffset: null,
  },
  forward: {
    fromChat: () => ({
      type: "chat",
      title: "Tech BB",
      username: "tech_bb",
      displayName: "Tech BB",
      chatType: "channel",
      isGroup: false,
    }),
    signature: null,
    sender: null,
    date: new Date("2026-03-29T12:00:00.000Z"),
  },
  reactions: {
    reactions: [{ emoji: "🔥", count: 3, isPaid: false, order: null }],
  },
  ...overrides,
});

describe("buildTelegramThoughtRecord", () => {
  it("extracts a Telegram message into the public thought shape", () => {
    const record = buildTelegramThoughtRecord(makeMessage() as never);

    expect(record).toMatchObject({
      id: 101,
      link: "https://t.me/s/tech_bb/101",
      forwardedFrom: "tech_bb",
      replyTo: 100,
    });
    expect(record?.reactions).toEqual([{ emoticon: "🔥", count: 3 }]);
  });

  it("normalizes photo media into thought photos", () => {
    const record = buildTelegramThoughtRecord(
      makeMessage({
        id: 300,
        media: {
          type: "photo",
          photo: {
            id: 88,
            sizes: [
              {
                url: "https://img.example/thumb.jpg",
                width: 320,
                height: 180,
              },
              {
                url: "https://img.example/original.jpg",
                width: 1280,
                height: 720,
              },
            ],
          },
        },
      }) as never,
    );

    expect(record?.photos).toEqual([
      {
        id: 88,
        thumbnailUrl: "https://img.example/thumb.jpg",
        originalUrl: "https://img.example/original.jpg",
        width: 1280,
        height: 720,
      },
    ]);
  });

  it("extracts nested photo urls from media objects", () => {
    const record = buildTelegramThoughtRecord(
      makeMessage({
        id: 301,
        media: {
          type: "photo",
          photo: {
            id: 89,
            container: {
              preview: { url: "https://img.example/nested-thumb.jpg", width: 160, height: 90 },
              source: { url: "https://img.example/nested-original.jpg", width: 1920, height: 1080 },
            },
          },
        },
      }) as never,
    );

    expect(record?.photos).toEqual([
      {
        id: 89,
        thumbnailUrl: "https://img.example/nested-thumb.jpg",
        originalUrl: "https://img.example/nested-original.jpg",
        width: 1920,
        height: 1080,
      },
    ]);
  });
});

describe("normalizeTelegramThoughtRecord", () => {
  it("converts ids and reply ids into the public string model", () => {
    const normalized = normalizeTelegramThoughtRecord({
      id: 202,
      date: new Date("2026-03-29T13:00:00.000Z"),
      link: "https://t.me/s/tech_bb/202",
      richText: [{ plainText: "live direct thoughts" }],
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
