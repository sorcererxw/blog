import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createCanonicalImageId,
  encodeCanonicalImageSource,
} from "@/domains/media/canonical-image";
import { createMemoryCanonicalMediaCache } from "@/integrations/kv/canonical-media-cache";

import { GET } from "./route";

let testEnv: Record<string, unknown> = {};

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: testEnv }),
}));

describe("GET /media/[id]", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    testEnv = {};
    vi.restoreAllMocks();
  });

  it("fetches and returns an allowed upstream image", async () => {
    const sourceUrl = "https://cdn5.telesco.pe/file/example-photo.jpg";
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
        },
      }),
    );

    const response = await GET(
      new Request(
        `https://sorcererxw.com/media/${createCanonicalImageId(sourceUrl)}?u=${encodeCanonicalImageSource(sourceUrl)}`,
      ),
      {
        params: Promise.resolve({ id: createCanonicalImageId(sourceUrl) }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("X-Blog2-Canonical-Media")).toBe("1");
    expect(response.headers.get("X-Blog2-Canonical-Media-Cache")).toBe("miss");
  });

  it("rejects disallowed source hosts", async () => {
    const sourceUrl = "https://example.com/photo.jpg";
    const response = await GET(
      new Request(
        `https://sorcererxw.com/media/${createCanonicalImageId(sourceUrl)}?u=${encodeCanonicalImageSource(sourceUrl)}`,
      ),
      {
        params: Promise.resolve({ id: createCanonicalImageId(sourceUrl) }),
      },
    );

    expect(response.status).toBe(403);
  });

  it("serves a cached canonical media object from BLOG_CACHE when available", async () => {
    const sourceUrl = "https://cdn5.telesco.pe/file/example-photo.jpg";
    const memoryCache = createMemoryCanonicalMediaCache();
    const body = new Uint8Array([9, 8, 7]).buffer;
    await memoryCache.set(createCanonicalImageId(sourceUrl), {
      body,
      record: {
        contentType: "image/jpeg",
        sourceUrl,
      },
    });

    const kv = {
      async get(key: string, type?: "arrayBuffer" | "json") {
        const id = key.split(":").pop()!;
        const hit = await memoryCache.get(id);
        if (!hit) {
          return null;
        }
        if (type === "arrayBuffer") {
          return hit.body;
        }
        if (type === "json") {
          return hit.record;
        }
        return null;
      },
      async put() {
        return undefined;
      },
      async delete() {
        return undefined;
      },
      async list() {
        return { cursor: "", keys: [], list_complete: true };
      },
    };

    testEnv = {
      BLOG_CACHE: kv,
    };

    const response = await GET(
      new Request(
        `https://sorcererxw.com/media/${createCanonicalImageId(sourceUrl)}?u=${encodeCanonicalImageSource(sourceUrl)}`,
      ),
      {
        params: Promise.resolve({ id: createCanonicalImageId(sourceUrl) }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("X-Blog2-Canonical-Media-Cache")).toBe("kv-hit");
  });

  it("returns 304 when If-None-Match matches the canonical id and backfills edge cache on KV hits", async () => {
    const sourceUrl = "https://cdn5.telesco.pe/file/example-photo-2.jpg";
    const id = createCanonicalImageId(sourceUrl);
    const putSpy = vi.fn(async () => undefined);
    const originalCaches = globalThis.caches;

    Object.defineProperty(globalThis, "caches", {
      configurable: true,
      value: {
        async open() {
          return {
            async match() {
              return undefined;
            },
            put: putSpy,
          };
        },
      },
    });

    try {
      const notModified = await GET(
        new Request(
          `https://sorcererxw.com/media/${id}?u=${encodeCanonicalImageSource(sourceUrl)}`,
          {
            headers: {
              "if-none-match": `"${id}"`,
            },
          },
        ),
        {
          params: Promise.resolve({ id }),
        },
      );
      expect(notModified.status).toBe(304);
      expect(notModified.headers.get("Cache-Control")).toBe(
        "public, max-age=31536000, immutable",
      );

      testEnv = {
        BLOG_CACHE: {
          async delete() {
            return undefined;
          },
          async get(_key: string, type?: "arrayBuffer" | "json") {
            if (type === "arrayBuffer") {
              return new Uint8Array([4, 5, 6]).buffer;
            }
            if (type === "json") {
              return { contentType: "image/jpeg", sourceUrl };
            }
            return null;
          },
          async list() {
            return { cursor: "", keys: [], list_complete: true };
          },
          async put() {
            return undefined;
          },
        },
      };

      const kvHit = await GET(
        new Request(
          `https://sorcererxw.com/media/${id}?u=${encodeCanonicalImageSource(sourceUrl)}`,
        ),
        {
          params: Promise.resolve({ id }),
        },
      );
      expect(kvHit.status).toBe(200);
      expect(putSpy).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(globalThis, "caches", {
        configurable: true,
        value: originalCaches,
      });
    }
  });
});
