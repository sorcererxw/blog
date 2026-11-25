import { describe, expect, it } from "vitest";

import {
  createCanonicalImageId,
  createCanonicalImagePath,
  decodeCanonicalImageSource,
  encodeCanonicalImageSource,
  isAllowedTransformHost,
  isCanonicalImageCandidate,
  isSafeCanonicalSourceUrl,
  isVolatileImageHost,
  resolveCanonicalImageAsset,
} from "./canonical-image";

describe("canonical-image", () => {
  it("marks telesco and notion-backed file hosts as volatile", () => {
    expect(isVolatileImageHost("cdn5.telesco.pe")).toBe(true);
    expect(isVolatileImageHost("secure.notion-static.com")).toBe(true);
    expect(isVolatileImageHost("prod-files-secure.s3.us-west-2.amazonaws.com")).toBe(true);
    expect(isVolatileImageHost("images.unsplash.com")).toBe(false);
  });

  it("allows only the configured transform hosts", () => {
    expect(isAllowedTransformHost("images.unsplash.com")).toBe(true);
    expect(isAllowedTransformHost("cdn5.telesco.pe")).toBe(true);
    expect(isAllowedTransformHost("example.com")).toBe(false);
  });

  it("creates a stable canonical media route for volatile sources", () => {
    const sourceUrl =
      "https://cdn5.telesco.pe/file/example-photo.jpg";
    const asset = resolveCanonicalImageAsset(sourceUrl);

    expect(asset.isVolatile).toBe(true);
    expect(asset.id).toBe(createCanonicalImageId(sourceUrl));
    expect(asset.canonicalUrl).toContain(`/media/${asset.id}`);
    expect(isCanonicalImageCandidate(sourceUrl)).toBe(true);
  });

  it("keeps stable or local sources untouched", () => {
    expect(resolveCanonicalImageAsset("https://images.unsplash.com/photo-1").canonicalUrl).toBe(
      "https://images.unsplash.com/photo-1",
    );
    expect(resolveCanonicalImageAsset("/favicon.svg").canonicalUrl).toBe("/favicon.svg");
  });

  it("round-trips encoded canonical source URLs", () => {
    const sourceUrl = "https://secure.notion-static.com/example.png";
    const encoded = encodeCanonicalImageSource(sourceUrl);

    expect(decodeCanonicalImageSource(encoded)).toBe(sourceUrl);
    expect(createCanonicalImagePath(sourceUrl)).toContain(encoded);
  });

  it("round-trips encoded canonical source URLs without relying on Buffer base64url", () => {
    const sourceUrl = "https://cdn5.telesco.pe/file/中文-photo.jpg?foo=1&bar=2";
    const expected = Buffer.from(sourceUrl, "utf8").toString("base64url");
    const originalBuffer = globalThis.Buffer;

    try {
      // Simulate both absent Buffer and Webpack's buffer polyfill (which lacks base64url).
      Object.defineProperty(globalThis, "Buffer", {
        configurable: true,
        value: {
          from() {
            throw new TypeError("Unknown encoding: base64url");
          },
        },
      });

      const encoded = encodeCanonicalImageSource(sourceUrl);
      expect(encoded).toBe(expected);
      expect(decodeCanonicalImageSource(encoded)).toBe(sourceUrl);
    } finally {
      Object.defineProperty(globalThis, "Buffer", {
        configurable: true,
        value: originalBuffer,
      });
    }
  });

  it("rejects unsafe canonical source URLs", () => {
    expect(isSafeCanonicalSourceUrl("https://cdn5.telesco.pe/file/photo.jpg")).toBe(true);
    expect(isSafeCanonicalSourceUrl("https://example.com/image.jpg")).toBe(false);
    expect(isSafeCanonicalSourceUrl("http://127.0.0.1/image.jpg")).toBe(false);
    expect(isSafeCanonicalSourceUrl("data:image/png;base64,abc")).toBe(false);
  });
});
