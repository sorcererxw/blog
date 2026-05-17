# Blog2 Shadcn Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge repeated business-page UI in `blog2` onto the existing shadcn/base-nova primitives without changing public page structure.

**Architecture:** Keep page semantics and old-blog migration fidelity inside `src/domains/*`, but replace repeated primitive-like markup with the existing components in `src/components/ui/*`. Execute the work in three slices ordered by risk: `stack` first, then `projects` and `thoughts`, then rich-content blocks in `home` and `article detail`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/base-nova UI primitives, Vitest

**Project Preference Override:** Do not add git staging or commit steps to this plan. The user will decide when to stage and commit.

---

## File Map

### Existing primitives to reuse

- Reference: `web/apps/blog2/src/components/ui/empty.tsx`
- Reference: `web/apps/blog2/src/components/ui/button.tsx`
- Reference: `web/apps/blog2/src/components/ui/select.tsx`
- Reference: `web/apps/blog2/src/components/ui/separator.tsx`
- Reference: `web/apps/blog2/src/components/ui/card.tsx`
- Reference: `web/apps/blog2/src/components/ui/badge.tsx`
- Reference: `web/apps/blog2/src/components/ui/alert.tsx`
- Reference: `web/apps/blog2/src/components/ui/table.tsx`
- Reference: `web/apps/blog2/src/components/ui/field.tsx`

### Stack slice

- Modify: `web/apps/blog2/src/domains/stack/stack-list.tsx`
- Modify: `web/apps/blog2/src/domains/stack/stack-list.test.tsx`
- Reference: `web/apps/blog2/src/domains/stack/stack-list.module.css`

### Projects slice

- Modify: `web/apps/blog2/src/domains/projects/projects-list.tsx`
- Modify: `web/apps/blog2/src/domains/projects/projects-list.test.tsx`
- Reference: `web/apps/blog2/src/domains/projects/projects-list.module.css`

### Thoughts slice

- Modify: `web/apps/blog2/src/domains/thoughts/thoughts-feed.tsx`
- Modify: `web/apps/blog2/src/domains/thoughts/thoughts-feed.test.tsx`
- Reference: `web/apps/blog2/src/domains/thoughts/thoughts-feed.module.css`

### Home rich-block slice

- Modify: `web/apps/blog2/src/domains/home/intro.tsx`
- Modify: `web/apps/blog2/src/domains/home/intro.test.tsx`
- Reference: `web/apps/blog2/src/domains/home/intro.module.css`

### Article detail rich-block slice

- Modify: `web/apps/blog2/src/domains/article/article-detail-view.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-detail-view.test.tsx`
- Reference: `web/apps/blog2/src/domains/article/article-detail-view.module.css`

### Documentation

- Modify: `web/apps/blog2/docs/task-ledger.md`
- Modify: `web/apps/blog2/docs/verification.md`

---

### Task 1: Baseline Primitive Mapping And Coverage

**Files:**
- Reference: `web/apps/blog2/src/components/ui/empty.tsx`
- Reference: `web/apps/blog2/src/components/ui/button.tsx`
- Reference: `web/apps/blog2/src/components/ui/select.tsx`
- Reference: `web/apps/blog2/src/components/ui/separator.tsx`
- Reference: `web/apps/blog2/src/components/ui/card.tsx`
- Reference: `web/apps/blog2/src/components/ui/badge.tsx`
- Reference: `web/apps/blog2/src/components/ui/alert.tsx`
- Reference: `web/apps/blog2/src/components/ui/table.tsx`
- Reference: `web/apps/blog2/src/components/ui/field.tsx`

- [ ] **Step 1: Read the current primitive APIs before touching domain components**

Inspect:

- `web/apps/blog2/src/components/ui/empty.tsx`
- `web/apps/blog2/src/components/ui/select.tsx`
- `web/apps/blog2/src/components/ui/card.tsx`
- `web/apps/blog2/src/components/ui/alert.tsx`
- `web/apps/blog2/src/components/ui/table.tsx`
- `web/apps/blog2/src/components/ui/field.tsx`

- [ ] **Step 2: Refresh the current domain component tests**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx src/domains/projects/projects-list.test.tsx src/domains/thoughts/thoughts-feed.test.tsx src/domains/home/intro.test.tsx src/domains/article/article-detail-view.test.tsx
```

Expected:

- PASS or clearly reveals where assertions are too weak for the convergence work

- [ ] **Step 3: Note missing coverage that must be added before implementation**

Required future assertions:

- stack filter controls remain usable after `Select` migration
- empty states remain present and user-visible after `Empty` migration
- project and thought entries keep stable links and content hierarchy
- home and article rich blocks preserve rendered content semantics after primitive substitution

---

### Task 2: Converge `stack-list` Filters, Empty State, And Entry Chrome

**Files:**
- Modify: `web/apps/blog2/src/domains/stack/stack-list.tsx`
- Modify: `web/apps/blog2/src/domains/stack/stack-list.test.tsx`
- Reference: `web/apps/blog2/src/domains/stack/stack-list.module.css`
- Reference: `web/apps/blog2/src/components/ui/select.tsx`
- Reference: `web/apps/blog2/src/components/ui/button.tsx`
- Reference: `web/apps/blog2/src/components/ui/empty.tsx`
- Reference: `web/apps/blog2/src/components/ui/separator.tsx`
- Reference: `web/apps/blog2/src/components/ui/card.tsx`
- Reference: `web/apps/blog2/src/components/ui/badge.tsx`
- Reference: `web/apps/blog2/src/components/ui/field.tsx`

- [ ] **Step 1: Write failing test coverage for the converged stack controls**

Update `stack-list.test.tsx` to assert:

- the platform and category filters expose trigger controls rather than native `<select>`
- the clear-filters action remains reachable as a button
- the empty state renders a reusable empty-state structure
- stack metadata chips still render with their original values

- [ ] **Step 2: Run the stack test to verify the new assertions fail or expose a coverage gap**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx
```

Expected:

- FAIL or missing assertion coverage before implementation

- [ ] **Step 3: Replace the native filter controls with shadcn field/select composition**

Implement:

- use `Field` plus `Select` for platform and category filters
- preserve the current selected values and `onValueChange` behavior
- keep existing filtering logic unchanged

- [ ] **Step 4: Replace clear action, divider, and empty state with existing primitives**

Implement:

- use `Button` for clear filters
- use `Separator` for the divider
- use `Empty` for the no-results state

- [ ] **Step 5: Converge stack entry chrome toward `Card` and `Badge` where it does not change structure**

Implement:

- use `Card` as the item shell if it does not disrupt the current reading layout
- use `Badge` for lightweight metadata chips where the current chip semantics fit
- preserve links, descriptions, and per-item metadata grouping

- [ ] **Step 6: Run the stack test to verify the slice passes**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx
```

Expected:

- PASS

---

### Task 3: Converge `projects-list` Empty State And Entry Shell

**Files:**
- Modify: `web/apps/blog2/src/domains/projects/projects-list.tsx`
- Modify: `web/apps/blog2/src/domains/projects/projects-list.test.tsx`
- Reference: `web/apps/blog2/src/components/ui/empty.tsx`
- Reference: `web/apps/blog2/src/components/ui/card.tsx`

- [ ] **Step 1: Write failing test coverage for project empty state and entry shell semantics**

Update `projects-list.test.tsx` to assert:

- the empty state is still user-visible and labeled as projects
- each project item still renders the same destination link
- title and description remain in the same visible hierarchy

- [ ] **Step 2: Run the projects test to verify the new assertions fail or expose a coverage gap**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/projects/projects-list.test.tsx
```

Expected:

- FAIL or missing assertion coverage before implementation

- [ ] **Step 3: Replace the empty state with `Empty`**

Implement:

- preserve the current projects labeling and copy
- keep the route-level page intro unchanged

- [ ] **Step 4: Converge each project entry shell toward `Card`**

Implement:

- keep emoji, title, summary, and CTA content intact
- keep external-link behavior intact
- do not change masonry/feed ordering or route-level framing

- [ ] **Step 5: Re-run the projects test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/projects/projects-list.test.tsx
```

Expected:

- PASS

---

### Task 4: Converge `thoughts-feed` Empty State And Reference Blocks

**Files:**
- Modify: `web/apps/blog2/src/domains/thoughts/thoughts-feed.tsx`
- Modify: `web/apps/blog2/src/domains/thoughts/thoughts-feed.test.tsx`
- Reference: `web/apps/blog2/src/components/ui/empty.tsx`
- Reference: `web/apps/blog2/src/components/ui/card.tsx`
- Reference: `web/apps/blog2/src/components/ui/alert.tsx`
- Reference: `web/apps/blog2/src/components/ui/badge.tsx`

- [ ] **Step 1: Write failing test coverage for thought empty state and bookmark/reference rendering**

Update `thoughts-feed.test.tsx` to assert:

- the empty state still presents the thoughts label and summary
- bookmark/reference blocks still render their key text and URLs
- reaction or metadata surfaces remain visible where present

- [ ] **Step 2: Run the thoughts test to verify the new assertions fail or expose a coverage gap**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx
```

Expected:

- FAIL or missing assertion coverage before implementation

- [ ] **Step 3: Replace the empty state with `Empty`**

Implement:

- preserve current thoughts copy and archive framing

- [ ] **Step 4: Converge bookmark/reference blocks toward `Card` or `Alert`**

Implement:

- choose `Card` when the block behaves like a standalone linked reference
- choose `Alert` when the block reads more like an informational callout
- preserve the thought body, reply semantics, and feed structure

- [ ] **Step 5: Use `Badge` for small metadata surfaces only where it preserves meaning**

Implement:

- keep counts and supporting metadata readable
- avoid turning the main thought body into component-library chrome

- [ ] **Step 6: Re-run the thoughts test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx
```

Expected:

- PASS

---

### Task 5: Converge `intro` Rich Blocks Without Changing Reading Flow

**Files:**
- Modify: `web/apps/blog2/src/domains/home/intro.tsx`
- Modify: `web/apps/blog2/src/domains/home/intro.test.tsx`
- Reference: `web/apps/blog2/src/components/ui/alert.tsx`
- Reference: `web/apps/blog2/src/components/ui/table.tsx`
- Reference: `web/apps/blog2/src/components/ui/separator.tsx`
- Reference: `web/apps/blog2/src/components/ui/card.tsx`

- [ ] **Step 1: Write failing test coverage for converged home rich blocks**

Update `intro.test.tsx` to assert:

- callout content still renders in order
- tabular content still renders as a table
- bookmark/reference content still exposes title and destination
- divider blocks still separate content without removing neighbors

- [ ] **Step 2: Run the home intro test to verify the new assertions fail or expose a coverage gap**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/home/intro.test.tsx
```

Expected:

- FAIL or missing assertion coverage before implementation

- [ ] **Step 3: Replace callout, table, divider, and bookmark/reference blocks with existing primitives**

Implement:

- use `Alert` for callout blocks
- use `Table` for rendered tables
- use `Separator` for divider blocks
- use `Card` for bookmark/reference blocks where the linked-reference behavior fits

- [ ] **Step 4: Re-run the home intro test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/home/intro.test.tsx
```

Expected:

- PASS

---

### Task 6: Converge `article-detail-view` Reference Blocks And Dividers

**Files:**
- Modify: `web/apps/blog2/src/domains/article/article-detail-view.tsx`
- Modify: `web/apps/blog2/src/domains/article/article-detail-view.test.tsx`
- Reference: `web/apps/blog2/src/components/ui/separator.tsx`
- Reference: `web/apps/blog2/src/components/ui/card.tsx`

- [ ] **Step 1: Write failing test coverage for article detail divider and reference rendering**

Update `article-detail-view.test.tsx` to assert:

- divider blocks still appear between adjacent content sections
- bookmark/reference blocks still expose title and URL
- overall article heading and reading-body order remains unchanged

- [ ] **Step 2: Run the article detail test to verify the new assertions fail or expose a coverage gap**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/article-detail-view.test.tsx
```

Expected:

- FAIL or missing assertion coverage before implementation

- [ ] **Step 3: Replace divider and reference blocks with existing primitives**

Implement:

- use `Separator` for divider blocks
- use `Card` for bookmark/reference blocks where the existing block behavior fits
- leave heading hierarchy and body rendering structure untouched

- [ ] **Step 4: Re-run the article detail test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/article/article-detail-view.test.tsx
```

Expected:

- PASS

---

### Task 7: Broader Verification And Documentation

**Files:**
- Modify: `web/apps/blog2/docs/task-ledger.md`
- Modify: `web/apps/blog2/docs/verification.md`

- [ ] **Step 1: Run the targeted domain test suite for all converged slices**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx src/domains/projects/projects-list.test.tsx src/domains/thoughts/thoughts-feed.test.tsx src/domains/home/intro.test.tsx src/domains/article/article-detail-view.test.tsx
```

Expected:

- PASS

- [ ] **Step 2: Run type verification**

Run:

```bash
pnpm --dir web --filter blog2 typecheck
```

Expected:

- PASS

- [ ] **Step 3: Run broader test verification if the touched code interacts across domains**

Run:

```bash
pnpm --dir web --filter blog2 test
```

Expected:

- PASS or a clearly documented unrelated existing blocker

- [ ] **Step 4: Verify affected routes when the local runtime is healthy**

Run:

```bash
curl -i http://localhost:3001/en/stack
curl -i http://localhost:3001/en/projects
curl -i http://localhost:3001/en/thoughts
curl -i http://localhost:3001/en
curl -i http://localhost:3001/en/articles/<known-slug>
```

Expected:

- `200 OK` for verified routes
- response bodies still reflect the original page structure

- [ ] **Step 5: Update the living docs with concrete verification evidence**

Update:

- `web/apps/blog2/docs/task-ledger.md`
- `web/apps/blog2/docs/verification.md`

Record:

- exact commands run
- pass/fail results
- any browser or local-runtime blockers that prevented full route verification
