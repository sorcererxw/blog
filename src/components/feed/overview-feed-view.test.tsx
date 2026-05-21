import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { serializeOverviewFeedItems } from "@/domains/feed/overview-feed-serialization";
import { OverviewFeed } from "./overview-feed-view";
import type { FeedItem } from "@/domains/feed/types";

const item = (overrides: Partial<FeedItem> = {}): FeedItem => ({
  id: "article:one",
  type: "writing",
  source: "notion",
  title: "A feed item",
  summary: "Feed item summary",
  displayedAt: new Date("2026-05-01T00:00:00.000Z"),
  sourcePublishedAt: new Date("2026-04-01T00:00:00.000Z"),
  presentationIntent: null,
  destination: { kind: "internal", href: "/articles/one" },
  media: [],
  metaLabel: "Writing",
  ...overrides,
});

describe("OverviewFeed", () => {
  it("renders unified feed modules and server-rendered filter links", () => {
    const markup = renderToStaticMarkup(
      <OverviewFeed
        initialFilter={{ type: "writing" }}
        items={serializeOverviewFeedItems([
          item({
            titleEmoji: "✦",
            media: [
              {
                alt: "A feed item",
                src: "https://example.com/article-cover.jpg",
              },
            ],
          }),
          item({
            id: "social:telegram:1",
            type: "social",
            source: "telegram",
            title: "Hidden Telegram title",
            destination: { kind: "external", href: "https://t.me/s/example/1" },
            metaLabel: "Telegram",
          }),
          item({
            id: "social:x:1",
            type: "social",
            source: "x",
            title: "X post",
            destination: { kind: "external", href: "https://x.com/sorcererxw/status/1" },
            metaLabel: "X",
          }),
        ])}
      />,
    );

    expect(markup).toContain('id="overview"');
    expect(markup).toContain('aria-label="Overview feed"');
    expect(markup).toContain('aria-label="Overview feed filters"');
    expect(markup).not.toContain('id="overview-title"');
    expect(markup).not.toContain("Field notes");
    expect(markup).not.toContain("1 entry");
    expect(markup).not.toContain("Writing, projects, and public notes in one stream.");
    expect(markup).toContain('href="/?type=writing"');
    expect(markup).not.toContain('href="/?type=social"');
    expect(markup).not.toContain(">Social<");
    expect(markup).toContain('href="/?source=telegram"');
    expect(markup).toContain('href="/?source=x"');
    expect(markup).toContain('data-slot="tabs"');
    expect(markup).toContain('data-slot="tabs-list"');
    expect(markup).toContain('data-slot="tabs-tab"');
    expect(markup).toContain('data-selected="true"');
    expect(markup).toContain('data-slot="card"');
    expect(markup).toContain('role="link"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain("cursor-pointer");
    expect(markup).toContain("border-separator");
    expect(markup).toContain("px-0");
    expect(markup).toContain("grid gap-3 p-5");
    expect(markup).not.toContain("gap-2 p-4");
    expect(markup).not.toContain("p-6");
    expect(markup).toContain(
      '<p class="m-0 whitespace-pre-wrap break-words text-base leading-relaxed text-foreground">Feed item summary</p>',
    );
    expect(markup).toContain(
      '<time class="mt-1 inline-flex items-center text-xs uppercase text-foreground"',
    );
    expect(markup).toContain("chip");
    expect(markup).toContain("Writing");
    expect(markup).not.toContain("base-ui-");
    expect(markup).toContain('class="justify-self-start"');
    expect(markup).not.toContain("px-" + "[1.15rem]");
    expect(markup).not.toContain("badge--soft");
    expect(markup).toContain('href="/articles/one"');
    expect(markup).toContain("https%3A%2F%2Fexample.com%2Farticle-cover.jpg");
    expect(markup).toContain('loading="eager"');
    expect(markup).toContain('fetchPriority="high"');
    expect(markup).not.toContain('href="https://t.me/s/example/1"');
    expect(markup).toContain('data-size="standard"');
    expect(markup).not.toContain('data-size="compact"');
    expect(markup).toContain('data-feed-layout="fallback-single-column"');
    expect(markup).toContain('data-overview-feed-reveal="pending"');
    expect(markup).toContain("opacity-0");
    expect(markup).toContain('[data-overview-feed-reveal="pending"]{opacity:1!important}');
    expect(markup).toMatch(/class="[^"]*_cell_[^"]*"/);
    expect(markup).toContain('data-feed-transition="active"');
    expect(markup).not.toContain("content-visibility");
    expect(markup).not.toContain("data-masonry-estimate");
    expect(markup).not.toContain("data-masonry-columns");
    expect(markup).not.toContain("Hidden Telegram title");
    expect(markup).toMatch(/✦[\s\S]*A feed item/);
    expect(markup.indexOf("Feed item summary")).toBeLessThan(markup.indexOf("May 1, 2026"));
  });

  it("renders Notion project emoji before the overview title", () => {
    const markup = renderToStaticMarkup(
      <OverviewFeed
        initialFilter={{ type: "projects" }}
        items={serializeOverviewFeedItems([
          item({
            destination: { kind: "external", href: "https://example.com/project" },
            id: "project:one",
            metaLabel: "Project",
            title: "Project One",
            titleEmoji: "◇",
            type: "projects",
          }),
        ])}
      />,
    );

    expect(markup).toMatch(/◇[\s\S]*Project One/);
    expect(markup).toContain('class="justify-self-start"');
    expect(markup).not.toContain("-ml-" + "[1.15rem]");
    expect(markup).not.toMatch(/Project\s*◇/);
    expect(markup).toContain('href="https://example.com/project"');
  });

  it("limits eager media on the unfiltered homepage", () => {
    const markup = renderToStaticMarkup(
      <OverviewFeed
        initialFilter={{}}
        items={serializeOverviewFeedItems([
          item({
            id: "article:one",
            media: [{ alt: "First", src: "https://example.com/first.jpg" }],
          }),
          item({
            id: "article:two",
            media: [{ alt: "Second", src: "https://example.com/second.jpg" }],
          }),
          item({
            id: "article:three",
            media: [{ alt: "Third", src: "https://example.com/third.jpg" }],
          }),
        ])}
      />,
    );

    expect(markup.match(/loading="eager"/g)).toHaveLength(2);
    expect(markup).toContain("https%3A%2F%2Fexample.com%2Fthird.jpg");
    expect(markup).toMatch(/loading="lazy"[^>]+srcSet="[^"]*third\.jpg/);
  });

  it("renders Telegram modules with rich text and no duplicate title", () => {
    const markup = renderToStaticMarkup(
      <OverviewFeed
        initialFilter={{ type: "social" }}
        items={serializeOverviewFeedItems([
          item({
            id: "social:telegram:1",
            type: "social",
            source: "telegram",
            title: "Hidden Telegram title",
            destination: { kind: "external", href: "https://t.me/s/example/1" },
            metaLabel: "Telegram",
            summary: "Telegram rich link",
            summaryRichText: [
              { plainText: "Telegram " },
              { bold: true, plainText: "rich" },
              { plainText: " link", url: "https://example.com/rich" },
            ],
          }),
        ])}
      />,
    );

    expect(markup).not.toContain("Hidden Telegram title");
    expect(markup).toContain("<strong>rich</strong>");
    expect(markup).toMatch(
      /<a class="break-all font-semibold text-foreground underline underline-offset-\[0\.12em\]"[^>]+href="https:\/\/example\.com\/rich"/,
    );
    expect(markup).toMatch(
      /<a class="justify-self-start no-underline hover:\[&amp;_time\]:text-foreground hover:\[&amp;_time\]:underline hover:\[&amp;_time\]:underline-offset-4"[^>]+href="https:\/\/t\.me\/s\/example\/1"[\s\S]+<time/,
    );
    expect(markup).not.toMatch(
      /<a class="block text-inherit no-underline"[^>]+href="https:\/\/t\.me\/s\/example\/1"/,
    );
    expect(markup.indexOf('href="https://example.com/rich"')).toBeLessThan(
      markup.indexOf('href="https://t.me/s/example/1"'),
    );
    expect(markup).toContain('href="https://t.me/s/example/1"');
    expect(markup).toContain("Telegram");
    expect(markup.indexOf("Telegram ")).toBeLessThan(markup.indexOf("May 1, 2026"));
  });

  it("renders all media previews for Telegram modules", () => {
    const markup = renderToStaticMarkup(
      <OverviewFeed
        initialFilter={{ type: "social" }}
        items={serializeOverviewFeedItems([
          item({
            id: "social:telegram:2",
            type: "social",
            source: "telegram",
            title: "Telegram gallery",
            destination: { kind: "external", href: "https://t.me/s/example/2" },
            media: [
              {
                alt: "",
                height: 360,
                src: "https://example.com/photo-1.jpg",
                width: 640,
              },
              {
                alt: "",
                height: 720,
                src: "https://example.com/photo-2.jpg",
                width: 960,
              },
            ],
            metaLabel: "Telegram",
          }),
        ])}
      />,
    );

    expect(markup).toContain("https%3A%2F%2Fexample.com%2Fphoto-1.jpg");
    expect(markup).toContain("https%3A%2F%2Fexample.com%2Fphoto-2.jpg");
    expect(markup).toContain("grid-cols-2");
  });


  it("renders non-clickable modules and an empty state", () => {
    const nonClickable = renderToStaticMarkup(
      <OverviewFeed
        initialFilter={{}}
        items={serializeOverviewFeedItems([
          item({ destination: { kind: "none" }, id: "project:none", type: "projects" }),
        ])}
      />,
    );
    const empty = renderToStaticMarkup(
      <OverviewFeed initialFilter={{ type: "social" }} items={[]} />,
    );

    expect(nonClickable).toContain("<article");
    expect(nonClickable).not.toContain('href="/articles/one"');
    expect(empty).toContain("No feed items match this filter.");
  });

  it("serializes dates before client hydration", () => {
    const [serialized] = serializeOverviewFeedItems([item()]);

    expect(serialized?.displayedAt).toBe("2026-05-01T00:00:00.000Z");
    expect(serialized?.sourcePublishedAt).toBe("2026-04-01T00:00:00.000Z");
  });
});
