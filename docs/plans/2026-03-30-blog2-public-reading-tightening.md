# Blog2 Public Reading Tightening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the public `blog2` reading experience by removing extra marketing copy, simplifying navigation, improving reading contrast, and refining page spacing without changing the underlying content routes.

**Architecture:** Keep the route tree intact and execute this as a focused presentation-layer cleanup. Update shell navigation and metadata first, then shrink archive and projects framing, then improve article detail readability and return behavior. Reuse the existing runtime config to hide the stack entry in production instead of introducing new config.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS modules, Tailwind utilities already present in `blog2`, Vitest, browser verification

---

## File Map

- Modify: `web/apps/blog2/src/app/layout.tsx`
- Modify: `web/apps/blog2/src/app/globals.css`
- Modify: `web/apps/blog2/src/app/[lang]/page.tsx`
- Modify: `web/apps/blog2/src/domains/shell/site-header.tsx`
- Modify: `web/apps/blog2/src/domains/shell/site-footer.tsx`
- Modify: `web/apps/blog2/src/domains/shell/site-links.ts`
- Test: `web/apps/blog2/src/domains/shell/site-shell.test.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-list.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-list.module.css`
- Test: `web/apps/blog2/src/domains/article/article-list.test.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-detail-view.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-detail-view.module.css`
- Test: `web/apps/blog2/src/domains/article/article-detail-view.test.tsx`
- Modify: `web/apps/blog2/src/domains/projects/projects-list.tsx`
- Modify: `web/apps/blog2/src/domains/projects/projects-list.module.css`
- Test: `web/apps/blog2/src/domains/projects/projects-list.test.tsx`

### Task 1: Lock the desired shell and metadata behavior with tests

**Files:**
- Test: `web/apps/blog2/src/domains/shell/site-shell.test.tsx`
- Test: `web/apps/blog2/src/domains/article/article-list.test.tsx`
- Test: `web/apps/blog2/src/domains/article/article-detail-view.test.tsx`
- Test: `web/apps/blog2/src/domains/projects/projects-list.test.tsx`

- [ ] **Step 1: Write failing shell expectations**
  Verify header only exposes home/blog plus non-prod stack, footer owns locale switching, and footer copy matches `sorcererxw`.
- [ ] **Step 2: Write failing archive, article detail, and projects expectations**
  Verify archive heading copy is removed, article comments area is removed, and projects heading copy is removed.
- [ ] **Step 3: Run the focused test set and confirm failures**
  Run: `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx src/domains/article/article-list.test.tsx src/domains/article/article-detail-view.test.tsx src/domains/projects/projects-list.test.tsx`

### Task 2: Implement the public-surface tightening changes

**Files:**
- Modify: `web/apps/blog2/src/app/layout.tsx`
- Modify: `web/apps/blog2/src/app/globals.css`
- Modify: `web/apps/blog2/src/app/[lang]/page.tsx`
- Modify: `web/apps/blog2/src/domains/shell/site-header.tsx`
- Modify: `web/apps/blog2/src/domains/shell/site-footer.tsx`
- Modify: `web/apps/blog2/src/domains/shell/site-links.ts`
- Modify: `web/apps/blog2/src/domains/article/article-list.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-list.module.css`
- Modify: `web/apps/blog2/src/domains/article/article-detail-view.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-detail-view.module.css`
- Modify: `web/apps/blog2/src/domains/projects/projects-list.tsx`
- Modify: `web/apps/blog2/src/domains/projects/projects-list.module.css`

- [ ] **Step 1: Update global metadata and shared page width**
  Align the browser tab title with `sorcererxw'blog` and tighten wide/narrow page padding.
- [ ] **Step 2: Simplify header/footer navigation**
  Remove thoughts/projects from public nav, move locale switching to footer, and hide stack in production.
- [ ] **Step 3: Remove extra marketing copy from home, archive, and projects**
  Keep routes alive but strip the requested heading/summary blocks.
- [ ] **Step 4: Improve article detail readability**
  Remove comments end matter and darken reading text while preserving the back link.
- [ ] **Step 5: Tighten projects card internal spacing**
  Reduce internal padding/leave better rhythm without changing the feed model.

### Task 3: Re-run focused verification and spot-check in a browser

**Files:**
- Modify if needed: `web/apps/blog2/docs/task-ledger.md`

- [ ] **Step 1: Re-run the focused tests**
  Run the same targeted Vitest command and confirm all pass.
- [ ] **Step 2: Verify the rendered pages in a browser**
  Check `/en`, `/en/blog`, `/en/articles/<slug>`, and `/en/projects` for spacing, footer locale switching, and article readability.
