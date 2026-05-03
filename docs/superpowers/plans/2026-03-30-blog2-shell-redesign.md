# Blog2 Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `blog2` header and footer so the public shell exposes `Thoughts` and `Projects`, aligns the header vertically, removes the `Colophon` label, and gives the footer a cleaner grouped layout.

**Architecture:** Keep the change inside the existing shell slice. Update the shared route/link definitions first, then make the header and footer consume those definitions with the new grouped structure. Protect the behavior with the existing `site-shell.test.tsx` server-render test instead of adding a new test surface.

**Tech Stack:** Next.js App Router, React server/client components, Tailwind utility classes, Vitest, React DOM server rendering

---

### Task 1: Lock the new shell behavior in tests

**Files:**
- Modify: `web/apps/blog2/src/domains/shell/site-shell.test.tsx`
- Reference: `web/apps/blog2/src/domains/shell/site-links.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx` and confirm it fails for the new header/footer expectations**
- [ ] **Step 3: Update the header/footer assertions for the approved navigation and footer grouping**
- [ ] **Step 4: Re-run the same test command and confirm the new assertions still fail until implementation lands**

### Task 2: Implement the shared shell link model

**Files:**
- Modify: `web/apps/blog2/src/domains/shell/site-links.ts`
- Test: `web/apps/blog2/src/domains/shell/site-shell.test.tsx`

- [ ] **Step 1: Expand `getPublicRoutes` to include `Thoughts` and `Projects`**
- [ ] **Step 2: Replace the footer’s flat link list with grouped route/external sections while keeping stack production gating**
- [ ] **Step 3: Re-run `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx` and confirm failures move to render details**

### Task 3: Implement the redesigned header and footer

**Files:**
- Modify: `web/apps/blog2/src/domains/shell/site-header.tsx`
- Modify: `web/apps/blog2/src/domains/shell/site-footer.tsx`
- Test: `web/apps/blog2/src/domains/shell/site-shell.test.tsx`

- [ ] **Step 1: Update the header layout to use centered alignment and the full public navigation**
- [ ] **Step 2: Update the footer to remove `Colophon`, render `Browse` and `Elsewhere` groups, and keep the copyright on its own line**
- [ ] **Step 3: Run `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx` until it passes**

### Task 4: Verify the slice

**Files:**
- Test: `web/apps/blog2/src/domains/shell/site-shell.test.tsx`

- [ ] **Step 1: Run `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx`**
- [ ] **Step 2: Report the exact verification result before claiming completion**
