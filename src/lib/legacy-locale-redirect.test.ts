import { describe, expect, it } from "vitest";

import { getLegacyLocaleRedirect } from "./legacy-locale-redirect";

describe("getLegacyLocaleRedirect", () => {
  it("redirects locale roots to the canonical home page", () => {
    expect(getLegacyLocaleRedirect(undefined)).toBe("/");
    expect(getLegacyLocaleRedirect("")).toBe("/");
  });

  it("preserves nested paths while stripping the locale prefix", () => {
    expect(getLegacyLocaleRedirect("blog")).toBe("/blog");
    expect(getLegacyLocaleRedirect("articles/hello-world")).toBe("/articles/hello-world");
    expect(getLegacyLocaleRedirect("/projects")).toBe("/projects");
  });
});
