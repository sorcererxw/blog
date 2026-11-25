import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ResponsiveRemoteImage } from "./responsive-remote-image";

describe("ResponsiveRemoteImage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders bypassed volatile canonical media without redundant srcSet entries in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const markup = renderToStaticMarkup(
      <ResponsiveRemoteImage
        alt="Telegram photo"
        height={720}
        preset="thought-photo"
        src="https://cdn5.telesco.pe/file/example-photo.jpg"
        width={1280}
      />,
    );

    expect(markup).toContain('src="/media/');
    expect(markup).toContain("?u=");
    expect(markup).not.toContain("srcSet=");
  });

  it("preserves responsive srcSet for stable transform-allowed hosts in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const markup = renderToStaticMarkup(
      <ResponsiveRemoteImage
        alt="X photo"
        height={720}
        preset="article-card"
        src="https://pbs.twimg.com/media/example.jpg"
        width={1280}
      />,
    );

    expect(markup).toContain("srcSet=");
    expect(markup).toContain("pbs.twimg.com");
  });
});
