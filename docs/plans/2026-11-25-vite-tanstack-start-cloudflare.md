# Vite + TanStack Start + Native Cloudflare Workers Migration Plan

Date: 2026-11-25
Spec: `docs/specs/2026-11-25-vite-tanstack-start-cloudflare-design.md`

## Phases

### Phase 1: Dependencies & Toolchain Foundation
1. Update `package.json`:
   - Remove `next`, `@opennextjs/cloudflare`, `eslint-config-next`, `@tailwindcss/postcss`.
   - Add `vite`, `@vitejs/plugin-react`, `@cloudflare/vite-plugin`, `@tanstack/react-start`, `@tanstack/react-router`, `@tailwindcss/vite`, `@fontsource/libre-bodoni`, `@fontsource/courier-prime`, and compatible `wrangler` + `vitest`.
   - Update npm scripts: `dev` (`portless blog vite dev`), `build` (`vite build`), `preview` (`vite preview`), `deploy` (`vite build && wrangler deploy`), `upload` (`vite build && wrangler versions upload`), `typecheck`, `lint`, `test`, `cf-typegen`.
2. Create `vite.config.ts` with `cloudflare({ viteEnvironment: { name: "ssr" } })`, `tanstackStart()`, `tailwindcss()`, `viteReact()`, path alias `@` -> `src`, and compile-time `__APP_BUILD_ID__`.
3. Update `wrangler.jsonc` (`main: "./src/server.ts"`, `compatibility_date: "2026-04-14"`, `nodejs_compat`, preserve `vars`, `secrets`, `triggers.crons`, `routes`, `kv_namespaces`, remove OpenNext `.open-next/assets` block).
4. Update `tsconfig.json`, `vitest.config.ts`, `public/_headers`, `eslint.config.mjs`, and `src/types/cloudflare-workers.d.ts` + `src/test/cloudflare-workers.ts`.

### Phase 2: Native Cloudflare Runtime, Worker Entry, Links & Images
1. Refactor `src/lib/cloudflare-env.ts` to use native `"cloudflare:workers"` (`env`, `waitUntil`) directly instead of `@opennextjs/cloudflare`.
2. Extract pure legacy compatibility redirects into `src/lib/legacy-redirects.ts` (replacing `src/middleware.ts`).
3. Update `src/lib/edge-page-cache.ts` to bypass TanStack Start server-function/data requests cleanly alongside existing rules.
4. Create `src/server.ts` wrapping `@tanstack/react-start/server-entry` (`createServerEntry`) with legacy redirects, build-scoped edge HTML SWR cache, and the existing daily `0 18 * * *` X sync `scheduled()` handler.
5. Create `src/components/navigation/site-link.tsx` (`SiteLink`) and refactor all `next/link` imports across `src/components/*`.
6. Refactor `src/components/media/responsive-remote-image.tsx` and `src/components/shell/site-header.tsx` to drop `next/image` and use `src/lib/images/cloudflare.ts` + `src/domains/media/canonical-image.ts`.
7. Move `src/app/globals.css` -> `src/styles/globals.css`, wire `@fontsource/libre-bodoni` and `@fontsource/courier-prime`, and preserve all HeroUI v3 selective styles & theme tokens.

### Phase 3: TanStack Start Routes, SSR Layout, SEO & API Endpoints
1. Create `src/lib/seo-head.tsx` mapping `SeoDocument` -> TanStack Router `head()` `{ meta, links }` + `StructuredDataScripts`.
2. Create `src/router.tsx` (`getRouter()`) and `src/routes/__root.tsx` (HTML document, theme init script, stylesheet link, `SiteHeader`, `SiteFooter`, default 404 & error boundaries).
3. Create page routes:
   - `src/routes/index.tsx` (`/` with search param validation, server loader via `createServerFn`, `headers()`, `head()`, `ProfileHero`, `OverviewFeed`, `StructuredDataScripts`)
   - `src/routes/articles.$slug.tsx` (`/articles/$slug` with server loader, `notFound()`, `headers()`, `head()`, `ArticleDetailView`, `StructuredDataScripts`)
4. Create server routes:
   - `src/routes/api.health.ts` (`/api/health`)
   - `src/routes/sitemap[.]xml.ts` (`/sitemap.xml`)
   - `src/routes/[.]well-known.api-catalog.ts` (`/.well-known/api-catalog`)
   - `src/routes/media.$id.ts` (`/media/$id`)
5. Remove legacy Next.js / OpenNext files (`src/app/**`, `src/middleware.ts`, `src/worker.ts`, `next.config.ts`, `open-next.config.ts`, `image-loader.ts`, `postcss.config.mjs`, `next-env.d.ts`).

### Phase 4: Tests, Build, Local Worker & Browser Verification, Living Docs
1. Update route/SEO/redirect/image tests to match TanStack Start modules and verify `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
2. Measure new Worker bundle size and client JS/CSS sizes vs Next.js + OpenNext baseline.
3. Verify local Cloudflare Workers preview (`vite preview` / `wrangler dev`) via `curl` across all routes and edge cache `miss -> hit`.
4. Verify in a real browser: `/` hydration (`3` columns, `reveal="ready"`, filter tabs, theme toggle, `/media/` images), `/articles/grpc-gateway-comparison` (HeroUI table + Shiki), and `/articles/screenshot-render` (`<!--render-->` HTML + Shiki).
5. Update `docs/roadmap.md`, `docs/task-ledger.md`, and `docs/verification.md`.
