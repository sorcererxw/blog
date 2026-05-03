import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleList } from "@/domains/article/article-list";
import { listArticles } from "@/domains/article/list-articles";
import type { ArticleListItem } from "@/domains/article/types";

vi.mock("@/domains/article/list-articles", () => ({
  listArticles: vi.fn(),
}));

describe("ArticleList", () => {
  const articles: ArticleListItem[] = [
    {
      slug: "newest-post",
      title: "Newest Post",
      summary: "Newest summary",
      date: new Date("2026-02-01T00:00:00.000Z"),
      cover: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1600&q=80",
      icon: { kind: "emoji", value: "✦" },
    },
    {
      slug: "older-post",
      title: "Older Post",
      summary: "Older summary",
      date: new Date("2026-01-03T00:00:00.000Z"),
      icon: { kind: "url", value: "https://images.unsplash.com/icon.png?w=80&q=80" },
    },
  ];

  beforeEach(() => {
    vi.mocked(listArticles).mockResolvedValue(articles);
  });

  it("renders the archive entries without the old archive heading copy", async () => {
    const items = await listArticles();
    const markup = renderToStaticMarkup(<ArticleList items={items} />);

    expect(markup).toContain('id="blog-archive-title"');
    expect(markup).not.toContain("Engineering archive");
    expect(markup).not.toContain(
      "Technical writing on migrations, publishing systems, and infrastructure decisions.",
    );
    expect(markup).toContain('href="/articles/newest-post"');
    expect(markup).toContain('href="/articles/older-post"');
    expect(markup).toContain("Newest Post");
    expect(markup).toContain("Older Post");
    expect(markup).toContain("Newest summary");
    expect(markup).toContain("Older summary");
    expect(markup).toContain("Feb 1, 2026");
    expect(markup).toContain("Jan 3, 2026");
    expect(markup.indexOf("Newest Post")).toBeLessThan(markup.indexOf("Older Post"));
  });

  it("renders an explicit empty state when no articles exist", () => {
    const markup = renderToStaticMarkup(<ArticleList items={[]} />);

    expect(markup).toContain("No articles published yet.");
    expect(markup).toContain("The archive is ready.");
    expect(markup).not.toContain("Engineering archive");
  });

  it("renders emoji and url icons with distinct semantics", () => {
    const markup = renderToStaticMarkup(<ArticleList items={articles} />);

    expect(markup).toContain("✦");
    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="Older Post icon"');
    expect(markup).toContain("/cdn-cgi/image/");
    expect(markup).not.toContain(">↗<");
  });

  it("treats cover art as decorative when the title is already visible", () => {
    const markup = renderToStaticMarkup(<ArticleList items={articles} />);

    expect(markup).toContain('alt=""');
    expect(markup).not.toContain('alt="Newest Post"');
  });
});
