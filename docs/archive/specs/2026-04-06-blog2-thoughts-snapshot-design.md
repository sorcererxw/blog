# Blog2 Thoughts Snapshot Design

Supersedes: `web/apps/blog2/docs/specs/2026-03-31-blog2-direct-telegram-thoughts-design.md`

## Summary

Change `blog2` thoughts from a request-time Telegram integration to a checked-in snapshot flow.

The new flow is:

1. run a local sync command
2. fetch Telegram thoughts locally
3. normalize them into the final public `ThoughtListItem` shape
4. write a repository snapshot file under `src/domains/thoughts/`
5. render `/thoughts` from that snapshot as a static public page

## Why Change

The current `/thoughts` route mixes three concerns:

- Telegram network access
- caching / freshness decisions
- public rendering

That makes the public page slow, fragile, and hard to reason about.

The user-approved replacement is simpler:

- manual sync is acceptable
- runtime Telegram access is not required
- remote KV is not required
- the deployed app should only read a checked-in snapshot

## In Scope

- a checked-in local `sync:thoughts` command
- a repository snapshot file stored near the thoughts domain
- snapshot data in the final public render shape
- a static `/thoughts` page that reads only the snapshot
- removal of thoughts-specific runtime Telegram and KV paths
- regression coverage for the sync command and snapshot-backed page

## Out of Scope

- automatic scheduling
- generic content sync infrastructure
- thoughts UI redesign
- remote KV writes
- cross-feature migration of `projects` or `stack`

## Architecture

### Data Flow

```text
Telegram (local only)
  -> sync:thoughts
  -> normalize to final ThoughtListItem snapshot payload
  -> write thoughts.snapshot.json atomically
  -> commit / deploy
  -> /thoughts static page reads snapshot only
```

### Snapshot Contract

The snapshot stores the processed public shape, not raw Telegram records.

Because the file is JSON, `date` is serialized as an ISO string and rehydrated to `Date` in the domain loader.

```text
ThoughtSnapshotItem =
  ThoughtListItem
  except date is string
```

This keeps runtime rendering boring:

- no Telegram-specific parsing on page requests
- no cache freshness logic
- no runtime Cloudflare dependency for thoughts

### File Location

The snapshot lives in the thoughts domain directory:

- `web/apps/blog2/src/domains/thoughts/thoughts.snapshot.json`

This keeps the generated content close to the domain that consumes it without exposing it as a public asset.

### Sync Command

The sync command is a repo-owned local tool.

Responsibilities:

- authenticate to Telegram locally
- fetch channel history
- reuse existing normalization where it still fits
- write the final snapshot file atomically
- leave the previous snapshot intact on failure

Non-responsibilities:

- serving public traffic
- mutating remote KV
- acting as a generic background job framework

## Runtime Behavior

### Successful Page Request

When `/thoughts` renders:

1. the route loads the checked-in snapshot
2. the domain converts serialized dates back to `Date`
3. the page renders the existing card UI

### Failure Behavior

Snapshot failures should fail loudly during development/build, not silently fall back to live Telegram or KV.

The deployed app should not contain a second data source for thoughts.

## Testing Strategy

Required coverage:

- snapshot loader round-trip and sort behavior
- static `/thoughts` rendering from snapshot data
- sync command success path
- sync command failure path without clobbering the old snapshot
- removal of runtime Telegram/KV dependencies from the page path

## Risks

### Stale Content Risk

Because sync is manual, content can become stale if the command is not run before deployment.

That is acceptable for this slice because the user explicitly prefers manual sync over runtime freshness.

### Snapshot Corruption Risk

If the sync command writes a partial file, the static page can break.

This is why atomic write behavior and failure tests are mandatory.
