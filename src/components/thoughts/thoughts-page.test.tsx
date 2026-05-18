import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const thoughtsState = vi.hoisted(() => ({
  listThoughts: vi.fn(),
}));

vi.mock("@/domains/thoughts/list-thoughts", () => ({
  listThoughts: thoughtsState.listThoughts,
}));

import { ThoughtsPage } from "./thoughts-page";

describe("ThoughtsPage", () => {
  beforeEach(() => {
    thoughtsState.listThoughts.mockReset();
  });

  it("renders thought cards from the runtime public-page model", async () => {
    thoughtsState.listThoughts.mockResolvedValue([
      {
        id: "6",
        date: new Date("2026-03-29T12:00:00.000Z"),
        link: "https://t.me/s/tech_bb/6",
        richText: [{ plainText: "reply child" }],
        photos: [],
        replyTo: "5",
        forwardedFrom: null,
        webpage: null,
        reactions: [],
      },
      {
        id: "5",
        date: new Date("2026-03-29T11:00:00.000Z"),
        link: "https://t.me/s/tech_bb/5",
        richText: [{ plainText: "photo parent" }],
        photos: [
          {
            id: 51,
            originalUrl: "https://cdn5.telesco.pe/file/original.jpg",
            thumbnailUrl: "https://cdn5.telesco.pe/file/thumb.jpg",
            width: 1280,
            height: 720,
          },
        ],
        replyTo: null,
        forwardedFrom: "Forward Source",
        webpage: {
          title: "Preview title",
          description: "Preview description",
          displayUrl: "example.com",
          url: "https://example.com/article",
          sitename: "Example",
          embedUrl: "https://example.com/embed",
          author: "Tempura",
          photo: null,
        },
        reactions: [{ emoticon: "🔥", count: 4 }],
      },
    ]);

    const markup = renderToStaticMarkup(await ThoughtsPage());

    expect(markup).toContain('href="https://t.me/s/tech_bb/5"');
    expect(markup).toContain("Forwarded from Forward Source");
    expect(markup).toContain("Preview title");
    expect(markup).toContain("cdn5.telesco.pe");
    expect(markup).toContain('href="#1_5"');
  });

  it("renders the explicit empty state when the snapshot is empty", async () => {
    thoughtsState.listThoughts.mockResolvedValue([]);

    const markup = renderToStaticMarkup(await ThoughtsPage());

    expect(markup).toContain("No thoughts published yet.");
  });
});
