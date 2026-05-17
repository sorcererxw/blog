import { describe, expect, it } from "vitest";

import cloudflareLoader from "../../../image-loader";

describe("OpenNext Cloudflare image loader", () => {
  it("builds Cloudflare transform URLs for allowed stable hosts", () => {
    const url = cloudflareLoader({
      src: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1600&q=80",
      width: 960,
      quality: 82,
    });

    expect(url).toContain("/cdn-cgi/image/");
    expect(url).toContain("width=960");
    expect(url).toContain("format=auto");
    expect(url).toContain("quality=82");
    expect(url).toContain("images.unsplash.com");
  });

  it("routes volatile image hosts through canonical media without local transform wrapping", () => {
    const url = cloudflareLoader({
      src: "https://cdn5.telesco.pe/file/example-photo.jpg",
      width: 720,
      quality: 80,
    });

    expect(url).toMatch(/^\/media\//);
    expect(url).toContain("?u=");
    expect(url).toContain("width=720");
    expect(url).toContain("quality=80");
  });

  it("bypasses unsupported sources", () => {
    expect(cloudflareLoader({ src: "/favicon.svg", width: 80 })).toBe("/favicon.svg?width=80");
    expect(cloudflareLoader({ src: "https://example.com/photo.jpg", width: 720 })).toBe(
      "https://example.com/photo.jpg?width=720",
    );
  });
});
