# Blog2 Public Thoughts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first `M3` public-thoughts slice by rendering a real Telegram-backed thoughts page at `web/apps/blog2/app/[lang]/thoughts/page.tsx`.

**Architecture:** Start with the public thoughts feed because it exercises a separate public content path from articles: Telegram message retrieval, message normalization, masonry/card rendering, and reply/link/media handling. Keep the slice intentionally narrow and avoid translation job migration, Telegram refresh jobs, or image metadata expansion until the page is stable.

**Secrets and Env Constraint:** Do not hardcode any real Notion or Telegram token values in code or docs. All actual secret values must remain external to the repo and be supplied through Cloudflare bindings, local env files, or platform secrets. Legacy code may be inspected to learn env variable names and integration shape, but no secret values should be copied into the repository.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Cloudflare KV abstraction, Telegram source adapter, `curl`, browser verification

---

### Task 1: Define the thoughts feed contract and the legacy mapping

**Files:**
- Create: `web/apps/blog2/src/domains/thoughts/types.ts`
- Create: `web/apps/blog2/src/domains/thoughts/list-thoughts.ts`
- Create: `web/apps/blog2/src/domains/thoughts/list-thoughts.test.ts`
- Create: `web/apps/blog2/src/integrations/telegram/messages.ts`
- Create: `web/apps/blog2/src/integrations/kv/thoughts-cache.ts`

- [ ] **Step 1: Read only the legacy thoughts surface**

Inspect only the code needed to mirror the first public thoughts slice:

- `web/apps/blog/app/[lang]/thoughts/page.tsx`
- any directly imported local helper components from that page if needed
- the server handler that exposes telegram channel messages

Extract the smallest useful behavior set:

- fetch a channel-backed message feed
- sort messages newest first
- preserve reply linkage, forwarded-from, photos, rich text, webpage preview, reactions, and timestamps as render inputs
- keep article translation and async refresh logic out of scope for this slice

- [ ] **Step 2: Write the failing domain test**

Create `src/domains/thoughts/list-thoughts.test.ts` for the app-native thoughts list contract.

The test should cover at least:

- returned messages are ordered newest first
- the public shape contains id, date, link, richText, photos, replyTo, forwardedFrom, webpage, and reactions
- empty feeds are handled explicitly

- [ ] **Step 3: Run the narrow test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/list-thoughts.test.ts
```

Expected:

- failure because the use case and adapter do not exist yet

- [ ] **Step 4: Implement the minimal domain and adapter layer**

Add the smallest code needed to make the test pass.

The first version should:

- expose a `listThoughts` use case
- query a telegram-message source through an integration adapter
- normalize Telegram messages into a blog2-native feed shape
- keep KV behind a storage abstraction even if the first version only uses cache lookup or placeholder interfaces

- [ ] **Step 5: Re-run the narrow test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/list-thoughts.test.ts
```

Expected:

- PASS

### Task 2: Render the public thoughts page

**Files:**
- Create: `web/apps/blog2/app/[lang]/thoughts/page.tsx`
- Create: `web/apps/blog2/src/domains/thoughts/thoughts-feed.tsx`
- Create: `web/apps/blog2/src/domains/thoughts/thoughts-feed.test.tsx`

- [ ] **Step 1: Write the failing rendering test**

Create `src/domains/thoughts/thoughts-feed.test.tsx` for the public-facing thoughts component.

The test should verify:

- message cards render visible text and timestamps
- reply content is displayed as contextual quote/reference when present
- outbound links open to the original Telegram item
- empty state is explicit if no messages exist

- [ ] **Step 2: Run the component test to verify it fails**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx
```

Expected:

- failure because the view component does not exist yet

- [ ] **Step 3: Implement the page and view**

Create the thoughts page and connect it to the thoughts use case.

The first version should:

- render at `app/[lang]/thoughts/page.tsx`
- reuse the existing locale shell
- render a real thoughts feed from the new domain use case
- keep page logic thin and push mapping into the domain/view layer

- [ ] **Step 4: Re-run the component test**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: Verify the route locally**

Start or reuse the dev server, then run:

```bash
curl -I http://localhost:3001/en/thoughts
```

Expected:

- `200 OK`
- the page is reachable without redirect loops or runtime errors

- [ ] **Step 6: Verify in a browser**

Open `http://localhost:3001/en/thoughts` in a browser and confirm:

- the thoughts feed renders
- no blocking console/runtime errors appear
- the route feels like a real public content page rather than a shell placeholder

- [ ] **Step 7: Record results in the ledger**

Update `web/apps/blog2/docs/task-ledger.md` with:

- the selected slice
- files changed
- test and HTTP results
- browser verification outcome
- follow-up scope for translation and Telegram refresh jobs

### Task 3: Tighten the verification loop

**Files:**
- Modify: `web/apps/blog2/docs/verification.md`

- [ ] **Step 1: Update verification guidance**

Add the actual commands used for the first public-thoughts slice:

- targeted Vitest runs for the thoughts domain and view
- `pnpm --dir web --filter blog2 lint`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl -I http://localhost:3001/en/thoughts`
- browser verification for `/en/thoughts`

- [ ] **Step 2: Run the full relevant gate set**

Run:

```bash
pnpm --dir web --filter blog2 test
pnpm --dir web --filter blog2 lint
pnpm --dir web --filter blog2 typecheck
pnpm --dir web --filter blog2 build
```

Expected:

- all commands pass for the public-thoughts slice

- [ ] **Step 3: Do not commit yet**

Leave the worktree uncommitted until the owner requests a commit.
