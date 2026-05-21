# X Social Source Plan

Date: 2026-05-21

## Goal

Add the author's X account as a Social Source for the Personal Site Overview Feed while keeping X API calls out of homepage rendering.

## Source Contract

- source id: `x`
- profile: `https://x.com/sorcererxw`
- user id: `3798600074`
- content scope: original posts and quote posts only
- excluded scope: replies, reposts, full social embeds, X video/GIF players
- filter query: `/?source=x`

## Storage Contract

Use Cloudflare KV as durable source state, not as a short route cache.

- one list/index key stores ordered ids, sync metadata, and the scanned boundary
- per-post detail keys store normalized X Social Post details by X post id
- the scanned boundary is an X post id, not a timestamp
- replies and reposts are excluded by the X API request and therefore do not enter local boundary advancement
- boundary advancement happens only after retained detail keys and the list/index key are written successfully
- homepage reads stored KV state and skips missing detail records instead of failing the Overview Feed

List/index metadata:

```ts
{
  scannedBoundaryId: string | null;
  orderedIds: string[];
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastScannedCount: number;
  lastRetainedCount: number;
  lastError: string | null;
}
```

## Sync Contract

- production sync runs only from a Cloudflare daily cron at `18:00 UTC` / `02:00 Asia/Shanghai`
- local manual triggering uses Wrangler's scheduled-event test route against the same Worker `scheduled()` handler
- each cron run reads at most 50 owned posts after the last successful scanned boundary, excluding replies and reposts at the X API layer
- if more than 50 posts exist after the boundary, later cron runs continue from the advanced boundary
- a zero-new-post run is still successful: update attempt/success timestamps, set counts to zero, leave the boundary unchanged, and clear `lastError`
- sync failures do not affect homepage rendering; the homepage keeps showing the last successfully merged list

## Steps

1. Add X API and storage types. Done.
   - model normalized X Social Post details
   - model the list/index metadata
   - add no-op or memory storage helpers for tests
   - add tests for boundary advancement, X API reply/repost exclusion, zero-new-post success, and failed writes not advancing the boundary

2. Add the X API adapter. Done.
   - call X owned-read user posts API for fixed user id `3798600074` through `@xdevplatform/xdk`
   - simplified the final implementation by passing the XDK client directly from `src/worker.ts` into the domain sync module
   - request fields needed for `created_at`, entities, referenced tweet type, and media previews
   - normalize URL entities to expanded/display URLs rather than raw `t.co`
   - normalize photos and stable preview images only

3. Add the sync use case. Done.
   - read the list/index key
   - fetch at most 50 posts after `scannedBoundaryId`
   - filter to original and quote posts for retained details
   - write retained detail keys before updating list/index metadata
   - keep sync idempotent when a previous attempt wrote details but did not advance the index

4. Wire Worker scheduling. Done.
   - add `scheduled()` to `src/worker.ts` while preserving `fetch: handler.fetch`
   - add the daily cron trigger to `wrangler.jsonc`
   - add the required X API secret to Wrangler required secrets
   - document local `/__scheduled` verification through Wrangler's scheduled test support

5. Wire homepage read path. Done.
   - read X list/index and detail keys from KV
   - map stored X Social Posts into existing Feed Items
   - add `/?source=x` filtering while keeping X posts in the default Overview Feed
   - keep homepage JSON-LD capped by the existing sitewide cap

6. Verify. Done locally.
   - targeted tests for X adapter normalization
   - targeted tests for sync state transitions and write failure behavior
   - targeted tests for Overview Feed filtering and missing detail tolerance
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`
   - `pnpm exec opennextjs-cloudflare build`
   - local Wrangler scheduled-event test
   - `curl` checks for `/` and `/?source=x`
   - browser verification for homepage feed rendering and filter interaction

## Done Criteria

- homepage never calls X directly: met
- daily cron updates KV through one sync use case: implemented; production secret still needs provisioning
- local scheduled-event triggering exercises the same Worker `scheduled()` handler: verified with Wrangler `/__scheduled`
- X posts appear in the default Overview Feed and `/?source=x`: implemented; local render shows the X filter empty state until KV contains X posts
- replies and reposts are excluded by the X API request and do not create Social Posts: covered by sync tests
- missing X detail records do not break homepage rendering: covered by sync tests
- docs, task ledger, and verification guide record the final commands and outcomes: met
