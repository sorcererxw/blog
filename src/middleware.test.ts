import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import { middleware } from "./middleware";

function request(pathname: string): NextRequest {
  return {
    nextUrl: new URL(`https://sorcererxw.com${pathname}`),
    url: `https://sorcererxw.com${pathname}`,
  } as NextRequest;
}

describe("middleware", () => {
  it("redirects remaining legacy archive paths to homepage filters", () => {
    const blogResponse = middleware(request("/blog"));
    const projectsResponse = middleware(request("/projects"));
    const thoughtsResponse = middleware(request("/thoughts"));

    expect(blogResponse.status).toBe(200);
    expect(blogResponse.headers.get("location")).toBeNull();
    expect(projectsResponse.status).toBe(308);
    expect(projectsResponse.headers.get("location")).toBe("https://sorcererxw.com/?type=projects");
    expect(thoughtsResponse.status).toBe(308);
    expect(thoughtsResponse.headers.get("location")).toBe("https://sorcererxw.com/?type=social");
  });

  it("redirects locale-prefixed paths to canonical paths", () => {
    const rootResponse = middleware(request("/en"));
    const articleResponse = middleware(request("/zh/articles/modern-astro"));
    const archiveResponse = middleware(request("/en/blog"));

    expect(rootResponse.status).toBe(308);
    expect(rootResponse.headers.get("location")).toBe("https://sorcererxw.com/");
    expect(articleResponse.status).toBe(308);
    expect(articleResponse.headers.get("location")).toBe("https://sorcererxw.com/articles/modern-astro");
    expect(archiveResponse.status).toBe(308);
    expect(archiveResponse.headers.get("location")).toBe("https://sorcererxw.com/blog");
  });

  it("passes through active routes", () => {
    const response = middleware(request("/articles/modern-astro"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
