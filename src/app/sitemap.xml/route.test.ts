import { describe, expect, it, vi } from "vitest";

vi.mock("@/domains/article/list-articles", () => ({
  listArticles: vi.fn(async () => []),
}));

import { GET } from "./route";

describe("GET /sitemap.xml", () => {
  it("returns a sitemap with the personal site root", async () => {
    const response = await GET();
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toContain("application/xml");
    expect(body).toContain("<urlset");
    expect(body).toContain("<loc>https://sorcererxw.com/</loc>");
    expect(body).not.toContain("/blog");
    expect(body).not.toContain("/projects");
    expect(body).not.toContain("/thoughts");
    expect(body).not.toContain("/topics/");
  });
});
