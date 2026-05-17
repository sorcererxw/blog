import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { HomePageContent } from "./intro";
import {
  createNotionHomeSource,
  getHomeDescription,
  type HomePageBlock,
} from "@/integrations/notion/home";

const makeBlock = (overrides: Partial<HomePageBlock>): HomePageBlock => ({
  id: overrides.id ?? "block-1",
  type: overrides.type ?? "paragraph",
  children: overrides.children ?? [],
  ...overrides,
});

describe("HomePageContent", () => {
  it("renders home content directly, without hero or side-rail wrappers", () => {
    const blocks: HomePageBlock[] = [
      makeBlock({
        id: "heading",
        type: "heading_1",
        heading_1: {
          rich_text: [{ plain_text: "Tempura home" }],
        },
      }),
      makeBlock({
        id: "paragraph",
        type: "paragraph",
        paragraph: {
          rich_text: [{ plain_text: "A content-first front page." }],
        },
        children: [
          makeBlock({
            id: "paragraph-child",
            type: "paragraph",
            paragraph: {
              rich_text: [{ plain_text: "Nested paragraph child." }],
            },
          }),
        ],
      }),
      makeBlock({
        id: "list-a",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ plain_text: "First item" }],
        },
      }),
      makeBlock({
        id: "list-b",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ plain_text: "Second item" }],
        },
      }),
      makeBlock({
        id: "bookmark",
        type: "bookmark",
        bookmark: {
          url: "https://example.com/home",
          caption: [{ plain_text: "Example bookmark" }],
        },
      }),
    ];

    const html = renderToStaticMarkup(<HomePageContent blocks={blocks} />);

    expect(html).toContain("aria-label=\"Home page content\"");
    expect(html).toContain("Tempura home");
    expect(html).toContain("A content-first front page.");
    expect(html).toContain("Nested paragraph child.");
    expect(html).toContain("First item");
    expect(html).toContain("Second item");
    expect(html).toContain('href="https://example.com/home"');
    expect(html).not.toContain("<aside");
    expect(html).not.toContain("publication-home-title");
    expect(html).not.toContain("publication-home-columns");
  });

  it("renders a clear empty state", () => {
    const html = renderToStaticMarkup(<HomePageContent blocks={[]} />);

    expect(html).toContain("The home page content is empty.");
    expect(html).not.toContain("publication-home-summary");
  });

  it("skips empty paragraphs and uses captions for image alt text", () => {
    const blocks: HomePageBlock[] = [
      makeBlock({
        id: "empty-paragraph",
        type: "paragraph",
        paragraph: {
          rich_text: [],
        },
      }),
      makeBlock({
        id: "map",
        type: "image",
        image: {
          external: {
            url: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4/800x400@2x.png",
          },
          caption: [{ plain_text: "Hangzhou, China" }],
        },
      }),
    ];

    const html = renderToStaticMarkup(<HomePageContent blocks={blocks} />);

    expect(html).not.toContain('<p></p>');
    expect(html).toContain('alt="Hangzhou, China"');
  });

  it("renders paragraph children even when the paragraph text is empty", () => {
    const blocks: HomePageBlock[] = [
      makeBlock({
        id: "empty-parent",
        type: "paragraph",
        paragraph: {
          rich_text: [],
        },
        children: [
          makeBlock({
            id: "nested-child",
            type: "paragraph",
            paragraph: {
              rich_text: [{ plain_text: "Child content survives." }],
            },
          }),
        ],
      }),
    ];

    const html = renderToStaticMarkup(<HomePageContent blocks={blocks} />);

    expect(html).toContain("Child content survives.");
    expect(html).not.toContain('<p></p>');
  });

  it("does not reserve a fake intrinsic ratio for image URLs without dimensions", () => {
    const blocks: HomePageBlock[] = [
      makeBlock({
        id: "image",
        type: "image",
        image: {
          external: {
            url: "https://secure.notion-static.com/notion-image.png",
          },
          caption: [{ plain_text: "Generic image" }],
        },
      }),
    ];

    const html = renderToStaticMarkup(<HomePageContent blocks={blocks} />);

    expect(html).toContain("/media/");
    expect(html).toContain('alt="Generic image"');
    expect(html).not.toContain('width="1600"');
    expect(html).not.toContain('height="900"');
  });

  it("renders table headers semantically when Notion marks them", () => {
    const blocks: HomePageBlock[] = [
      makeBlock({
        id: "table",
        type: "table",
        table: {
          has_column_header: true,
          has_row_header: true,
          rows: [
            {
              cells: [
                { rich_text: [{ plain_text: "Tool" }] },
                { rich_text: [{ plain_text: "Use" }] },
              ],
            },
            {
              cells: [
                { rich_text: [{ plain_text: "Notion" }] },
                { rich_text: [{ plain_text: "Publishing" }] },
              ],
            },
          ],
        },
      }),
    ];

    const html = renderToStaticMarkup(<HomePageContent blocks={blocks} />);

    expect(html).toMatch(/<thead[\s>]/);
    expect(html).toContain('scope="col"');
    expect(html).toContain('scope="row"');
  });

  it("renders callouts and dividers with shared semantic primitives", () => {
    const blocks: HomePageBlock[] = [
      makeBlock({
        id: "callout",
        type: "callout",
        callout: {
          icon: { type: "emoji", emoji: "!" },
          rich_text: [{ plain_text: "Shared primitive callout" }],
        },
      }),
      makeBlock({
        id: "divider",
        type: "divider",
        divider: {},
      }),
    ];

    const html = renderToStaticMarkup(<HomePageContent blocks={blocks} />);

    expect(html).toContain("Shared primitive callout");
    expect(html).toContain('role="separator"');
    expect(html).not.toContain('role="alert"');
  });
});

describe("home Notion source", () => {
  it("can be injected for deterministic tests", async () => {
    const source = createNotionHomeSource(
      vi.fn().mockResolvedValue({
        id: "home-page",
        blocks: [
          makeBlock({
            id: "home-copy",
            type: "paragraph",
            paragraph: {
              rich_text: [{ plain_text: "Injected home content." }],
            },
          }),
        ],
      }),
    );

    const homePage = await source.loadHomePage();

    expect(homePage.id).toBe("home-page");
    expect(homePage.blocks).toHaveLength(1);
    expect(getHomeDescription(homePage.blocks)).toContain("Injected home content.");
  });
});
