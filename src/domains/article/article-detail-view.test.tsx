import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ArticleDetailView,
  formatArticleDetailDate,
} from "@/domains/article/article-detail-view";
import type { ArticleDetail } from "@/domains/article/article-detail-types";

describe("ArticleDetailView", () => {
  const article: ArticleDetail = {
    id: "article-1",
    slug: "hello-world",
    title: "Hello World",
    summary: "A short introduction",
    date: new Date("2026-02-11T00:00:00.000Z"),
    cover: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&q=80",
    icon: { kind: "emoji", value: "✦" },
    blocks: [
      { kind: "heading", level: 2, text: "Getting started" },
      { kind: "paragraph", text: "This is the first section." },
      { kind: "quote", text: "A representative excerpt." },
      { kind: "code", language: "ts", text: "export const answer = 42;" },
      { kind: "list-item", ordered: true, text: "First step" },
      { kind: "list-item", ordered: true, text: "Second step" },
      { kind: "list-item", ordered: false, text: "First bullet" },
      {
        kind: "image",
        url: "https://secure.notion-static.com/example/image.jpg",
        caption: "An image caption",
      },
      {
        kind: "bookmark",
        url: "https://example.com/bookmark",
        title: "Bookmark title",
        imageUrl: "https://secure.notion-static.com/example/bookmark.jpg",
      },
      { kind: "divider" },
    ],
  };

  it("renders the article structure with metadata, body, and a button-style archive return", () => {
    const markup = renderToStaticMarkup(<ArticleDetailView article={article} />);

    expect(markup).toContain("Hello World");
    expect(markup).toContain("sorcererxw");
    expect(markup).toContain("Feb 11, 2026");
    expect(markup).toContain("/cdn-cgi/image/");
    expect(markup).not.toContain("A short introduction");
    expect(markup).not.toContain("Back to archive");
    expect(markup).not.toContain(">Article<");
    expect(markup).toContain("Getting started");
    expect(markup).toContain("This is the first section.");
    expect(markup).toContain("A representative excerpt.");
    expect(markup).toContain("export const answer = 42;");
    expect(markup).not.toContain("ts\nexport const answer = 42;");
    expect(markup).toContain("<ol>");
    expect(markup).toContain("First step");
    expect(markup).toContain("Second step");
    expect(markup).toContain("<ul>");
    expect(markup).toContain("First bullet");
    expect(markup).not.toContain(">1.");
    expect(markup).toContain("/media/");
    expect(markup).toContain("An image caption");
    expect(markup).toContain("Bookmark title");
    expect(markup).not.toContain("Continue the thread");
    expect(markup).not.toContain("Comments are not wired into blog2 yet.");
    expect(markup).toContain('href="/blog"');
    expect(markup).toContain("Back to the archive");
    expect(markup).toContain("✦");
    expect(markup).toMatch(/<article class="[^"]+"><div class="[^"]+">/);
    expect(markup).toMatch(/<header[\s\S]*Hello World[\s\S]*sorcererxw[\s\S]*Feb 11, 2026/);
    expect(markup).toMatch(
      /<section aria-label="Article content"[\s\S]*Getting started[\s\S]*Bookmark title/,
    );
    expect(markup).toMatch(/<footer[\s\S]*Back to the archive/);
    expect(markup).toContain("publication-button");
  });

  it("renders captionless images with empty alt text instead of placeholder copy", () => {
    const markup = renderToStaticMarkup(
      <ArticleDetailView
        article={{
          ...article,
          blocks: [
            {
              kind: "image",
              url: "https://secure.notion-static.com/example/plain-image.jpg",
              caption: null,
            },
          ],
        }}
      />,
    );

    expect(markup).toContain('/media/');
    expect(markup).toContain('alt=""');
    expect(markup).not.toContain("Article illustration");
  });

  it("formats article dates in UTC for stable public rendering", () => {
    expect(formatArticleDetailDate(new Date("2026-02-11T00:00:00.000Z"))).toBe(
      "Feb 11, 2026",
    );
  });

  it("renders shared primitive semantics for bookmarks and dividers", () => {
    const markup = renderToStaticMarkup(<ArticleDetailView article={article} />);

    expect(markup).toContain('href="https://example.com/bookmark"');
    expect(markup).toContain("Bookmark title");
    expect(markup).toContain('role="separator"');
  });

  it("keeps the archive return flush without a divider", () => {
    const stylesheet = readFileSync(
      new URL("./article-detail-view.module.css", import.meta.url),
      "utf8",
    );
    const endMatterRule = stylesheet.match(/\.endMatter\s*\{[\s\S]*?\}/)?.[0];

    expect(endMatterRule).toBeTruthy();
    expect(endMatterRule).not.toContain("border-top");
  });

  it("renders rich text annotations and advanced notion blocks", () => {
    const markup = renderToStaticMarkup(
      <ArticleDetailView
        article={{
          ...article,
          blocks: [
            {
              kind: "heading",
              level: 2,
              id: "intro",
              richText: [
                {
                  plainText: "Linked heading",
                },
              ],
            },
            {
              kind: "paragraph",
              richText: [
                {
                  plainText: "Annotated",
                  bold: true,
                },
                {
                  plainText: " link",
                  href: "https://example.com/annotated",
                },
              ],
            },
            {
              kind: "callout",
              emoji: "💡",
              richText: [{ plainText: "Callout body" }],
              children: [
                {
                  kind: "todo",
                  checked: true,
                  richText: [{ plainText: "Nested todo" }],
                },
              ],
            },
            {
              kind: "toggle",
              richText: [{ plainText: "Open toggle" }],
              children: [
                {
                  kind: "paragraph",
                  richText: [{ plainText: "Toggle child" }],
                },
              ],
            },
            {
              kind: "tableOfContent",
              nodes: [
                {
                  id: "intro",
                  title: "Linked heading",
                  nodes: [],
                },
              ],
            },
            {
              kind: "table",
              rows: [
                {
                  cells: [
                    {
                      header: true,
                      richText: [{ plainText: "Column" }],
                    },
                  ],
                },
                {
                  cells: [
                    {
                      richText: [{ plainText: "Value" }],
                    },
                  ],
                },
              ],
            },
          ],
        } as ArticleDetail}
      />,
    );

    expect(markup).toContain('id="intro"');
    expect(markup).toContain('href="#intro"');
    expect(markup).toContain("<strong>Annotated</strong>");
    expect(markup).toContain('href="https://example.com/annotated"');
    expect(markup).toContain("Callout body");
    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain('checked=""');
    expect(markup).toContain("<details");
    expect(markup).toContain("Toggle child");
    expect(markup).toContain("<table");
    expect(markup).toContain("Column");
    expect(markup).toContain("Value");
  });

  it("renders notion tables with wrapping-friendly cell classes for narrow reading layouts", () => {
    const markup = renderToStaticMarkup(
      <ArticleDetailView
        article={{
          ...article,
          blocks: [
            {
              kind: "table",
              rows: [
                {
                  cells: [
                    {
                      header: true,
                      richText: [{ plainText: "Column" }],
                    },
                    {
                      header: true,
                      richText: [{ plainText: "Comparison notes" }],
                    },
                  ],
                },
                {
                  cells: [
                    {
                      richText: [{ plainText: "gRPC-Web" }],
                    },
                    {
                      richText: [
                        {
                          plainText:
                            "Protocol Buffers + Base64 for HTTP/1.x browser compatibility",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        } as ArticleDetail}
      />,
    );

    expect(markup).toContain("<table");
    expect(markup).toContain("Protocol Buffers + Base64 for HTTP/1.x browser compatibility");
    expect(markup).toContain("whitespace-normal");
    expect(markup).toContain("break-words");
  });

  it("renders pre-highlighted html without nesting an extra pre wrapper", () => {
    const markup = renderToStaticMarkup(
      <ArticleDetailView
        article={{
          ...article,
          blocks: [
            {
              kind: "code",
              language: "typescript",
              text: "export const answer = 42;",
              highlightedHtml:
                '<pre class="shiki"><code><span class="line"><span style="color:#000">export const answer = 42;</span></span></code></pre>',
            },
          ],
        }}
      />,
    );

    expect(markup).toContain('class="shiki"');
    expect(markup).not.toContain("<pre><pre");
  });
});
