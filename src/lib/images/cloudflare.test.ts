import { describe, expect, it } from "vitest";

import {
  buildCloudflareImageSrcSet,
  buildCloudflareImageUrl,
  getDefaultImageSizes,
} from "./cloudflare";

describe("cloudflare image loader", () => {
  it("builds transformed urls for allowed stable hosts", () => {
    const url = buildCloudflareImageUrl(
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1600&q=80",
      "hero",
    );

    expect(url).toContain("/cdn-cgi/image/");
    expect(url).toContain("format=auto");
    expect(url).toContain("images.unsplash.com");
  });

  it("builds transformed urls for X media", () => {
    const url = buildCloudflareImageUrl(
      "https://pbs.twimg.com/media/HIv1eC8bYAARyvw.jpg",
      "article-card",
      { width: 384 },
    );

    expect(url).toBe(
      "/cdn-cgi/image/fit=cover,format=auto,quality=82,width=384/https://pbs.twimg.com/media/HIv1eC8bYAARyvw.jpg",
    );
  });

  it("routes volatile hosts through the canonical media path before transforming", () => {
    const url = buildCloudflareImageUrl(
      "https://cdn5.telesco.pe/file/example-photo.jpg",
      "thought-photo",
    );

    expect(url).toContain("/cdn-cgi/image/");
    expect(url).toContain("/media/");
    expect(url).toContain("?u=");
  });

  it("leaves unsupported or bypassed sources untouched", () => {
    expect(buildCloudflareImageUrl("/favicon.svg", "icon")).toBe("/favicon.svg");
    expect(buildCloudflareImageUrl("https://example.com/photo.jpg", "content-image")).toBe(
      "https://example.com/photo.jpg",
    );
  });

  it("builds srcset values for transformable sources", () => {
    const srcSet = buildCloudflareImageSrcSet(
      "https://secure.notion-static.com/example.png",
      "content-image",
    );

    expect(srcSet).toContain("480w");
    expect(srcSet).toContain("/media/");
  });

  it("returns preset sizes for responsive rendering", () => {
    expect(getDefaultImageSizes("article-card")).toContain("100vw");
  });
});
