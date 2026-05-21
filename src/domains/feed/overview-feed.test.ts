import { describe, expect, it } from "vitest";

import type { ArticleListItem } from "@/domains/article/types";
import type { ProjectListItem } from "@/domains/projects/types";
import type { XSocialPostDetail } from "@/domains/social/x-sync";
import type { ThoughtListItem } from "@/domains/thoughts/types";

import {
  applyFeedFilter,
  articleToFeedItem,
  buildOverviewFeedIndex,
  parseFeedFilter,
  projectToFeedItem,
  sortFeedItems,
  thoughtToFeedItem,
  xSocialPostToFeedItem,
} from "./overview-feed";
import type { FeedItem } from "./types";

const article = (overrides: Partial<ArticleListItem> = {}): ArticleListItem => ({
  slug: "article",
  title: "Article",
  summary: "Article summary",
  date: new Date("2026-05-01T00:00:00.000Z"),
  icon: { kind: "emoji", value: "✦" },
  ...overrides,
});

const project = (overrides: Partial<ProjectListItem> = {}): ProjectListItem => ({
  title: "Project",
  description: "Project summary",
  url: "https://example.com/project",
  emoji: "◇",
  ...overrides,
});

const thought = (overrides: Partial<ThoughtListItem> = {}): ThoughtListItem => ({
  id: "100",
  date: new Date("2026-04-01T00:00:00.000Z"),
  link: "https://t.me/s/example/100",
  richText: [{ plainText: "Telegram summary" }],
  photos: [],
  replyTo: null,
  forwardedFrom: null,
  webpage: null,
  reactions: [],
  ...overrides,
});

const xPost = (overrides: Partial<XSocialPostDetail> = {}): XSocialPostDetail => ({
  createdAt: new Date("2026-05-02T00:00:00.000Z"),
  id: "104",
  kind: "quote",
  media: [
    {
      alt: "Diagram",
      height: 720,
      src: "https://pbs.twimg.com/media/photo.jpg",
      width: 1280,
    },
  ],
  text: "X summary",
  url: "https://x.com/sorcererxw/status/104",
  ...overrides,
});

describe("overview feed", () => {
  it("normalizes articles, projects, and Telegram thoughts into one feed model", () => {
    const feed = buildOverviewFeedIndex({
      articles: [article()],
      projects: [project({ period: new Date("2026-03-01T00:00:00.000Z") })],
      thoughts: [thought()],
      xPosts: [xPost()],
    });

    expect(feed.map((item) => item.id)).toEqual([
      "social:x:104",
      "article:article",
      "social:telegram:100",
      "project:https://example.com/project",
    ]);
    expect(feed.map((item) => item.type)).toEqual(["social", "writing", "social", "projects"]);
    expect(feed.map((item) => item.source)).toEqual(["x", "notion", "telegram", "notion"]);
    expect(feed.map((item) => item.titleEmoji ?? null)).toEqual([null, "✦", null, "◇"]);
  });

  it("sorts by displayed time, then source published time, then untimed items at the bottom", () => {
    const untimed: FeedItem = {
      id: "untimed",
      type: "projects",
      source: "notion",
      title: "Untimed",
      summary: "",
      displayedAt: null,
      sourcePublishedAt: null,
      presentationIntent: null,
      destination: { kind: "none" },
      media: [],
    };
    const sourceTimed: FeedItem = {
      ...untimed,
      id: "source",
      title: "Source",
      sourcePublishedAt: new Date("2026-02-01T00:00:00.000Z"),
    };
    const displayed: FeedItem = {
      ...untimed,
      id: "displayed",
      title: "Displayed",
      displayedAt: new Date("2026-03-01T00:00:00.000Z"),
      sourcePublishedAt: new Date("2020-01-01T00:00:00.000Z"),
    };

    expect(sortFeedItems([untimed, sourceTimed, displayed]).map((item) => item.id)).toEqual([
      "displayed",
      "source",
      "untimed",
    ]);
  });

  it("keeps displayed time separate from source published time for articles", () => {
    const item = articleToFeedItem(
      article({
        cover: "https://example.com/article-cover.jpg",
        date: new Date("2026-01-01T00:00:00.000Z"),
        displayedAt: new Date("2026-05-01T00:00:00.000Z"),
      }),
    );

    expect(item.displayedAt?.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(item.sourcePublishedAt?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(item.media).toEqual([
      {
        alt: "",
        src: "https://example.com/article-cover.jpg",
      },
    ]);
    expect(item.titleEmoji).toBe("✦");
  });

  it("uses project external targets when present and keeps untimed projects at the bottom", () => {
    const linked = projectToFeedItem(project());
    const unlinked = projectToFeedItem(project({ title: "No link", url: "" }));

    expect(linked.destination).toEqual({
      kind: "external",
      href: "https://example.com/project",
    });
    expect(linked.titleEmoji).toBe("◇");
    expect(unlinked.destination).toEqual({ kind: "none" });
    expect(unlinked.displayedAt).toBeNull();
  });

  it("preserves only manual feature presentation intent from sources", () => {
    expect(articleToFeedItem(article()).presentationIntent).toBeNull();
    expect(projectToFeedItem(project()).presentationIntent).toBeNull();
    expect(thoughtToFeedItem(thought()).presentationIntent).toBeNull();
    expect(articleToFeedItem(article({ presentationIntent: "feature" })).presentationIntent).toBe(
      "feature",
    );
    expect(
      thoughtToFeedItem(
        thought({
          photos: [{ id: 1, originalUrl: "https://example.com/photo.jpg", width: 100, height: 100 }],
        }),
      ).presentationIntent,
    ).toBeNull();
  });

  it("preserves Telegram rich text for overview rendering", () => {
    const item = thoughtToFeedItem(
      thought({
        richText: [
          { plainText: "plain " },
          { bold: true, plainText: "bold" },
          { plainText: " linked", url: "https://example.com" },
        ],
      }),
    );

    expect(item.summary).toBe("plain bold linked");
    expect(item.summaryRichText).toEqual([
      { plainText: "plain " },
      { bold: true, plainText: "bold" },
      { plainText: " linked", url: "https://example.com" },
    ]);
  });

  it("normalizes stored X Social Posts into feed items", () => {
    const item = xSocialPostToFeedItem(xPost());

    expect(item).toMatchObject({
      displayedAt: new Date("2026-05-02T00:00:00.000Z"),
      id: "social:x:104",
      metaLabel: "X",
      source: "x",
      sourcePublishedAt: new Date("2026-05-02T00:00:00.000Z"),
      summary: "X summary",
      title: "X summary",
      type: "social",
    });
    expect(item.destination).toEqual({
      kind: "external",
      href: "https://x.com/sorcererxw/status/104",
    });
    expect(item.media).toEqual([
      {
        alt: "Diagram",
        height: 720,
        src: "https://pbs.twimg.com/media/photo.jpg",
        width: 1280,
      },
    ]);
  });

  it("keeps every Telegram direct and preview image for overview rendering", () => {
    const item = thoughtToFeedItem(
      thought({
        photos: [
          {
            height: 360,
            id: 1,
            originalUrl: "https://example.com/photo-1.jpg",
            thumbnailUrl: null,
            width: 640,
          },
          {
            height: 720,
            id: 2,
            originalUrl: "https://example.com/photo-2.jpg",
            thumbnailUrl: null,
            width: 960,
          },
        ],
        webpage: {
          description: "Preview description",
          photo: {
            height: 400,
            id: 3,
            originalUrl: "https://example.com/preview.jpg",
            thumbnailUrl: null,
            width: 800,
          },
          sitename: "Example",
          title: "Preview title",
          url: "https://example.com",
        },
      }),
    );

    expect(item.media.map((media) => media.src)).toEqual([
      "https://example.com/photo-1.jpg",
      "https://example.com/photo-2.jpg",
      "https://example.com/preview.jpg",
    ]);
  });

  it("parses and applies server-rendered filter queries", () => {
    const items = buildOverviewFeedIndex({
      articles: [article()],
      projects: [project({ period: new Date("2026-01-01T00:00:00.000Z") })],
      thoughts: [thought()],
      xPosts: [xPost()],
    });

    expect(parseFeedFilter(new URL("https://example.com/?type=projects"))).toEqual({
      source: null,
      type: "projects",
    });
    expect(parseFeedFilter(new URL("https://example.com/?source=telegram"))).toEqual({
      source: "telegram",
      type: null,
    });
    expect(parseFeedFilter(new URL("https://example.com/?source=x"))).toEqual({
      source: "x",
      type: null,
    });
    expect(applyFeedFilter(items, { type: "social" }).map((item) => item.type)).toEqual([
      "social",
      "social",
    ]);
    expect(applyFeedFilter(items, { source: "x" }).map((item) => item.source)).toEqual([
      "x",
    ]);
    expect(applyFeedFilter(items, { source: "telegram" }).map((item) => item.source)).toEqual([
      "telegram",
    ]);
  });
});
