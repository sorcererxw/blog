# Blog2 Direct Telegram Thoughts Implementation Plan

Superseded by: `web/apps/blog2/docs/plans/2026-04-06-blog2-thoughts-snapshot.md`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the thoughts page cron/KV dependency with direct Telegram reads during page requests.

**Architecture:** Keep the existing thought normalization and feed rendering layers, but swap the source of truth from KV snapshots to a direct Telegram source. Do not introduce Durable Objects or any persistent connection coordinator; the page should authenticate and read Telegram directly for each request and render an explicit empty state on failure.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, `@mtcute/web`, OpenNext Cloudflare bindings

---

### Task 1: Define the new direct-read contract

**Files:**
- Modify: `web/apps/blog2/src/domains/thoughts/list-thoughts.ts`
- Modify: `web/apps/blog2/src/domains/thoughts/list-thoughts.test.ts`
- Modify: `web/apps/blog2/src/integrations/telegram/thoughts.ts`
- Modify: `web/apps/blog2/src/integrations/telegram/thoughts.test.ts`

- [ ] **Step 1: Write the failing tests for the new fallback behavior**

Add or update tests so they prove:

- direct Telegram records are still normalized newest first
- source failures return an empty list instead of throwing through the page path
- the source no longer falls back to demo data when no live loader exists

- [ ] **Step 2: Run the narrow tests to verify they fail**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/list-thoughts.test.ts src/integrations/telegram/thoughts.test.ts
```

Expected:

- failure because the current source still returns demo data and the domain use case does not implement the new fallback

- [ ] **Step 3: Implement the minimal domain/source contract changes**

Change the code so that:

- `listThoughts` treats source failures as an empty list
- the Telegram source prefers a direct loader
- demo fallback paths are removed from the public request behavior

- [ ] **Step 4: Re-run the narrow tests**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/list-thoughts.test.ts src/integrations/telegram/thoughts.test.ts
```

Expected:

- PASS

### Task 2: Route the thoughts page through direct reads

**Files:**
- Modify: `web/apps/blog2/src/app/thoughts/page.tsx`
- Modify: `web/apps/blog2/src/integrations/telegram/mtcute-thoughts.ts`
- Modify: `web/apps/blog2/src/domains/thoughts/thoughts-feed.test.tsx`
- Modify: `web/apps/blog2/wrangler.jsonc`

- [ ] **Step 1: Write the failing page-path test**

Add or update tests so they prove:

- the page path consumes the direct Telegram source
- empty lists render the explicit empty state when Telegram reads fail

- [ ] **Step 2: Run the page-related tests to verify they fail**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx src/integrations/telegram/thoughts.test.ts
```

Expected:

- failure because the page still resolves through the KV/demo path

- [ ] **Step 3: Implement the page wiring**

Update the page and integration layer so:

- `/thoughts` requests the direct Telegram source
- KV is no longer required for page correctness
- failures produce an empty feed instead of demo content
- the worker configuration stays on the standard OpenNext entrypoint

- [ ] **Step 4: Re-run the page-related tests**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx src/integrations/telegram/thoughts.test.ts
```

Expected:

- PASS

### Task 3: Verify the app slice and refresh docs

**Files:**
- Modify: `web/apps/blog2/docs/roadmap.md`
- Modify: `web/apps/blog2/docs/task-ledger.md`
- Modify: `web/apps/blog2/docs/verification.md`

- [ ] **Step 1: Run the targeted test set**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/domains/thoughts/list-thoughts.test.ts src/integrations/telegram/thoughts.test.ts
```

Expected:

- PASS

- [ ] **Step 2: Run the relevant gates**

Run:

```bash
pnpm --dir web --filter blog2 typecheck
pnpm --dir web --filter blog2 build
pnpm --dir web --filter blog2 exec opennextjs-cloudflare build
```

Expected:

- PASS

- [ ] **Step 3: Verify the route locally**

Run:

```bash
curl -I http://localhost:3001/thoughts
```

Expected:

- `200 OK`
- no redirect loop

- [ ] **Step 4: Verify in a browser**

Open `/thoughts` and confirm:

- the page loads without runtime errors
- Telegram-backed content appears when Telegram reads succeed
- the explicit empty state appears when the source fails

- [ ] **Step 5: Update living docs**

Record:

- the new direct-read architecture in the roadmap if milestone framing changes
- verification evidence in `docs/task-ledger.md`
- the new direct-read command set in `docs/verification.md`

- [ ] **Step 6: Do not commit yet**

Leave the worktree uncommitted until the owner explicitly asks for a commit.
