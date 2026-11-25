# Vite + TanStack Start + Native Cloudflare Workers Migration Design

Date: 2026-11-25

## Purpose

Replace the Next.js + `@opennextjs/cloudflare` framework and adapter layer with **Vite 8 + TanStack Start + `@cloudflare/vite-plugin`** running natively on Cloudflare Workers (`workerd`).

This supersedes `docs/specs/2026-05-13-opennext-nextjs-rebuild-design.md` as the active runtime platform while keeping the Personal Site product model (`docs/specs/2026-05-12-personal-site-overview-design.md`), HeroUI v3 design system, SEO/GEO discovery contract, and zero-cost performance optimizations (`docs/specs/2026-11-25-zero-cost-performance-optimization-design.md`) completely intact.

## Goals

1. **Eliminate OpenNext + Next.js runtime overhead**: remove `@opennextjs/cloudflare`, `next`, Webpack patches, and Next.js client runtime + legacy polyfills (~337 KB raw client JS and ~1.84 MB Next server runtime).
2. **Native Cloudflare Workers runtime**: run directly on `workerd` via `@cloudflare/vite-plugin` in both local dev (`vite dev`) and production (`vite build` + `wrangler deploy`), reading bindings and `waitUntil` directly from `"cloudflare:workers"`.
3. **Preserve 100% of product behavior, UI/UX, and zero-cost constraints**:
   - `/` (with `?type=writing|projects|social` and `?source=telegram|x` SSR-aware filters)
   - `/articles/$slug` (Notion blocks, Shiki dual-theme code blocks, `<!--render-->` trusted HTML blocks, HeroUI tables)
   - `/api/health`, `/.well-known/api-catalog`, `/sitemap.xml`, `/media/$id`
   - Legacy `308` compatibility redirects for `/projects`, `/thoughts`, `/en/**`, `/zh/**`, while `/blog` returns `404`
   - Daily Cloudflare cron `0 18 * * *` for X owned-post sync into `BLOG_CACHE` (`social:x:index`, `social:x:posts:*`, `social:x:feed:v1`)
   - Free Worker-level `caches.default` HTML/sitemap SWR caching keyed by build version
   - Provider KV SWR wrappers, incremental Telegram public-page crawl, and Notion `data_source_id` caching
   - Self-hosted `Libre Bodoni` and `Courier Prime` fonts via `@fontsource` (zero external Google Fonts requests)
   - Zero new paid Cloudflare services/bindings

## Target Architecture

### Build & Runtime Stack

- Bundler: **Vite 8** with `@tailwindcss/vite`, `@cloudflare/vite-plugin` (`viteEnvironment: { name: "ssr" }`), `@tanstack/react-start/plugin/vite`, and `@vitejs/plugin-react`
- Router & SSR: **TanStack Start** (`@tanstack/react-start` + `@tanstack/react-router`)
- Worker Entrypoint: `src/server.ts` wrapping `@tanstack/react-start/server-entry` via `createServerEntry()`:
  1. Legacy compatibility redirect check (`src/lib/legacy-redirects.ts`) -> `308`
  2. Free Worker edge HTML/sitemap SWR cache (`src/lib/edge-page-cache.ts`) keyed by compile-time `__APP_BUILD_ID__`
  3. TanStack Start `fetch(request)` handler
  4. Native `scheduled(controller, env, ctx)` cron handler for `0 18 * * *` X sync
- Cloudflare bindings: read directly from `"cloudflare:workers"` (`env`, `waitUntil`) behind `src/lib/cloudflare-env.ts`
- Static assets: served from `public/` (`favicon.svg`, `robots.txt`, `llms.txt`, `_headers` with `/assets/*` immutable caching) plus Vite's hashed `dist/client/assets/*`

### Route Structure (`src/routes/`)

```text
src/
  router.tsx
  server.ts
  routes/
    __root.tsx                  # Root HTML document, theme init script, fonts/CSS, SiteHeader/SiteFooter, 404 & error boundary
    index.tsx                   # / (ProfileHero + OverviewFeed, search filter SSR, SEO head + JSON-LD, Link + Cache-Control headers)
    articles.$slug.tsx          # /articles/:slug (ArticleDetailView, SEO head + JSON-LD, 404 via notFound(), Cache-Control headers)
    api.health.ts               # GET /api/health
    sitemap[.]xml.ts            # GET /sitemap.xml
    [.]well-known.api-catalog.ts # GET/HEAD /.well-known/api-catalog (or handled via server route)
    media.$id.ts                # GET /media/:id (immutable Cache-Control, 304, KV + Edge Cache backfill via waitUntil)
```

### Framework-Agnostic Shared Components

- **Links (`src/components/navigation/site-link.tsx`)**: shared `SiteLink` component replacing `next/link`. Renders native `<a>` for external URLs, hash anchors, `target="_blank"`, or outside a router context (e.g. unit tests); renders TanStack Router `<Link>` for internal SPA navigations with `preload={false}` support.
- **Images (`src/components/media/responsive-remote-image.tsx`)**: replaces `next/image` + `image-loader.ts` with our app-owned Cloudflare image URL builder (`src/lib/images/cloudflare.ts` + `src/domains/media/canonical-image.ts`). Renders standard `<img>` with `loading`, `decoding="async"`, `fetchPriority`, `sizes`, and `srcSet` for transform-allowed stable hosts (`images.unsplash.com`, `pbs.twimg.com`), while rendering single-URL canonical `/media/<id>?u=...` (no redundant `srcSet`) for volatile hosts in production.
- **Fonts**: `@fontsource/libre-bodoni` (400, 500, 600) and `@fontsource/courier-prime` (400, 700) imported into `src/styles/globals.css`, exposing `--font-heading-system: "Libre Bodoni"` and `--font-courier-prime-system: "Courier Prime"` so every existing typography token and CSS rule stays pixel-identical.
- **SEO Adapter (`src/lib/seo-head.tsx`)**: maps `SeoDocument` -> TanStack Router `head()` `{ meta, links }` + keeps `StructuredDataScripts` unchanged.

## Non-Goals

- Rewriting UI components away from React or HeroUI v3.
- Changing homepage feed layout, item count, or Notion/Telegram/X schemas.
- Introducing R2, D1, Durable Objects, or paid Cloudflare features.

## Success Criteria

- `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` (Vite + Cloudflare Workers build) all pass.
- No remaining runtime dependencies on `next`, `@opennextjs/cloudflare`, `eslint-config-next`, or `@tailwindcss/postcss`.
- Measurable reductions in client JS bundle size and Worker server bundle size compared to the Next.js + OpenNext baseline (`6.98 MB` Worker, `~890 KB` client JS).
- Local Cloudflare Workers (`vite preview` / `wrangler dev`) HTTP checks prove `/`, `/?type=writing`, `/articles/[slug]`, `/sitemap.xml`, `/.well-known/api-catalog`, `/api/health`, `/media/[id]`, `/projects` (`308`), `/en/blog` (`308`), `/blog` (`404`), and `x-blog2-edge-cache: miss -> hit`.
- Real browser verification proves `/` hydrates cleanly into 3-column `hydrated-masonry`, filters and theme toggle work, `/media/` images load cleanly, and `/articles/[slug]` renders HeroUI tables and Shiki code blocks with zero console errors.
