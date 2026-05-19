import { describe, expect, it } from "vitest";

import { GET, HEAD } from "./route";

describe("GET /.well-known/api-catalog", () => {
  it("returns an RFC 9727 API catalog linkset with agent-useful relations", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/linkset+json");
    expect(response.headers.get("Link")).toContain('rel="api-catalog"');
    expect(response.headers.get("Link")).toContain('rel="service-doc"');
    expect(response.headers.get("Link")).toContain('rel="describedby"');

    await expect(response.json()).resolves.toMatchObject({
      linkset: [
        {
          describedby: [
            {
              href: "https://sorcererxw.com/sitemap.xml",
              type: "application/xml",
            },
          ],
          item: [
            {
              href: "https://sorcererxw.com/api/health",
              type: "application/json",
            },
          ],
          "service-doc": [
            {
              href: "https://sorcererxw.com/llms.txt",
              type: "text/plain",
            },
          ],
        },
      ],
    });
  });
});

describe("HEAD /.well-known/api-catalog", () => {
  it("advertises the API catalog relation without a response body", async () => {
    const response = await HEAD();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/linkset+json");
    expect(response.headers.get("Link")).toContain('rel="api-catalog"');
    await expect(response.text()).resolves.toBe("");
  });
});
