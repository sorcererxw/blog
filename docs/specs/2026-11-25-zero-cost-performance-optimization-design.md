# Zero-Cost, Zero-UI-Change Performance Optimization Design

Date: 2026-11-25

## Purpose

Eliminate the severe page-load latency on `https://sorcererxw.com` (currently 1.3s–8.5s TTFB on `/`, 1.8s–2.3s on cold article pages, 14.7 MB Worker bundle, and 1.13 MB homepage HTML) while adhering strictly to two constraints:

1. **Zero UI/UX changes**: preserve exact visual appearance, layout, HeroUI styling, full Overview Feed item set, masonry behavior, filters, routing, SEO metadata, structured data, and agent discovery headers.
2. **Zero cost increase**: introduce no new Cloudflare paid bindings (no R2, D1, Durable Objects, Queues), no additional X API requests, and no additional Cloudflare Image Transformation variants. Reduce existing KV reads and Worker CPU usage.

## Diagnosed Root Causes

Live measurements against production (`https://sorcererxw.com`) and inspection of `.open-next/` build outputs identified six compounding bottlenecks:

1. **X Social Post N+1 sequential KV reads**: `listStoredXSocialPosts()` performs ~100 sequential `KV.get()` calls (`social:x:posts:<id>`) on every homepage request. Within Cloudflare KV's 60s edge cache window this costs ~1s; after 60s or on a different POP it costs 5–7s.
2. **No effective edge HTML caching**: `open-next.config.ts` uses default `"dummy"` caches, Cloudflare Workers Custom Domains do not cache Worker HTML responses automatically from `s-maxage=600`, and `HomePage` awaits `searchParams` (forcing dynamic rendering). Every request hits the Worker and re-runs SSR.
3. **Synchronous request-time Telegram full-channel crawling + hard-expiring provider KV**: `provider-cache.ts` sets physical 600s KV expiration without SWR. Every 10 minutes, visitors block for 8–13s while the Worker crawls all pages of `t.me/s/tech_bb` and queries Notion (including uncached `databases.retrieve` calls and duplicated `loadArticle` calls across `generateMetadata` and `ArticlePage`).
4. **14.7 MB Worker bundle dominated by Shiki**: importing `bundledLanguages` and `createHighlighter` from `"shiki"` bundles 7.39 MB of `@shikijs/langs`, 1.30 MB of `@shikijs/themes`, and 620 KB of `@shikijs/engine-oniguruma` (~64% of the Worker), inflating Worker cold starts by ~500–730ms. Additionally, `highlightCode()` creates a fresh highlighter per code block.
5. **`/media/[id]` cache bugs and `srcSet` HTML bloat**: `/media/[id]` fails to populate Edge Cache on KV hits, sends `Cache-Control: public, max-age=0`, and awaits KV/Edge writes before returning. Meanwhile `next/image` generates 9 redundant `srcSet` entries per `/media/` image, repeating 400B base64 URLs and adding ~360–400 KB of dead markup to homepage HTML.
6. **Unused CSS and client JS weight**: `@import "@heroui/styles"` ships all 64 HeroUI component stylesheets (~393 KB raw CSS) when only 6 components are used; barrel imports from `@heroui/react` pull unused React Aria runtime code into the homepage; 313 external links use `<NextLink>` and 42 article links trigger automatic RSC prefetching; `src/middleware.ts` runs without a route `matcher`.

## Architecture Changes

### 1. X Social Post Aggregate Snapshot (`BLOG_CACHE`)

- Add a single durable aggregate key `social:x:feed:v1` alongside the existing `social:x:index` and `social:x:posts:<id>` keys.
- `syncXSocialPosts()` writes the ordered `XSocialPostDetail[]` snapshot into `social:x:feed:v1` after updating per-post records and `social:x:index` during the existing daily cron (`0 18 * * *`). X API usage is unchanged.
- `listStoredXSocialPosts()` reads `social:x:feed:v1` in a single KV read (`cacheTtl: 600`).
- If `social:x:feed:v1` is absent (first rollout or legacy store), fallback reads per-post keys via Cloudflare KV bulk `namespace.get(keys)` (batches of 100) or `Promise.all`, then lazily backfills `social:x:feed:v1` via `ctx.waitUntil`.

### 2. Provider KV Logical SWR & Incremental Telegram Refresh

- Upgrade `readThroughProviderCache()` to support logical freshness (`freshTtlSeconds = 600`) decoupled from physical KV retention (`staleTtlSeconds = 7 days`) using an envelope `{ __blog2ProviderCacheEntry: 1, cachedAt, value }`.
- Legacy non-envelope KV entries remain readable seamlessly.
- Pass Cloudflare KV `cacheTtl: 300` on provider reads to reduce central KV round-trips.
- On stale hit: return cached value immediately and trigger a singleflight background refresh via `ctx.waitUntil`. Skip `KV.put` when the refreshed serialized payload is unchanged.
- On Telegram background refresh: pass `knownIds` from cached thoughts so `scrapeTelegramPublicPageThoughtRecords()` stops after page 1 once it overlaps known message IDs, merging fresh items with cached older thoughts. Perform a full crawl every 24 hours in the background to reconcile edits/deletions.
- Cache Notion `databaseId -> dataSourceId` in memory and KV (long TTL) inside `getPrimaryDataSourceId()`.
- Deduplicate per-request data loading with React `cache()` in `src/app/page.tsx` and `src/app/articles/[slug]/page.tsx`.

### 3. Worker-Level Free Edge HTML Cache (`caches.default`) & Narrow Middleware

- Add a thin Worker-level cache layer (`src/lib/edge-page-cache.ts`) invoked in `src/worker.ts` before delegating to OpenNext's `handler.fetch`.
- Scope: public `GET`/`HEAD` document requests for `/`, `/articles/*`, and `/sitemap.xml` when Next.js RSC negotiation headers (`rsc`, `next-router-prefetch`, `next-router-segment-prefetch`, `next-router-state-tree`) are absent.
- Normalize cache keys by keeping only allowed homepage filter params (`type`, `source`) and dropping unrelated query strings for document cache lookup.
- Store responses with normalized `Vary: Accept-Encoding` (required by Cloudflare Cache API) and internal `X-Blog2-Edge-Cached-At` timestamp, retaining cached copies for 24h (`s-maxage=86400`) with a 600s logical fresh window and `ctx.waitUntil` SWR background revalidation.
- Restore original response headers (`Vary`, `Cache-Control`) on responses returned to clients.
- Narrow `src/middleware.ts` with `config.matcher` to legacy redirect paths (`/projects`, `/thoughts`, `/en`, `/zh` and subpaths).

### 4. Fine-Grained Shiki Core Highlighter Singleton

- Migrate `src/domains/article/highlight-code.ts` to `shiki/core` + `shiki/engine/javascript`.
- Explicitly import only `github-light` and `github-dark` themes and a curated registry of engineering languages actually used in technical writing; fall back gracefully to escaped `<pre class="shiki shiki-themes"><code>` for unknown languages.
- Reuse a single module-level `HighlighterCore` singleton with lazy language loading instead of calling `createHighlighter()` per code block.

### 5. Media Cache Fixes & Lossless Frontend Asset Pruning

- `src/app/media/[id]/route.ts`:
  - Serve `Cache-Control: public, max-age=31536000, immutable` (canonical IDs are content-addressed hashes of source URLs) and handle `If-None-Match` 304 responses.
  - Backfill `edgeCache.put` via `waitUntil` on KV hits.
  - Move `mediaCache.set` and `edgeCache.put` on misses into `waitUntil` so image bytes return immediately.
- `ResponsiveRemoteImage` & `next.config.ts`:
  - In production, render bypassed volatile `/media/` images as single-URL `unoptimized` `<img>` elements without 9 duplicate base64 `srcSet` entries (preserving `/media/[id]` routing and zero extra Cloudflare Image Transformation cost).
  - Narrow `images.deviceSizes` to `[384, 640, 750, 1080, 1280]` and `images.imageSizes` to `[40, 80, 256, 384]`.
  - Enable `experimental.optimizePackageImports` for `@heroui/react`, `@heroui/styles`, and `lucide-react`.
- `src/app/globals.css`:
  - Replace full `@import "@heroui/styles"` with HeroUI v3 selective imports (`base`, `themes/default`, `utilities`, `variants`, plus only used component CSS: `button`, `card`, `chip`, `scroll-shadow`, `separator`, `surface`, `table`, `tabs`).
- Component imports & feed micro-optimizations (zero UI change):
  - Import HeroUI React primitives from component subpaths (`@heroui/react/button`, `@heroui/react/card`, `@heroui/react/chip`, `@heroui/react/tabs`, `@heroui/react/table`).
  - Keep `<NextLink>` per the repository ESLint rule (`local/require-next-link-and-image`), set `prefetch={false}` on feed links in `OverviewFeed`, wrap `FeedModule` in `React.memo`, omit redundant `summary` when `summaryRichText` is serialized, and align `feed-layout-engine.ts` font metric constants to `"Courier Prime"`.

## Out of Scope

- Homepage pagination or limiting rendered feed item count.
- Removing or replacing HeroUI design system components or masonry layout.
- Adding Cloudflare R2, D1, Durable Objects, or paid image transformation expansion.
- Changing X API sync cadence or query parameters.

## Success Criteria

- Full unit test suite, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `opennextjs-cloudflare build` pass.
- Worker bundle `.open-next/server-functions/default/handler.mjs` drops from ~14.7 MB to <7 MB.
- Compiled main CSS drops substantially while retaining all used HeroUI component and theme rules.
- New regression tests cover X single-key snapshot & bulk fallback, KV SWR background refresh & unchanged-write skip, Telegram incremental overlap stop, Worker edge cache hit/stale/RSC bypass, Shiki singleton highlighting, and `/media/[id]` immutable + edge backfill behavior.
- Local HTTP verification confirms `/`, `/?type=writing`, `/articles/[slug]`, `/media/[id]`, `/sitemap.xml`, and legacy redirects return expected status, headers, and markup with zero UI regressions.
