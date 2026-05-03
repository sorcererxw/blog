import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createCanonicalImageId,
  encodeCanonicalImageSource,
} from "@/domains/media/canonical-image";
import { createMemoryCanonicalMediaCache } from "@/integrations/kv/canonical-media-cache";

import { GET } from "./[id]";

describe("GET /media/[id]", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
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

    const response = await GET({
      params: { id: createCanonicalImageId(sourceUrl) },
      request: new Request(
        `https://sorcererxw.com/media/${createCanonicalImageId(sourceUrl)}?u=${encodeCanonicalImageSource(sourceUrl)}`,
      ),
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("X-Blog2-Canonical-Media")).toBe("1");
    expect(response.headers.get("X-Blog2-Canonical-Media-Cache")).toBe("miss");
  });

  it("rejects disallowed source hosts", async () => {
    const sourceUrl = "https://example.com/photo.jpg";
    const response = await GET({
      params: { id: createCanonicalImageId(sourceUrl) },
      request: new Request(
        `https://sorcererxw.com/media/${createCanonicalImageId(sourceUrl)}?u=${encodeCanonicalImageSource(sourceUrl)}`,
      ),
    } as never);

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

    const response = await GET({
      params: { id: createCanonicalImageId(sourceUrl) },
      request: new Request(
        `https://sorcererxw.com/media/${createCanonicalImageId(sourceUrl)}?u=${encodeCanonicalImageSource(sourceUrl)}`,
      ),
      locals: {
        __testEnv: {
          BLOG_CACHE: kv,
        },
      },
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Blog2-Canonical-Media-Cache")).toBe("kv-hit");
  });
});
