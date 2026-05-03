# Blog2 Thoughts Snapshot Implementation Plan

Supersedes: `web/apps/blog2/docs/plans/2026-03-31-blog2-direct-telegram-thoughts.md`

## Goal

Replace thoughts request-time Telegram reads with a checked-in local snapshot flow.

## Cleanup Plan

1. replace the old design docs first so the repository contract matches the approved architecture
2. write failing tests for the new snapshot-based read path and sync command
3. implement the local sync command and snapshot loader
4. switch `/thoughts` to a static snapshot-backed page
5. delete thoughts-specific KV and runtime Telegram branches
6. run targeted verification and update living docs

## Architecture

```text
local sync command
  -> Telegram fetch
  -> normalize to public snapshot shape
  -> write src/domains/thoughts/thoughts.snapshot.json

/thoughts page
  -> import / load snapshot
  -> rehydrate dates
  -> render existing card UI
```

## Task 1: Lock the new contract with tests

Files:

- modify `web/apps/blog2/src/app/thoughts/page.test.ts`
- modify `web/apps/blog2/src/domains/thoughts/list-thoughts.test.ts`
- modify `web/apps/blog2/src/integrations/telegram/thoughts.test.ts`
- add `web/apps/blog2/src/domains/thoughts/sync-thoughts.test.ts`

Steps:

- add failing page tests that prove `/thoughts` reads snapshot data and no longer depends on Telegram runtime mocks
- add failing domain tests that prove snapshot items are rehydrated and sorted newest first
- add failing sync tests that prove snapshot writes are atomic and old content survives failures
- run the narrow test set and confirm it fails for the new reasons

## Task 2: Implement snapshot-based thoughts loading

Files:

- modify `web/apps/blog2/src/domains/thoughts/list-thoughts.ts`
- add `web/apps/blog2/src/domains/thoughts/thoughts.snapshot.json`
- modify `web/apps/blog2/src/app/thoughts/page.tsx`

Steps:

- load the checked-in snapshot from the thoughts domain
- convert serialized dates into `Date`
- keep the existing render model and UI behavior
- switch `/thoughts` to `force-static`
- delete runtime Cloudflare context reads and page-owned Telegram logic

## Task 3: Implement the local sync command

Files:

- add `web/apps/blog2/src/domains/thoughts/sync-thoughts.ts`
- add `web/apps/blog2/scripts/sync-thoughts.mjs`
- modify `web/apps/blog2/package.json`
- modify `web/apps/blog2/src/integrations/telegram/mtcute-thoughts.ts`
- modify `web/apps/blog2/src/integrations/telegram/thoughts.ts`

Steps:

- keep Telegram fetch and normalization reusable for the local command
- write the final snapshot payload, not raw Telegram records
- write via temp file + rename so failures do not corrupt the checked-in snapshot
- expose a repo-owned command such as `pnpm --dir web --filter blog2 sync:thoughts`

## Task 4: Delete dead paths

Files:

- delete or remove references from `web/apps/blog2/src/integrations/kv/thoughts-cache.ts`
- delete or remove thoughts-only KV tests
- update `web/apps/blog2/src/app/api/cron/thoughts/route.ts`
- remove thoughts page tests that only prove runtime Telegram behavior

Steps:

- remove thoughts-only KV abstractions
- remove `createTelegramThoughtSource` and other dead source-selection logic
- keep only the Telegram helpers still needed by the local sync command
- leave no secondary thoughts read path in the deployed app

## Task 5: Verify and refresh docs

Files:

- modify `web/apps/blog2/docs/roadmap.md`
- modify `web/apps/blog2/docs/task-ledger.md`
- modify `web/apps/blog2/docs/verification.md`

Verification:

```bash
pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/domains/thoughts/list-thoughts.test.ts src/domains/thoughts/sync-thoughts.test.ts src/integrations/telegram/thoughts.test.ts
pnpm --dir web --filter blog2 typecheck
pnpm --dir web --filter blog2 build
```

Record:

- the new snapshot architecture
- the sync command usage
- targeted verification evidence
- follow-up TODOs for secret rotation and sync drift checks
