# Provider KV Cache Design

Date: 2026-05-18

## Purpose

Reduce public page load latency by caching each external content provider at the route assembly boundary.

The cache belongs outside provider implementations. Notion and Telegram providers should continue to fetch and normalize source data directly; route assembly should wrap those providers with a simple KV-backed cache before domain use cases call them.

## Scope

Included:

- Notion home page provider
- Notion article list provider
- Notion project list provider
- Notion article detail provider
- Telegram public thoughts provider
- `BLOG_CACHE` as the shared Cloudflare KV namespace

Excluded:

- moving cache logic into Notion or Telegram integration internals
- adding a database
- changing content source schemas
- adding provider-specific invalidation workflows in this slice

## Boundary

The target shape is:

```text
raw provider
  -> KV provider wrapper
  -> domain use case
  -> route assembly
```

Provider wrappers use provider-specific cache keys and a shared ten minute TTL. Cache misses call the raw provider and store the returned provider result. Cache hits return the same provider-shaped data, including revived `Date` values.

This keeps provider code boring and makes the caching policy visible where public routes compose data sources.

## Freshness

Provider KV entries use a `600` second TTL to match the current public route revalidation target.

Future manual refresh or webhook invalidation can delete provider keys, but that is not part of this slice.

## Failure Behavior

The cache is a best-effort acceleration layer:

- no `BLOG_CACHE` binding means the wrapper falls back to direct provider calls
- malformed cached JSON is treated as a miss
- provider errors on a miss still surface normally

The wrapper should not hide source failures by serving stale data in this first version.
