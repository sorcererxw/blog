import { describe, expect, it } from "vitest";

import { highlightCode } from "./highlight-code";

describe("highlightCode", () => {
  it("highlights curated languages with dual themes through the singleton highlighter", async () => {
    const [tsHtml, goHtml, shHtml] = await Promise.all([
      highlightCode("export const answer: number = 42;", "ts"),
      highlightCode('package main\nfunc main() { println("hi") }', "go"),
      highlightCode("echo hello", "sh"),
    ]);

    expect(tsHtml).toContain('class="shiki shiki-themes github-light github-dark"');
    expect(goHtml).toContain('class="shiki shiki-themes github-light github-dark"');
    expect(shHtml).toContain('class="shiki shiki-themes github-light github-dark"');
  });

  it("escapes unknown languages safely without loading extra grammars", async () => {
    const html = await highlightCode("<script>alert(1)</script>", "unknown-lang-xyz");

    expect(html).toBe(
      '<pre class="shiki shiki-themes"><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>',
    );
  });
});
