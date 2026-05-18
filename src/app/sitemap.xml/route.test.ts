import { describe, expect, it, vi } from "vitest";

vi.mock("@/domains/article/list-articles", () => ({
  listArticles: vi.fn(async () => [
    {
      date: new Date("2026-05-18T00:00:00.000Z"),
      slug: "sitewide-seo",
    },
  ]),
}));

import { dynamic, GET } from "./route";

describe("GET /sitemap.xml", () => {
  it("stays runtime-generated so Cloudflare builds do not require Notion secrets", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("returns a sitemap with the personal site root", async () => {
    const response = await GET();
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toContain("application/xml");
    expect(body).toContain("<urlset");
    expect(body).toContain("<loc>https://sorcererxw.com/</loc>");
    expect(body).toContain("<loc>https://sorcererxw.com/articles/sitewide-seo</loc>");
    expect(body).toContain("<lastmod>2026-05-18T00:00:00.000Z</lastmod>");
    expect(body).not.toContain("/blog");
    expect(body).not.toContain("/projects");
    expect(body).not.toContain("/thoughts");
    expect(body).not.toContain("/topics/");
  });
});
