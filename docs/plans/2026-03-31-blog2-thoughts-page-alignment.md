# Blog2 Thoughts Page Alignment Implementation Plan

> **For agentic workers:** Execute this plan in order. Use TDD for every behavior change. Do not commit unless the owner asks.

**Goal:** Align `blog2` `/thoughts` with the old `blog` thoughts experience while collapsing the Telegram presentation layer into the route file itself.

**Architecture:** Keep the current direct Telegram read path and page-level cache behavior, but delete the separate `thoughts-feed` UI layer. Rebuild the old-blog-style message-card semantics inside `src/app/thoughts/page.tsx`, and only extend Telegram normalization where page rendering requires more complete data.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, OpenNext Cloudflare, native Telegram normalization in `src/integrations/telegram/*`

---

### Task 1: Define the page-owned rendering contract

**Files:**
- Modify: `web/apps/blog2/src/app/thoughts/page.test.ts`
- Modify: `web/apps/blog2/src/app/thoughts/page.tsx`
- Reference: `web/apps/blog/app/[lang]/thoughts/page.tsx`

- [ ] **Step 1: Write failing page tests for the old-blog-aligned structure**

Add or update tests so they prove:

- `/thoughts` renders old-blog-style message cards instead of the current simplified article list
- each card exposes stable local anchor ids
- whole-card Telegram linking is present
- reply preview behavior is represented in the route output

- [ ] **Step 2: Run the narrow page test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts
```

Expected:

- failure because the current page still renders the simplified direct-read card layout

- [ ] **Step 3: Implement the minimal route-local rendering structure**

Update `src/app/thoughts/page.tsx` so:

- the page owns masonry rendering directly
- local helpers replace the deleted `thoughts-feed` abstraction
- whole-card link and local-anchor semantics are introduced with valid markup

- [ ] **Step 4: Re-run the page test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts
```

Expected:

- PASS

### Task 2: Restore rich Telegram content rendering

**Files:**
- Modify: `web/apps/blog2/src/app/thoughts/page.tsx`
- Modify: `web/apps/blog2/src/app/thoughts/page.test.ts`
- Modify: `web/apps/blog2/src/integrations/telegram/thoughts.ts`
- Modify: `web/apps/blog2/src/integrations/telegram/thoughts.test.ts`

- [ ] **Step 1: Write failing tests for rich content behavior**

Add or update tests so they prove:

- rich-text flags render correctly
- quote handling stays structurally valid
- webpage previews, forwarded labels, photos, and reactions render in the page output
- reply previews resolve against local lookup data

- [ ] **Step 2: Run the relevant tests to verify they fail**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts
```

Expected:

- failure because current route rendering and possibly normalization do not yet cover the required semantics

- [ ] **Step 3: Implement the minimal rendering and normalization changes**

Change the code so that:

- route-local rich-text rendering matches the old-blog semantics as closely as practical
- normalized Telegram data exposes any missing fields needed by the page
- reply previews, webpage blocks, photos, forwarded labels, and reactions render inside the page

- [ ] **Step 4: Re-run the relevant tests**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts
```

Expected:

- PASS

### Task 3: Remove the old UI abstraction

**Files:**
- Delete: `web/apps/blog2/src/domains/thoughts/thoughts-feed.tsx`
- Delete: `web/apps/blog2/src/domains/thoughts/thoughts-feed.test.tsx`
- Modify: any files that still import `thoughts-feed`

- [ ] **Step 1: Confirm replacement coverage exists in page tests**

Before deleting the component, ensure page tests now cover:

- empty state
- masonry card rendering
- rich content behavior

- [ ] **Step 2: Delete the old component and test**

Remove the abandoned `thoughts-feed` files and clean up remaining imports.

- [ ] **Step 3: Run the affected test set**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts
```

Expected:

- PASS

### Task 4: Verify the slice and refresh docs

**Files:**
- Modify: `web/apps/blog2/docs/task-ledger.md`
- Modify: `web/apps/blog2/docs/verification.md`
- Modify: `web/apps/blog2/docs/roadmap.md` only if milestone framing changes

- [ ] **Step 1: Run targeted verification**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts
pnpm --dir web --filter blog2 typecheck
```

Expected:

- PASS

- [ ] **Step 2: Verify the route over HTTP**

Run:

```bash
curl -I http://localhost:3001/thoughts
curl -s http://localhost:3001/thoughts
```

Expected:

- `200 OK`
- HTML reflects the aligned `/thoughts` structure or the explicit empty state

- [ ] **Step 3: Verify in a browser if available**

Confirm:

- the masonry page renders without runtime errors
- whole-card navigation works
- reply anchors resolve correctly
- rich Telegram content appears without structural regressions

- [ ] **Step 4: Update living docs**

Record:

- that Telegram presentation is now page-owned in `/thoughts`
- that `thoughts-feed` was removed
- exact verification evidence and any browser blockers

- [ ] **Step 5: Do not commit yet**

Leave the worktree uncommitted until the owner explicitly asks.
