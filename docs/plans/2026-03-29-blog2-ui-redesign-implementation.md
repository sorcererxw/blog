# Blog2 UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public `blog2` pages so their structure matches `web/apps/blog`, while preserving the `blog2` data flow, routes, and component boundaries.

**Architecture:** Execute the redesign as a structural migration, not a visual reinterpretation. First shrink `globals.css` back to foundation-only rules and rebuild the shared shell to match the old blog. Then port the old home, archive, article, and masonry page structures into focused `blog2` components. Shared page patterns such as the thoughts/projects masonry must become reusable components instead of more global CSS.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, existing Notion adapters, existing KV-backed read models, Vitest, `curl`, browser verification

**Project Preference Override:** Do not add git staging or commit steps to this plan. The user will decide when to stage and commit.

---

## File Map

### Legacy reference files

- Reference: `web/apps/blog/app/[lang]/layout.tsx`
- Reference: `web/apps/blog/app/[lang]/page.tsx`
- Reference: `web/apps/blog/app/[lang]/blog/page.tsx`
- Reference: `web/apps/blog/app/[lang]/blog/list.tsx`
- Reference: `web/apps/blog/app/[lang]/thoughts/page.tsx`
- Reference: `web/apps/blog/app/[lang]/projects/page.tsx`
- Reference: `web/apps/blog/app/[lang]/stack/page.tsx`
- Reference: `web/apps/blog/app/[lang]/articles/[slug]/page.tsx`
- Reference: `web/apps/blog/app/[lang]/articles/[slug]/view.tsx`
- Reference: `web/apps/blog/components/header.tsx`
- Reference: `web/apps/blog/components/footer.tsx`
- Reference: `web/apps/blog/components/masonry.tsx`
- Reference: `web/apps/blog/app/[lang]/global.css`

### Shared system and shell

- Modify: `web/apps/blog2/src/app/globals.css`
  - Keep only theme tokens, font variables, reset/base rules, and truly global utilities.
- Modify: `web/apps/blog2/src/app/[lang]/layout.tsx`
  - Keeps route layout thin while mounting the copied public shell structure.
- Modify: `web/apps/blog2/src/domains/shell/site-header.tsx`
  - Rebuilds the old blog header structure in `blog2`.
- Modify: `web/apps/blog2/src/domains/shell/site-footer.tsx`
  - Rebuilds the old blog footer structure in `blog2`.
- Modify: `web/apps/blog2/src/domains/shell/site-links.ts`
  - Keeps route/locale metadata aligned with the copied shell.
- Test: `web/apps/blog2/src/domains/shell/site-shell.test.tsx`

### Home

- Modify: `web/apps/blog2/src/app/[lang]/page.tsx`
  - Keeps the route thin while adopting the old home structure.
- Modify: `web/apps/blog2/src/domains/home/intro.tsx`
  - Rebuilds the old homepage content framing using current Notion-backed content.
- Test: `web/apps/blog2/src/domains/home/intro.test.tsx`

### Blog archive and article detail

- Modify: `web/apps/blog2/src/app/[lang]/blog/page.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-list.tsx`
- Test: `web/apps/blog2/src/domains/article/article-list.test.tsx`
- Modify: `web/apps/blog2/src/app/[lang]/articles/[slug]/page.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-detail-view.tsx`
- Test: `web/apps/blog2/src/domains/article/article-detail-view.test.tsx`

### Thoughts, projects, stack

- Create or Modify: `web/apps/blog2/src/domains/feed/masonry-feed.tsx`
  - Shared masonry structure copied from the old blog for thoughts and projects.
- Modify: `web/apps/blog2/src/app/[lang]/thoughts/page.tsx`
- Modify: `web/apps/blog2/src/domains/thoughts/thoughts-feed.tsx`
- Test: `web/apps/blog2/src/domains/thoughts/thoughts-feed.test.tsx`
- Modify: `web/apps/blog2/src/app/[lang]/projects/page.tsx`
- Modify: `web/apps/blog2/src/domains/projects/projects-list.tsx`
- Test: `web/apps/blog2/src/domains/projects/projects-list.test.tsx`
- Modify: `web/apps/blog2/src/app/[lang]/stack/page.tsx`
- Modify: `web/apps/blog2/src/domains/stack/stack-list.tsx`
- Test: `web/apps/blog2/src/domains/stack/stack-list.test.tsx`

### Edge surfaces and docs

- Modify: `web/apps/blog2/src/app/not-found.tsx`
- Modify: `web/apps/blog2/src/app/error.tsx`
- Modify: `web/apps/blog2/docs/task-ledger.md`
- Modify: `web/apps/blog2/docs/verification.md`
- Modify: `web/apps/blog2/docs/roadmap.md` if sequencing or milestone framing changes

---

### Task 1: Reset `globals.css` and re-establish shell ownership

**Files:**
- Reference: `web/apps/blog/app/[lang]/global.css`
- Reference: `web/apps/blog/components/header.tsx`
- Reference: `web/apps/blog/components/footer.tsx`
- Modify: `web/apps/blog2/src/app/globals.css`
- Modify: `web/apps/blog2/src/domains/shell/site-header.tsx`
- Modify: `web/apps/blog2/src/domains/shell/site-footer.tsx`
- Modify: `web/apps/blog2/src/domains/shell/site-links.ts`
- Test: `web/apps/blog2/src/domains/shell/site-shell.test.tsx`

- [ ] **Step 1: Read the old shell and current shell side-by-side**

Inspect:

- `web/apps/blog/components/header.tsx`
- `web/apps/blog/components/footer.tsx`
- `web/apps/blog/app/[lang]/layout.tsx`
- `web/apps/blog2/src/app/[lang]/layout.tsx`
- `web/apps/blog2/src/domains/shell/site-header.tsx`
- `web/apps/blog2/src/domains/shell/site-footer.tsx`
- `web/apps/blog2/src/app/globals.css`

- [ ] **Step 2: Write failing shell tests for copied structure**

Update `site-shell.test.tsx` to verify:

- the header renders the site mark and public navigation
- the current route still exposes `aria-current`
- locale switching remains present and usable
- the footer renders a compact colophon-style block

- [ ] **Step 3: Run the shell test to confirm failure or missing coverage**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx
```

Expected:

- FAIL or clearly incomplete coverage for the copied structure

- [ ] **Step 4: Strip `globals.css` down to foundation-only rules**

Implement:

- keep tokens, fonts, base elements, and minimal global utilities
- remove route-specific and surface-specific structural classes from `globals.css`
- move shell-specific structure into shell components

- [ ] **Step 5: Rebuild header and footer structure in their own components**

Implement:

- copy the old blog shell structure into `SiteHeader` and `SiteFooter`
- adapt old navigation to current `site-links` and locale routing
- preserve accessible current-route state

- [ ] **Step 6: Re-run the shell test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx
```

Expected:

- PASS

---

### Task 2: Copy the old homepage structure into `blog2`

**Files:**
- Reference: `web/apps/blog/app/[lang]/page.tsx`
- Modify: `web/apps/blog2/src/app/[lang]/page.tsx`
- Modify: `web/apps/blog2/src/domains/home/intro.tsx`
- Test: `web/apps/blog2/src/domains/home/intro.test.tsx`

- [ ] **Step 1: Read the old home route and the current `blog2` home**

Inspect:

- `web/apps/blog/app/[lang]/page.tsx`
- `web/apps/blog2/src/app/[lang]/page.tsx`
- `web/apps/blog2/src/domains/home/intro.tsx`

- [ ] **Step 2: Write failing home tests around old-page structure**

Update `intro.test.tsx` to verify:

- the page behaves as direct content-first rendering, not hero-first composition
- Notion-backed blocks still render in content order
- no extra marketing-style wrapper or side rail is introduced

- [ ] **Step 3: Run the home test to confirm failure or coverage gap**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/home/intro.test.tsx
```

Expected:

- FAIL or missing assertions

- [ ] **Step 4: Rebuild the homepage structure**

Implement:

- route remains thin
- `intro.tsx` copies the old home composition pattern
- current Notion content remains the primary body
- styling stays local to the home component instead of `globals.css`

- [ ] **Step 5: Re-run the home test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/home/intro.test.tsx
```

Expected:

- PASS

- [ ] **Step 6: Verify the page over HTTP**

Run:

```bash
curl -i http://localhost:3001/en
```

Expected:

- `200 OK`
- page HTML reflects a content-first home route

---

### Task 3: Copy the old blog archive structure

**Files:**
- Reference: `web/apps/blog/app/[lang]/blog/page.tsx`
- Reference: `web/apps/blog/app/[lang]/blog/list.tsx`
- Modify: `web/apps/blog2/src/app/[lang]/blog/page.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-list.tsx`
- Test: `web/apps/blog2/src/domains/article/article-list.test.tsx`

- [ ] **Step 1: Read the old archive page and list**

Inspect:

- `web/apps/blog/app/[lang]/blog/page.tsx`
- `web/apps/blog/app/[lang]/blog/list.tsx`
- `web/apps/blog2/src/app/[lang]/blog/page.tsx`
- `web/apps/blog2/src/domains/article/article-list.tsx`

- [ ] **Step 2: Write failing archive tests for copied structure**

Update `article-list.test.tsx` to verify:

- page heading block exists in the route
- article entries keep the copied old archive hierarchy
- summaries only appear if the old archive structure requires them
- output ordering and links remain stable

- [ ] **Step 3: Run the archive test to confirm failure or coverage gap**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/article-list.test.tsx
```

Expected:

- FAIL or missing assertions

- [ ] **Step 4: Rebuild archive route and list structure**

Implement:

- route-level heading and shell positioning copied from the old page
- article list structure copied from the old archive
- current article data source preserved
- all archive styling stays in route/domain-local components

- [ ] **Step 5: Re-run the archive test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/article-list.test.tsx
```

Expected:

- PASS

- [ ] **Step 6: Verify the archive page over HTTP**

Run:

```bash
curl -i http://localhost:3001/en/blog
```

Expected:

- `200 OK`
- archive page renders the copied structure

---

### Task 4: Copy the old article detail structure

**Files:**
- Reference: `web/apps/blog/app/[lang]/articles/[slug]/page.tsx`
- Reference: `web/apps/blog/app/[lang]/articles/[slug]/view.tsx`
- Modify: `web/apps/blog2/src/app/[lang]/articles/[slug]/page.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-detail-view.tsx`
- Test: `web/apps/blog2/src/domains/article/article-detail-view.test.tsx`

- [ ] **Step 1: Read the old article route and view**

Inspect:

- `web/apps/blog/app/[lang]/articles/[slug]/page.tsx`
- `web/apps/blog/app/[lang]/articles/[slug]/view.tsx`
- `web/apps/blog2/src/app/[lang]/articles/[slug]/page.tsx`
- `web/apps/blog2/src/domains/article/article-detail-view.tsx`

- [ ] **Step 2: Write failing article-detail tests**

Update `article-detail-view.test.tsx` to verify:

- title and metadata block order match the copied page structure
- Notion blocks still render under the copied article body skeleton
- end-matter or comments placement stays in the expected position

- [ ] **Step 3: Run the article-detail test to confirm failure or coverage gap**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/article-detail-view.test.tsx
```

Expected:

- FAIL or missing assertions

- [ ] **Step 4: Rebuild the article detail structure**

Implement:

- route stays thin
- article view copies the old structural ordering
- current article data and Notion rendering remain intact
- article-specific styling stays inside article components

- [ ] **Step 5: Re-run the article-detail test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/article-detail-view.test.tsx
```

Expected:

- PASS

---

### Task 5: Create shared masonry structure for thoughts and projects

**Files:**
- Reference: `web/apps/blog/components/masonry.tsx`
- Reference: `web/apps/blog/app/[lang]/thoughts/page.tsx`
- Reference: `web/apps/blog/app/[lang]/projects/page.tsx`
- Create or Modify: `web/apps/blog2/src/domains/feed/masonry-feed.tsx`
- Modify: `web/apps/blog2/src/domains/thoughts/thoughts-feed.tsx`
- Modify: `web/apps/blog2/src/domains/projects/projects-list.tsx`
- Test: `web/apps/blog2/src/domains/thoughts/thoughts-feed.test.tsx`
- Test: `web/apps/blog2/src/domains/projects/projects-list.test.tsx`

- [ ] **Step 1: Read the old masonry and both old public pages**

Inspect:

- `web/apps/blog/components/masonry.tsx`
- `web/apps/blog/app/[lang]/thoughts/page.tsx`
- `web/apps/blog/app/[lang]/projects/page.tsx`
- `web/apps/blog2/src/domains/thoughts/thoughts-feed.tsx`
- `web/apps/blog2/src/domains/projects/projects-list.tsx`

- [ ] **Step 2: Write failing tests for shared masonry expectations**

Update tests to verify:

- thoughts and projects use the same masonry container semantics
- entry structure matches each page's old content hierarchy
- the two pages differ only by data-specific fields, not by layout system

- [ ] **Step 3: Run the tests to confirm failure or coverage gap**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx src/domains/projects/projects-list.test.tsx
```

Expected:

- FAIL or missing assertions

- [ ] **Step 4: Build the shared masonry component**

Implement:

- copy the old masonry structure into a reusable `blog2` component
- keep masonry-specific styling local to the new component
- adapt thoughts and projects to render through the shared component

- [ ] **Step 5: Re-run the masonry tests**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx src/domains/projects/projects-list.test.tsx
```

Expected:

- PASS

---

### Task 6: Adapt stack and edge surfaces into the copied public language

**Files:**
- Reference: `web/apps/blog/app/[lang]/stack/page.tsx`
- Modify: `web/apps/blog2/src/app/[lang]/stack/page.tsx`
- Modify: `web/apps/blog2/src/domains/stack/stack-list.tsx`
- Modify: `web/apps/blog2/src/app/not-found.tsx`
- Modify: `web/apps/blog2/src/app/error.tsx`
- Test: `web/apps/blog2/src/domains/stack/stack-list.test.tsx`

- [ ] **Step 1: Read the old stack page and current edge surfaces**

Inspect:

- `web/apps/blog/app/[lang]/stack/page.tsx`
- `web/apps/blog2/src/app/[lang]/stack/page.tsx`
- `web/apps/blog2/src/domains/stack/stack-list.tsx`
- `web/apps/blog2/src/app/not-found.tsx`
- `web/apps/blog2/src/app/error.tsx`

- [ ] **Step 2: Write failing tests for stack structure if coverage is missing**

Update `stack-list.test.tsx` to verify:

- stack keeps a lightweight appendix-like structure
- stack stays visually subordinate to article/archive surfaces

- [ ] **Step 3: Run the stack test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx
```

Expected:

- FAIL or missing assertions

- [ ] **Step 4: Rebuild stack and edge surfaces**

Implement:

- copy the old stack structure where available
- keep stack styling local to stack components
- move not-found and error pages into the same shell language

- [ ] **Step 5: Re-run the stack test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx
```

Expected:

- PASS

---

### Task 7: Final verification and documentation

**Files:**
- Modify: `web/apps/blog2/docs/task-ledger.md`
- Modify: `web/apps/blog2/docs/verification.md`
- Modify: `web/apps/blog2/docs/roadmap.md` if milestone sequencing changes

- [ ] **Step 1: Run focused test suites**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx src/domains/home/intro.test.tsx src/domains/article/article-list.test.tsx src/domains/article/article-detail-view.test.tsx src/domains/thoughts/thoughts-feed.test.tsx src/domains/projects/projects-list.test.tsx src/domains/stack/stack-list.test.tsx
```

Expected:

- PASS

- [ ] **Step 2: Run app-level safety checks**

Run:

```bash
pnpm --dir web --filter blog2 typecheck
pnpm --dir web --filter blog2 build
```

Expected:

- PASS

- [ ] **Step 3: Verify main public routes over HTTP**

Run:

```bash
curl -i http://localhost:3001/en
curl -i http://localhost:3001/en/blog
curl -i http://localhost:3001/en/thoughts
curl -i http://localhost:3001/en/projects
curl -i http://localhost:3001/en/stack
```

Expected:

- all routes return `200 OK`

- [ ] **Step 4: Record results in docs**

Update:

- `web/apps/blog2/docs/task-ledger.md`
- `web/apps/blog2/docs/verification.md`

Record:

- files changed
- final structural decisions
- commands actually run
- browser verification results or blockers
