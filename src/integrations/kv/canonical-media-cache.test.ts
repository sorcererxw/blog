import { describe, expect, it } from "vitest";

import {
  createMemoryCanonicalMediaCache,
  createNoopCanonicalMediaCache,
} from "./canonical-media-cache";

describe("canonical media cache", () => {
  it("stores and retrieves canonical media in memory", async () => {
    const cache = createMemoryCanonicalMediaCache();
    const body = new Uint8Array([1, 2, 3]).buffer;

    await cache.set("asset-1", {
      body,
      record: {
        contentType: "image/jpeg",
        sourceUrl: "https://cdn5.telesco.pe/file/photo.jpg",
      },
    });

    await expect(cache.get("asset-1")).resolves.toEqual({
      body,
      record: {
        contentType: "image/jpeg",
        sourceUrl: "https://cdn5.telesco.pe/file/photo.jpg",
      },
    });
  });

  it("returns null for the noop cache", async () => {
    await expect(createNoopCanonicalMediaCache().get("missing")).resolves.toBeNull();
  });
});
