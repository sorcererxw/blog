import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const stylesDir = __dirname;
const globalsCssPath = join(stylesDir, "globals.css");
const layoutPath = join(stylesDir, "../layouts/SiteLayout.astro");

describe("scroll behavior configuration", () => {
  it("does not enable smooth scrolling for the full document", () => {
    const globalsCss = readFileSync(globalsCssPath, "utf8");
    const layoutSource = readFileSync(layoutPath, "utf8");

    expect(globalsCss).not.toMatch(/html\s*\{[\s\S]*scroll-smooth/);
    expect(layoutSource).not.toContain('data-scroll-behavior="smooth"');
  });

  it("keeps smooth scrolling scoped to anchor targets", () => {
    const globalsCss = readFileSync(globalsCssPath, "utf8");

    expect(globalsCss).toMatch(/html:has\(:target\)\s*\{[\s\S]*scroll-behavior:\s*smooth;/);
  });
});
