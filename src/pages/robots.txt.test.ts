import { describe, expect, it } from "vitest";

import { GET } from "./robots.txt";

describe("robots.txt", () => {
  it("returns a crawl policy with the sitemap location", async () => {
    const response = GET();
    const text = await response.text();

    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Allow: /");
    expect(text).toContain("Disallow: /api/");
    expect(text).toContain("Sitemap: https://sorcererxw.com/sitemap.xml");
  });
});
