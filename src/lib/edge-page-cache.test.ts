import { describe, expect, it, vi } from "vitest";

import {
  buildEdgePageCacheKey,
  handleEdgeCachedFetch,
  isEdgeCacheableRequest,
  type EdgeCacheStorage,
} from "./edge-page-cache";

const createMemoryEdgeCache = (): EdgeCacheStorage & {
  entries: Map<string, Response>;
  putSpy: ReturnType<typeof vi.fn>;
} => {
  const entries = new Map<string, Response>();
  const putSpy = vi.fn(async (request: Request, response: Response) => {
    entries.set(request.url, response.clone());
  });

  return {
    entries,
    async match(request: Request) {
      const hit = entries.get(request.url);
      return hit ? hit.clone() : undefined;
    },
    put: putSpy,
    putSpy,
  };
};

describe("edge page cache", () => {
  it("normalizes allowed homepage filter params and ignores tracking params", () => {
    const withTracking = buildEdgePageCacheKey(
      new Request("https://sorcererxw.com/?utm_source=x&type=writing&fbclid=123"),
    );
    const canonical = buildEdgePageCacheKey(
      new Request("https://sorcererxw.com/?type=writing"),
    );

    expect(withTracking.url).toBe(canonical.url);
    expect(
      buildEdgePageCacheKey(new Request("https://sorcererxw.com/"), "build-a").url,
    ).not.toBe(
      buildEdgePageCacheKey(new Request("https://sorcererxw.com/"), "build-b").url,
    );
  });

  it("bypasses RSC, API, media, and non-GET requests", () => {
    expect(
      isEdgeCacheableRequest(
        new Request("https://sorcererxw.com/", { headers: { rsc: "1" } }),
      ),
    ).toBe(false);
    expect(
      isEdgeCacheableRequest(new Request("https://sorcererxw.com/api/health")),
    ).toBe(false);
    expect(
      isEdgeCacheableRequest(new Request("https://sorcererxw.com/media/1234")),
    ).toBe(false);
    expect(
      isEdgeCacheableRequest(
        new Request("https://sorcererxw.com/", { method: "POST" }),
      ),
    ).toBe(false);
    expect(
      isEdgeCacheableRequest(new Request("https://sorcererxw.com/articles/test")),
    ).toBe(true);
    expect(
      isEdgeCacheableRequest(new Request("https://sorcererxw.com/sitemap.xml")),
    ).toBe(true);
  });

  it("caches HTML misses with Cache-API-safe Vary, serves fresh hits, and revalidates stale hits via waitUntil", async () => {
    const cache = createMemoryEdgeCache();
    const waitUntilTasks: Promise<unknown>[] = [];
    const context = {
      waitUntil: (promise: Promise<unknown>) => {
        waitUntilTasks.push(promise);
      },
    };
    let currentTime = 5_000_000;
    let renderCount = 0;

    const originFetch = vi.fn(async () => {
      renderCount += 1;
      return new Response(`<html>render-${renderCount}</html>`, {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=600",
          "Content-Type": "text/html; charset=utf-8",
          Vary: "rsc, next-router-state-tree",
        },
        status: 200,
      });
    });

    const miss = await handleEdgeCachedFetch({
      cache,
      context,
      now: () => currentTime,
      originFetch,
      request: new Request("https://sorcererxw.com/"),
    });
    await Promise.all(waitUntilTasks.splice(0));

    expect(miss.headers.get("x-blog2-edge-cache")).toBe("miss");
    expect(await miss.text()).toBe("<html>render-1</html>");
    const stored = Array.from(cache.entries.values())[0];
    expect(stored?.headers.get("vary")).toBe("Accept-Encoding");

    const hit = await handleEdgeCachedFetch({
      cache,
      context,
      now: () => currentTime + 10_000,
      originFetch,
      request: new Request("https://sorcererxw.com/?utm_campaign=test"),
    });
    expect(hit.headers.get("x-blog2-edge-cache")).toBe("hit");
    expect(hit.headers.get("vary")).toBe("rsc, next-router-state-tree");
    expect(await hit.text()).toBe("<html>render-1</html>");
    expect(originFetch).toHaveBeenCalledTimes(1);

    currentTime += 601_000;
    const stale = await handleEdgeCachedFetch({
      cache,
      context,
      now: () => currentTime,
      originFetch,
      request: new Request("https://sorcererxw.com/"),
    });
    expect(stale.headers.get("x-blog2-edge-cache")).toBe("stale");
    expect(await stale.text()).toBe("<html>render-1</html>");
    await Promise.all(waitUntilTasks.splice(0));
    expect(originFetch).toHaveBeenCalledTimes(2);

    const refreshed = await handleEdgeCachedFetch({
      cache,
      context,
      now: () => currentTime + 1_000,
      originFetch,
      request: new Request("https://sorcererxw.com/"),
    });
    expect(refreshed.headers.get("x-blog2-edge-cache")).toBe("hit");
    expect(await refreshed.text()).toBe("<html>render-2</html>");
  });
});
