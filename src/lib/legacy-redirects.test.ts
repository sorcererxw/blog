import { describe, expect, it } from "vitest";

import { getLegacyRedirectResponse } from "./legacy-redirects";

function request(pathname: string): Request {
  return new Request(`https://sorcererxw.com${pathname}`);
}

describe("getLegacyRedirectResponse", () => {
  it("redirects remaining legacy archive paths to homepage filters", () => {
    const blogResponse = getLegacyRedirectResponse(request("/blog"));
    const projectsResponse = getLegacyRedirectResponse(request("/projects"));
    const thoughtsResponse = getLegacyRedirectResponse(request("/thoughts"));

    expect(blogResponse).toBeNull();
    expect(projectsResponse?.status).toBe(308);
    expect(projectsResponse?.headers.get("location")).toBe("https://sorcererxw.com/?type=projects");
    expect(thoughtsResponse?.status).toBe(308);
    expect(thoughtsResponse?.headers.get("location")).toBe("https://sorcererxw.com/?type=social");
  });

  it("redirects locale-prefixed paths to canonical paths", () => {
    const rootResponse = getLegacyRedirectResponse(request("/en"));
    const articleResponse = getLegacyRedirectResponse(request("/zh/articles/modern-astro"));
    const archiveResponse = getLegacyRedirectResponse(request("/en/blog"));
    const localeProjectsResponse = getLegacyRedirectResponse(request("/zh/projects"));

    expect(rootResponse?.status).toBe(308);
    expect(rootResponse?.headers.get("location")).toBe("https://sorcererxw.com/");
    expect(articleResponse?.status).toBe(308);
    expect(articleResponse?.headers.get("location")).toBe("https://sorcererxw.com/articles/modern-astro");
    expect(archiveResponse?.status).toBe(308);
    expect(archiveResponse?.headers.get("location")).toBe("https://sorcererxw.com/blog");
    expect(localeProjectsResponse?.status).toBe(308);
    expect(localeProjectsResponse?.headers.get("location")).toBe("https://sorcererxw.com/?type=projects");
  });

  it("returns null for active routes", () => {
    expect(getLegacyRedirectResponse(request("/"))).toBeNull();
    expect(getLegacyRedirectResponse(request("/articles/modern-astro"))).toBeNull();
    expect(getLegacyRedirectResponse(request("/api/health"))).toBeNull();
  });
});
