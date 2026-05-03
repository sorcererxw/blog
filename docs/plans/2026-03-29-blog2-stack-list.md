# Blog2 Stack List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first `stack` slice for `blog2` by rendering a real public stack listing at `web/apps/blog2/app/[lang]/stack/page.tsx`.

**Architecture:** Start with the stack list because it is a self-contained public page with a narrow data contract: Notion-backed records, static cards, and a small amount of derived filter state. Keep the first version SSG-friendly, remove the generated RPC client dependency, and preserve the public-facing fields that matter most: `name`, `description`, `link`, `platforms`, `tags`, and `icon`.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Cloudflare KV abstraction, Notion adapter, `curl`, browser verification

---

### Task 1: Define the stack-list contract and the legacy mapping

**Files:**
- Create: `web/apps/blog2/src/domains/stack/types.ts`
- Create: `web/apps/blog2/src/domains/stack/list-stack.ts`
- Create: `web/apps/blog2/src/domains/stack/list-stack.test.ts`
- Create: `web/apps/blog2/src/integrations/notion/stack.ts`
- Create: `web/apps/blog2/src/integrations/kv/stack-cache.ts`

- [ ] **Step 1: Read only the legacy stack surface**

Inspect only the code needed to mirror the first public stack slice:

- `web/apps/blog/app/[lang]/stack/page.tsx`
- `web/apps/blog/app/[lang]/stack/stack.tsx`
- `server/app/blog/internal/handler/list_stack.go`

Extract the smallest useful behavior set:

- query stack items sorted by name
- preserve `name`, `link`, `description`, `platforms`, `tags`, and `icon` as render inputs
- keep client-side filtering behavior in mind, but do not copy the old client-side component shape
- keep the old generated RPC client out of the new app

- [ ] **Step 2: Write the failing domain test**

Create `src/domains/stack/list-stack.test.ts` for the app-native stack list contract.

The test should cover at least:

- returned stack items are ordered consistently with the source contract
- the public shape contains `name`, `link`, `description`, `platforms`, `tags`, and `icon`
- empty lists are handled explicitly

- [ ] **Step 3: Run the narrow test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/stack/list-stack.test.ts
```

Expected:

- failure because the use case and adapter do not exist yet

- [ ] **Step 4: Implement the minimal domain and adapter layer**

Add the smallest code needed to make the test pass.

The first version should:

- expose a `listStack` use case
- query Notion through an integration adapter
- normalize Notion pages into a blog2-native stack list shape
- keep KV behind a storage abstraction even if the first version only uses cache lookup or placeholder interfaces

- [ ] **Step 5: Re-run the narrow test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/stack/list-stack.test.ts
```

Expected:

- PASS

### Task 2: Render the public stack page

**Files:**
- Create: `web/apps/blog2/app/[lang]/stack/page.tsx`
- Create: `web/apps/blog2/src/domains/stack/stack-list.tsx`
- Create: `web/apps/blog2/src/domains/stack/stack-list.test.tsx`

- [ ] **Step 1: Write the failing rendering test**

Create `src/domains/stack/stack-list.test.tsx` for the public-facing stack component.

The test should verify:

- stack cards render visible name, description, and link
- platform and tag chips render when present
- icon rendering is optional
- empty state is explicit if no items exist

- [ ] **Step 2: Run the component test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx
```

Expected:

- failure because the view component does not exist yet

- [ ] **Step 3: Implement the page and view**

Create the stack page and connect it to the stack use case.

The first version should:

- render at `app/[lang]/stack/page.tsx`
- reuse the existing locale shell
- render a real stack list from the new domain use case
- keep page logic thin and push mapping into the domain/view layer
- stay SSG-friendly

- [ ] **Step 4: Re-run the component test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: Verify the route locally**

Start or reuse the dev server, then run:

```bash
curl -I http://localhost:3001/en/stack
```

Expected:

- `200 OK`
- the page is reachable without redirect loops or runtime errors

- [ ] **Step 6: Verify in a browser**

Open `http://localhost:3001/en/stack` in a browser and confirm:

- the stack listing renders
- no blocking console/runtime errors appear
- the route feels like a real public content page rather than a shell placeholder

- [ ] **Step 7: Record results in the ledger**

Update `web/apps/blog2/docs/task-ledger.md` with:

- the selected slice
- files changed
- test and HTTP results
- browser verification outcome
- follow-up scope for filters or richer stack metadata

### Task 3: Tighten the verification loop

**Files:**
- Modify: `web/apps/blog2/docs/verification.md`

- [ ] **Step 1: Update verification guidance**

Add the actual commands used for the first stack slice:

- targeted Vitest runs for the stack domain and view
- `pnpm --dir web --filter blog2 lint`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl -I http://localhost:3001/en/stack`
- browser verification for `/en/stack`

- [ ] **Step 2: Run the full relevant gate set**

Run:

```bash
pnpm --dir web --filter blog2 test
pnpm --dir web --filter blog2 lint
pnpm --dir web --filter blog2 typecheck
pnpm --dir web --filter blog2 build
```

Expected:

- all commands pass for the public stack slice

- [ ] **Step 3: Do not commit yet**

Leave the worktree uncommitted until the owner requests a commit.
