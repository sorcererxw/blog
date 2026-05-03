# Blog2 Public Article Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first article-detail slice by rendering a real Notion-backed article detail page at `web/apps/blog2/app/[lang]/articles/[slug]/page.tsx`.

**Architecture:** Start with the public article detail page because it exercises the full content-read path for a single article: slug lookup, Notion fetch, normalization, static generation, and rendered content blocks. Keep the slice intentionally narrow and avoid translation, comments, retranslate, or image metadata expansion until the detail page itself is stable. Reuse the existing locale shell and the article-listing contract, but introduce only the smallest detail-specific boundary needed to support later SEO and content-workflow slices.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Cloudflare KV abstraction, Notion adapter, `curl`, browser verification

---

### Task 1: Define the article-detail contract and the legacy mapping

**Files:**
- Create: `web/apps/blog2/src/domains/article/get-article.ts`
- Create: `web/apps/blog2/src/domains/article/get-article.test.ts`
- Create: `web/apps/blog2/src/integrations/notion/article.ts`
- Create: `web/apps/blog2/src/integrations/kv/article-cache.ts`

- [ ] **Step 1: Read only the legacy article-detail path**

Inspect only the code needed to mirror the first public article-detail slice:

- `web/apps/blog/app/[lang]/articles/[slug]/page.tsx`
- `web/apps/blog/app/[lang]/articles/[slug]/view.tsx`
- `server/app/blog/internal/handler/query_article.go`
- `server/app/blog/internal/notion/article.go`

Extract the smallest useful behavior set:

- resolve a single article by slug
- preserve title, summary, date, cover, icon, and rendered block inputs
- keep WIP exclusion semantics aligned with the old query
- keep translation, comments, and retranslate logic out of scope for this slice

- [ ] **Step 2: Write the failing domain test**

Create `src/domains/article/get-article.test.ts` for the app-native article detail contract.

The test should cover at least:

- returns a single article for a slug
- the public shape contains id, slug, title, summary, date, cover, icon, and blocks
- WIP content is excluded by default
- missing slugs return an explicit empty result

- [ ] **Step 3: Run the narrow test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/get-article.test.ts
```

Expected:

- failure because the use case and adapter do not exist yet

- [ ] **Step 4: Implement the minimal domain and adapter layer**

Add the smallest code needed to make the test pass.

The first version should:

- expose a `getArticleBySlug` use case
- query Notion through an integration adapter
- normalize a single Notion page into a blog2-native article detail shape
- keep KV behind a storage abstraction even if the first version only uses cache lookup or placeholder interfaces

- [ ] **Step 5: Re-run the narrow test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/get-article.test.ts
```

Expected:

- PASS

### Task 2: Render the public article detail page

**Files:**
- Create: `web/apps/blog2/app/[lang]/articles/[slug]/page.tsx`
- Create: `web/apps/blog2/src/domains/article/article-detail.tsx`
- Create: `web/apps/blog2/src/domains/article/article-detail.test.tsx`

- [ ] **Step 1: Write the failing rendering test**

Create `src/domains/article/article-detail.test.tsx` for the public-facing detail component.

The test should verify:

- the page renders title, summary, date, and cover entry points
- block/content rendering is visible in the page structure
- the empty state is explicit if no article exists

- [ ] **Step 2: Run the component test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/article-detail.test.tsx
```

Expected:

- failure because the view component does not exist yet

- [ ] **Step 3: Implement the page and view**

Create the detail page and connect it to the article use case.

The first version should:

- render at `app/[lang]/articles/[slug]/page.tsx`
- reuse the existing locale shell
- render a real article detail page from the new domain use case
- keep page logic thin and push mapping into the domain/view layer

- [ ] **Step 4: Re-run the component test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/article-detail.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: Verify the route locally**

Start or reuse the dev server, then run:

```bash
curl -I http://localhost:3001/en/articles/<slug>
```

Expected:

- `200 OK`
- the page is reachable without redirect loops or runtime errors

- [ ] **Step 6: Verify in a browser**

Open `http://localhost:3001/en/articles/<slug>` in a browser and confirm:

- the article detail renders
- no blocking console/runtime errors appear
- the route feels like a real public content page rather than a shell placeholder

- [ ] **Step 7: Record results in the ledger**

Update `web/apps/blog2/docs/task-ledger.md` with:

- the selected slice
- files changed
- test and HTTP results
- browser verification outcome
- follow-up scope for comments, retranslate, and metadata

### Task 3: Tighten the verification loop

**Files:**
- Modify: `web/apps/blog2/docs/verification.md`

- [ ] **Step 1: Update verification guidance**

Add the actual commands used for the first public-article-detail slice:

- targeted Vitest runs for the article domain and view
- `pnpm --dir web --filter blog2 lint`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl -I http://localhost:3001/en/articles/<slug>`
- browser verification for `/en/articles/<slug>`

- [ ] **Step 2: Run the full relevant gate set**

Run:

```bash
pnpm --dir web --filter blog2 test
pnpm --dir web --filter blog2 lint
pnpm --dir web --filter blog2 typecheck
pnpm --dir web --filter blog2 build
```

Expected:

- all commands pass for the public-article-detail slice

- [ ] **Step 3: Do not commit yet**

Leave the worktree uncommitted until the owner requests a commit.
