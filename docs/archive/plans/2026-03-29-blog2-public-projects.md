# Blog2 Public Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first projects slice for `blog2` by rendering a real Notion-backed projects listing at `web/apps/blog2/app/[lang]/projects/page.tsx`.

**Architecture:** Start with the projects list because it is a clean public surface with a small contract: query Notion, normalize project cards, render a public listing, and reuse the existing locale shell. Keep the slice intentionally narrow and avoid project detail pages, admin tooling, or broader infrastructure work until the list page is stable.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Cloudflare KV abstraction, Notion source adapter, `curl`, browser verification

---

### Task 1: Define the projects-list contract and the legacy mapping

**Files:**
- Create: `web/apps/blog2/src/domains/project/types.ts`
- Create: `web/apps/blog2/src/domains/project/list-projects.ts`
- Create: `web/apps/blog2/src/domains/project/list-projects.test.ts`
- Create: `web/apps/blog2/src/integrations/notion/projects.ts`
- Create: `web/apps/blog2/src/integrations/kv/project-cache.ts`

- [ ] **Step 1: Read only the legacy projects surface**

Inspect only the code needed to mirror the first public projects slice:

- `web/apps/blog/app/[lang]/projects/page.tsx`
- `server/app/blog/internal/handler/list_project.go`
- the shared locale/navigation chrome only if needed to confirm route shape

Extract the smallest useful behavior set:

- query projects ordered by period/date descending
- preserve title, description, url, and emoji/icon rendering inputs
- keep detail pages and any admin-oriented behavior out of scope

- [ ] **Step 2: Write the failing domain test**

Create `src/domains/project/list-projects.test.ts` for the app-native project list contract.

The test should cover at least:

- returned projects are ordered newest first
- the public list shape contains `title`, `description`, `url`, and `emoji`
- empty lists are handled explicitly

- [ ] **Step 3: Run the narrow test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/project/list-projects.test.ts
```

Expected:

- failure because the use case and adapter do not exist yet

- [ ] **Step 4: Implement the minimal domain and adapter layer**

Add the smallest code needed to make the test pass.

The first version should:

- expose a `listProjects` use case
- query Notion through an integration adapter
- normalize Notion pages into a blog2-native project list shape
- keep KV behind a storage abstraction even if the first version only uses cache lookup or placeholder interfaces

- [ ] **Step 5: Re-run the narrow test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/project/list-projects.test.ts
```

Expected:

- PASS

### Task 2: Render the public projects page

**Files:**
- Create: `web/apps/blog2/app/[lang]/projects/page.tsx`
- Create: `web/apps/blog2/src/domains/project/project-list.tsx`
- Create: `web/apps/blog2/src/domains/project/project-list.test.tsx`

- [ ] **Step 1: Write the failing rendering test**

Create `src/domains/project/project-list.test.tsx` for the public-facing projects component.

The test should verify:

- project cards render title, description, and emoji/icon
- outbound links point to the expected project URLs
- the empty state is explicit if no projects exist

- [ ] **Step 2: Run the component test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/project/project-list.test.tsx
```

Expected:

- failure because the view component does not exist yet

- [ ] **Step 3: Implement the page and view**

Create the projects page and connect it to the projects use case.

The first version should:

- render at `app/[lang]/projects/page.tsx`
- reuse the existing locale shell
- render a real projects list from the new domain use case
- keep page logic thin and push mapping into the domain/view layer

- [ ] **Step 4: Re-run the component test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/project/project-list.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: Verify the route locally**

Start or reuse the dev server, then run:

```bash
curl -I http://localhost:3001/en/projects
```

Expected:

- `200 OK`
- the page is reachable without redirect loops or runtime errors

- [ ] **Step 6: Verify in a browser**

Open `http://localhost:3001/en/projects` in a browser and confirm:

- the projects list renders
- no blocking console/runtime errors appear
- the route feels like a real public content page rather than a shell placeholder

### Task 3: Tighten the verification loop

**Files:**
- Modify: `web/apps/blog2/docs/verification.md`

- [ ] **Step 1: Update verification guidance**

Add the actual commands used for the first projects slice:

- targeted Vitest runs for the projects domain and view
- `pnpm --dir web --filter blog2 lint`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl -I http://localhost:3001/en/projects`
- browser verification for `/en/projects`

- [ ] **Step 2: Run the full relevant gate set**

Run:

```bash
pnpm --dir web --filter blog2 test
pnpm --dir web --filter blog2 lint
pnpm --dir web --filter blog2 typecheck
pnpm --dir web --filter blog2 build
```

Expected:

- all commands pass for the projects slice

- [ ] **Step 3: Leave the worktree uncommitted**

Do not commit until the owner requests it.
