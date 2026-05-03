import { describe, expect, it, vi } from "vitest";

const articleState = vi.hoisted(() => ({
  listArticles: vi.fn(),
}));

vi.mock("@/domains/article/list-articles", () => ({
  listArticles: articleState.listArticles,
}));

vi.mock("@/integrations/notion/articles", () => ({
  createBlogArticleSource: () => ({ listArticles: articleState.listArticles }),
}));

import { GET } from "./sitemap.xml";

describe("sitemap.xml", () => {
  it("includes core public routes and article detail URLs", async () => {
    articleState.listArticles.mockResolvedValue([
      {
        date: new Date("2026-04-14T00:00:00.000Z"),
        slug: "modern-astro",
        summary: "A first pass at the public blog surface on Cloudflare.",
        title: "Building the new blog shell",
      },
    ]);

    const response = await GET();
    const text = await response.text();

    expect(response.headers.get("Content-Type")).toContain("application/xml");
    expect(text).toContain("<loc>https://sorcererxw.com/</loc>");
    expect(text).toContain("<loc>https://sorcererxw.com/blog</loc>");
    expect(text).toContain("<loc>https://sorcererxw.com/topics/astro-cloudflare-publishing</loc>");
    expect(text).toContain("<loc>https://sorcererxw.com/articles/modern-astro</loc>");
  });
});
