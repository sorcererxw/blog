# Zero-Cost Performance Optimization Implementation Plan

Date: 2026-11-25
Spec: `docs/specs/2026-11-25-zero-cost-performance-optimization-design.md`

## Execution Slices

### Slice 1: Data Layer (KV SWR, X Snapshot, Incremental Telegram, Notion Dedupe)
1. Extend `src/types/cloudflare.ts` KV typings (`cacheTtl` options and bulk `get(keys)`).
2. Add `waitUntilInWorker` helper to `src/lib/cloudflare-env.ts`.
3. Upgrade `src/integrations/kv/provider-cache.ts` and `src/integrations/kv/provider-wrappers.ts` with logical SWR envelopes, 7-day physical retention, `cacheTtl: 300`, singleflight in-flight deduplication, conditional writes, and Telegram incremental refresh merging (with 24h full reconcile).
4. Add `knownIds` early-stop support to `src/integrations/telegram/public-page.ts` and `src/domains/thoughts/list-thoughts.ts`.
5. Add `social:x:feed:v1` snapshot read/write and bulk `getPostsBatch` fallback to `src/integrations/kv/x-social-post-store.ts` and `src/domains/social/x-sync.ts`.
6. Cache Notion `data_source_id` in `src/integrations/notion/data-source.ts` (memory + KV) and wrap per-request loaders with React `cache()` in `src/app/page.tsx` and `src/app/articles/[slug]/page.tsx`.
7. Add/update unit tests for provider cache SWR, X snapshot/batch, Telegram incremental crawl, and Notion data-source caching.

### Slice 2: Worker Edge HTML Cache & Middleware Narrowing
1. Create `src/lib/edge-page-cache.ts` implementing free Cloudflare `caches.default` HTML/sitemap SWR caching (skipping RSC requests, normalizing allowed filter query params, normalizing `Vary` for Cache API compatibility, refreshing stale entries via `ctx.waitUntil`).
2. Wire `src/worker.ts` `fetch` through `withEdgePageCache`.
3. Add `config.matcher` to `src/middleware.ts` covering only legacy redirect routes.
4. Add unit tests `src/lib/edge-page-cache.test.ts` and update `src/middleware.test.ts`.

### Slice 3: Shiki Fine-Grained Bundle & Singleton
1. Refactor `src/domains/article/highlight-code.ts` to use `shiki/core`, `shiki/engine/javascript`, explicit `github-light`/`github-dark` themes, curated language loaders, and a module-level singleton highlighter.
2. Add unit test `src/domains/article/highlight-code.test.ts` verifying singleton reuse, dual-theme output, aliases, and unknown-language fallback.

### Slice 4: Media Cache, Image `srcSet`, Selective CSS & Client Bundle Pruning
1. Fix `src/app/media/[id]/route.ts`: `immutable` Cache-Control, `If-None-Match` 304, `waitUntil` edge backfill on KV hit, and `waitUntil` KV/edge writes on miss; update `src/app/media/[id]/route.test.ts`.
2. Update `src/components/media/responsive-remote-image.tsx` to avoid emitting 9 duplicate base64 `srcSet` entries for bypassed volatile `/media/` URLs in production, and narrow `images.deviceSizes`/`imageSizes` + add `experimental.optimizePackageImports` in `next.config.ts`.
3. Replace full `@import "@heroui/styles"` in `src/app/globals.css` with selective HeroUI v3 component imports.
4. Switch `@heroui/react` imports to component subpaths (`button`, `card`, `chip`, `table`, `tabs`), set `prefetch={false}` on feed `<NextLink>` elements (preserving `local/require-next-link-and-image`), memoize `FeedModule`, omit redundant `summary` when `summaryRichText` is present in serialized feed items, and align `feed-layout-engine.ts` font constants to `"Courier Prime"`.

### Verification & Docs
1. Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm exec opennextjs-cloudflare build`.
2. Inspect `.open-next/server-functions/default/handler.mjs` size, compiled CSS size, and client chunk sizes to confirm measurable improvements.
3. Run local `next start` / `curl` HTTP verification against `/`, `/?type=writing`, `/articles/[slug]`, `/sitemap.xml`, `/projects`, and `/media/[id]`.
4. Update `docs/roadmap.md`, `docs/task-ledger.md`, and `docs/verification.md`.
