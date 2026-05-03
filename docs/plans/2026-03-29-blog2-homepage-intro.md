# Blog2 Homepage Intro Implementation Plan

> **For agentic workers:** Use subagent-driven development where possible. Keep the homepage slice independent from `article`, `thoughts`, and `projects` workstreams.

**Goal:** Ship the first `blog2` homepage slice at `web/apps/blog2/app/[lang]/page.tsx` as a focused hero/intro page.

**Architecture:** Start with the smallest useful homepage surface: a language-aware intro hero, short supporting copy, and stable navigation cues. Do not add latest-content previews yet. That keeps the first homepage slice independent from article/project data contracts and lets the public-read work continue in parallel.

**Hard Constraint:** Do not use `api-client` imports or any protobuf/pb-generated types in `blog2`. Public pages should prefer static generation when feasible, so the homepage intro should be designed to render as SSG unless a later requirement forces it dynamic.

**Why hero-only first:** The legacy homepage is effectively a content-led intro surface, but the moment we introduce previews we couple the homepage to article/project feeds before those slices are stable. A standalone hero/intro proves route rendering, locale wiring, and public-facing layout with minimal dependency risk.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, existing locale shell, Vitest, `curl`, browser verification

---

### Task 1: Define the homepage intro contract

**Files:**
- Create: `web/apps/blog2/src/domains/home/types.ts`
- Create: `web/apps/blog2/src/domains/home/home-hero.tsx`
- Create: `web/apps/blog2/src/domains/home/home-hero.test.tsx`
- Modify: `web/apps/blog2/docs/task-ledger.md` when the implementation phase starts

- [ ] **Step 1: Inspect only the legacy homepage intro surface**

Use the old homepage entry as behavioral reference:

- `web/apps/blog/app/[lang]/page.tsx`
- `web/apps/blog/components/block-list.tsx`
- `web/apps/blog/components/header.tsx`
- `web/apps/blog/components/footer.tsx`

Extract only what matters for the first slice:

- language-aware homepage entry
- intro/hero content as the main surface
- top-level navigation cues
- no latest content preview requirement

- [ ] **Step 2: Write the failing homepage hero test**

Create `src/domains/home/home-hero.test.tsx` for the app-native hero component.

The test should cover at least:

- headline and supporting intro copy render
- primary call-to-action links are visible
- the intro shell does not depend on article or thoughts data

- [ ] **Step 3: Run the narrow test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/home/home-hero.test.tsx
```

Expected:

- failure because the component does not exist yet

- [ ] **Step 4: Implement the minimal hero/intro component**

Add the smallest code needed to make the test pass.

The first version should:

- expose a small homepage intro component
- keep copy and CTA structure local to the homepage
- avoid previewing latest articles/projects in the first cut

- [ ] **Step 5: Re-run the narrow test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/home/home-hero.test.tsx
```

Expected:

- PASS

---

### Task 2: Render the homepage route

**Files:**
- Modify: `web/apps/blog2/app/[lang]/page.tsx`
- Modify: `web/apps/blog2/docs/task-ledger.md`

- [ ] **Step 1: Keep the route thin**

Wire the existing locale-aware page to the hero/intro component without introducing previews or data fetches.

The route should:

- render at `app/[lang]/page.tsx`
- reuse the existing locale shell
- present a real public intro page rather than a placeholder
- be statically generable if the final implementation can avoid per-request data

- [ ] **Step 2: Verify the route locally**

With the dev server running, check:

```bash
curl -I http://localhost:3001/en
```

Expected:

- `200 OK`
- no redirect loop

- [ ] **Step 3: Verify in a browser**

Open `http://localhost:3001/en` and confirm:

- the intro page renders cleanly
- no blocking runtime errors appear
- the page feels like the public landing surface, not a scaffold

- [ ] **Step 4: Record results once implementation starts**

Update `web/apps/blog2/docs/task-ledger.md` with:

- the chosen homepage slice
- files changed
- test and HTTP results
- browser verification outcome
- follow-up scope for project previews if needed later

---

### Task 3: Keep the verification loop narrow

**Files:**
- Modify: `web/apps/blog2/docs/verification.md`

- [ ] **Step 1: Update verification guidance**

Add the actual commands used for the homepage intro slice:

- targeted Vitest runs for the homepage hero component
- `pnpm --dir web --filter blog2 lint`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl -I http://localhost:3001/en`
- browser verification for `/en`

- [ ] **Step 2: Do not widen the slice**

Do not add article previews, project previews, or other homepage content until a separate plan explicitly requires them.
