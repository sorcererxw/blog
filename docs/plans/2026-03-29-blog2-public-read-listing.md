# Blog2 Public Read Listing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first M2 public-read slice by rendering a real Notion-backed article listing at `web/apps/blog2/app/[lang]/blog/page.tsx`.

**Architecture:** Start with the public article list because it proves the main content pipeline end to end: Notion query, normalization, app-native article model, and rendered public UI. Keep the slice intentionally narrow and avoid article detail, translation, or async job expansion until the list page is stable. Reuse the existing locale shell and introduce the smallest article-domain boundary needed to support later detail and sitemap work.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Cloudflare KV abstraction, Notion adapter, `curl`, browser verification

---

### Task 1: Define the article-listing contract and the legacy mapping

**Files:**
- Create: `web/apps/blog2/src/domains/article/types.ts`
- Create: `web/apps/blog2/src/domains/article/list-articles.ts`
- Create: `web/apps/blog2/src/domains/article/list-articles.test.ts`
- Create: `web/apps/blog2/src/integrations/notion/articles.ts`
- Create: `web/apps/blog2/src/integrations/kv/article-cache.ts`
- Modify: `web/apps/blog2/docs/task-ledger.md`

- [ ] **Step 1: Read only the legacy article-listing path**

Inspect only the code needed to mirror the first public read slice:

- `web/apps/blog/app/[lang]/blog/page.tsx`
- `web/apps/blog/app/[lang]/blog/list.tsx`
- `server/app/blog/internal/handler/query_article.go`
- `server/app/blog/internal/notion/article.go`

Extract the smallest useful behavior set:

- query published articles ordered by date
- preserve slug/title/summary/date/cover/icon rendering inputs
- keep `WIP` exclusion semantics aligned with the old query
- treat translation and article blocks as out of scope for this slice

- [ ] **Step 2: Write the failing domain test**

Create `src/domains/article/list-articles.test.ts` for the app-native article list contract.

The test should cover at least:

- returned articles are ordered newest first
- the public list shape contains slug, title, summary, date, cover, and icon fields
- WIP content is excluded by default

- [ ] **Step 3: Run the narrow test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/list-articles.test.ts
```

Expected:

- failure because the use case and adapter do not exist yet

- [ ] **Step 4: Implement the minimal domain and adapter layer**

Add the smallest code needed to make the test pass.

The first version should:

- expose a `listArticles` use case
- query Notion through an integration adapter
- normalize Notion pages into a blog2-native article list shape
- keep KV behind a storage abstraction even if the first version only uses cache lookup or placeholder interfaces

- [ ] **Step 5: Re-run the narrow test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/list-articles.test.ts
```

Expected:

- PASS

### Task 2: Render the public article listing page

**Files:**
- Create: `web/apps/blog2/app/[lang]/blog/page.tsx`
- Create: `web/apps/blog2/src/domains/article/article-list.tsx`
- Create: `web/apps/blog2/src/domains/article/article-list.test.tsx`
- Modify: `web/apps/blog2/docs/task-ledger.md`

- [ ] **Step 1: Write the failing rendering test**

Create `src/domains/article/article-list.test.tsx` for the public-facing list component.

The test should verify:

- article cards render title, summary, and date
- links point to the expected public path pattern
- the empty state is explicit if no articles exist

- [ ] **Step 2: Run the component test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/article-list.test.tsx
```

Expected:

- failure because the view component does not exist yet

- [ ] **Step 3: Implement the page and view**

Create the list page and connect it to the article use case.

The first version should:

- render at `app/[lang]/blog/page.tsx`
- reuse the existing locale shell
- render a real article list from the new domain use case
- keep page logic thin and push mapping into the domain/view layer

- [ ] **Step 4: Re-run the component test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/article-list.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: Verify the route locally**

Start or reuse the dev server, then run:

```bash
curl -I http://localhost:3001/en/blog
```

Expected:

- `200 OK`
- the page is reachable without redirect loops or runtime errors

- [ ] **Step 6: Verify in a browser**

Open `http://localhost:3001/en/blog` in a browser and confirm:

- the article list renders
- no blocking console/runtime errors appear
- the route feels like a real public content page rather than a shell placeholder

- [ ] **Step 7: Record results in the ledger**

Update `web/apps/blog2/docs/task-ledger.md` with:

- the selected slice
- files changed
- test and HTTP results
- browser verification outcome
- follow-up scope for article detail

### Task 3: Tighten the verification loop and commit

**Files:**
- Modify: `web/apps/blog2/docs/verification.md`
- Modify: `web/apps/blog2/docs/task-ledger.md`

- [ ] **Step 1: Update verification guidance**

Add the actual commands used for the first public-read slice:

- targeted Vitest runs for the article domain and view
- `pnpm --dir web --filter blog2 lint`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl -I http://localhost:3001/en/blog`
- browser verification for `/en/blog`

- [ ] **Step 2: Run the full relevant gate set**

Run:

```bash
pnpm --dir web --filter blog2 test
pnpm --dir web --filter blog2 lint
pnpm --dir web --filter blog2 typecheck
pnpm --dir web --filter blog2 build
```

Expected:

- all commands pass for the public-read listing slice

- [ ] **Step 3: Commit**

```bash
git add web/apps/blog2/src/domains/article web/apps/blog2/src/integrations/notion web/apps/blog2/src/integrations/kv 'web/apps/blog2/app/[lang]/blog/page.tsx' web/apps/blog2/docs/verification.md web/apps/blog2/docs/task-ledger.md
git commit -m "feat: start blog2 public read listing"
```
