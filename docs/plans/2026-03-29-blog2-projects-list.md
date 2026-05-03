# Blog2 Projects List Implementation Plan

> **For agentic workers:** Use subagent-driven development where possible. Keep the projects slice independent from article, thoughts, and homepage workstreams.

**Goal:** Ship the first `blog2` projects slice at `web/apps/blog2/app/[lang]/projects/page.tsx` as a dedicated projects listing page.

**Architecture:** Start with the smallest useful projects surface: locale-aware route, project title/description, and a responsive grid or masonry-style list. Do not couple this first slice to homepage previews or article/thoughts content.

**Hard Constraint:** Do not use `api-client` imports or any protobuf/pb-generated types in `blog2`. Prefer static generation for the projects page when the content source allows it, and only make it dynamic if a later requirement proves that necessary.

**Why projects as a separate track:** The legacy projects page is a self-contained public list with its own title, description, and card layout. That makes it a good parallel workstream that can be built without waiting for article detail or thoughts rendering.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, existing locale shell, Vitest, `curl`, browser verification

---

### Task 1: Define the projects-list contract

**Files:**
- Create: `web/apps/blog2/src/domains/project/types.ts`
- Create: `web/apps/blog2/src/domains/project/list-projects.ts`
- Create: `web/apps/blog2/src/domains/project/list-projects.test.ts`
- Create: `web/apps/blog2/src/domains/project/project-list.tsx`
- Create: `web/apps/blog2/src/domains/project/project-list.test.tsx`

- [ ] **Step 1: Inspect only the legacy projects surface**

Use the old projects page as the behavioral reference:

- `web/apps/blog/app/[lang]/projects/page.tsx`
- only the directly imported local helpers if needed

Extract the smallest useful behavior set:

- locale-aware projects title and description
- project cards with title, emoji, and description
- outbound links to the project URL
- responsive grid/masonry presentation

- [ ] **Step 2: Write the failing domain test**

Create `src/domains/project/list-projects.test.ts` for the app-native list contract.

The test should cover at least:

- project entries are preserved in their input order unless the legacy behavior requires sorting
- the public shape contains `title`, `emoji`, `description`, and `url`
- empty lists are handled explicitly

- [ ] **Step 3: Run the narrow test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/project/list-projects.test.ts
```

Expected:

- failure because the use case and adapter do not exist yet

- [ ] **Step 4: Implement the minimal domain layer**

Add the smallest code needed to make the test pass.

The first version should:

- expose a `listProjects` use case
- normalize project records into a blog2-native list shape
- keep external integration details behind an adapter boundary

- [ ] **Step 5: Re-run the narrow test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/project/list-projects.test.ts
```

Expected:

- PASS

---

### Task 2: Render the public projects page

**Files:**
- Create: `web/apps/blog2/app/[lang]/projects/page.tsx`
- Modify: `web/apps/blog2/docs/task-ledger.md` when implementation starts

- [ ] **Step 1: Write the failing rendering test**

Create `src/domains/project/project-list.test.tsx` for the public-facing project list component.

The test should verify:

- cards render title, emoji, and description
- links point to the project URL
- empty state is explicit if no projects exist

- [ ] **Step 2: Run the component test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/project/project-list.test.tsx
```

Expected:

- failure because the view component does not exist yet

- [ ] **Step 3: Implement the page and view**

Create the projects page and connect it to the project list use case.

The first version should:

- render at `app/[lang]/projects/page.tsx`
- reuse the existing locale shell
- render a real projects list from the new domain use case
- keep page logic thin and push card rendering into the view layer
- use SSG if the list can be resolved without per-request mutation

- [ ] **Step 4: Re-run the component test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/project/project-list.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: Verify the route locally**

With the dev server running, check:

```bash
curl -I http://localhost:3001/en/projects
```

Expected:

- `200 OK`
- the page is reachable without redirect loops or runtime errors

- [ ] **Step 6: Verify in a browser**

Open `http://localhost:3001/en/projects` and confirm:

- the projects list renders
- no blocking console/runtime errors appear
- the route feels like a real public content page

---

### Task 3: Keep the verification loop narrow

**Files:**
- Modify: `web/apps/blog2/docs/verification.md`

- [ ] **Step 1: Update verification guidance**

Add the actual commands used for the projects slice:

- targeted Vitest runs for the project domain and view
- `pnpm --dir web --filter blog2 lint`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl -I http://localhost:3001/en/projects`
- browser verification for `/en/projects`

- [ ] **Step 2: Do not widen the slice**

Do not add homepage previews, article previews, or thoughts content to this track.
