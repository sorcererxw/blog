import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createCanonicalImageId,
  encodeCanonicalImageSource,
} from "@/domains/media/canonical-image";
import { createMemoryCanonicalMediaCache } from "@/integrations/kv/canonical-media-cache";
import { env as mockWorkerEnv } from "cloudflare:workers";

import { handleCanonicalMediaRequest } from "./canonical-media";

function setMockWorkerEnv(next: Record<string, unknown>) {
  const target = mockWorkerEnv as Record<string, unknown>;
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, next);
}

describe("GET /media/$id", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setMockWorkerEnv({});
    vi.restoreAllMocks();
  });

  it("fetches and returns an allowed upstream image", async () => {
    const sourceUrl = "https://cdn5.telesco.pe/file/example-photo.jpg";
    const id = createCanonicalImageId(sourceUrl);
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: {
          "Content-Type": "image/jpeg",
        },
        status: 200,
      }),
    );

    const response = await handleCanonicalMediaRequest(
      new Request(
        `https://sorcererxw.com/media/${id}?u=${encodeCanonicalImageSource(sourceUrl)}`,
      ),
      id,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(response.headers.get("X-Blog2-Canonical-Media")).toBe("1");
    expect(response.headers.get("X-Blog2-Canonical-Media-Cache")).toBe("miss");
  });

  it("rejects disallowed source hosts", async () => {
    const sourceUrl = "https://example.com/photo.jpg";
    const id = createCanonicalImageId(sourceUrl);
    const response = await handleCanonicalMediaRequest(
      new Request(
        `https://sorcererxw.com/media/${id}?u=${encodeCanonicalImageSource(sourceUrl)}`,
      ),
      id,
    );

    expect(response.status).toBe(403);
  });

  it("serves a cached canonical media object from BLOG_CACHE when available", async () => {
    const sourceUrl = "https://cdn5.telesco.pe/file/example-photo.jpg";
    const id = createCanonicalImageId(sourceUrl);
    const memoryCache = createMemoryCanonicalMediaCache();
    const body = new Uint8Array([9, 8, 7]).buffer;
    await memoryCache.set(id, {
      body,
      record: {
        contentType: "image/jpeg",
        sourceUrl,
      },
    });

    const kv = {
      async delete() {
        return undefined;
      },
      async get(key: string, type?: "arrayBuffer" | "json") {
        const keyId = key.split(":").pop()!;
        const hit = await memoryCache.get(keyId);
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
      async list() {
        return { cursor: "", keys: [], list_complete: true };
      },
      async put() {
        return undefined;
      },
    };

    setMockWorkerEnv({ BLOG_CACHE: kv });

    const response = await handleCanonicalMediaRequest(
      new Request(
        `https://sorcererxw.com/media/${id}?u=${encodeCanonicalImageSource(sourceUrl)}`,
      ),
      id,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
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
      const notModified = await handleCanonicalMediaRequest(
        new Request(
          `https://sorcererxw.com/media/${id}?u=${encodeCanonicalImageSource(sourceUrl)}`,
          {
            headers: {
              "if-none-match": `"${id}"`,
            },
          },
        ),
        id,
      );
      expect(notModified.status).toBe(304);
      expect(notModified.headers.get("Cache-Control")).toBe(
        "public, max-age=31536000, immutable",
      );

      setMockWorkerEnv({
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
      });

      const kvHit = await handleCanonicalMediaRequest(
        new Request(
          `https://sorcererxw.com/media/${id}?u=${encodeCanonicalImageSource(sourceUrl)}`,
        ),
        id,
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
