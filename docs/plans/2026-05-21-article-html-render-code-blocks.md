# Article HTML Render Code Blocks Plan

## Goal

Allow authored article detail pages to render selected Notion HTML code blocks inline when the block starts with `<!--render-->`.

## Scope

- Article detail Notion normalization.
- Article detail code block rendering.
- Targeted tests and HTTP/browser verification for `/articles/screenshot-render`.

## Plan

1. Mark only `html` language Notion code blocks whose text starts with `<!--render-->` as `renderHtml`.
2. Keep all other code blocks on the existing highlighted-code path.
3. Render marked blocks through the existing article body HTML injection path.
4. Verify with targeted tests, typecheck, build, HTTP inspection, and browser rendering.

## Out of Scope

- Rendering arbitrary code block languages as HTML.
- Adding a sanitizer or public user-authored HTML pipeline.
- Changing Profile Hero code block rendering.
