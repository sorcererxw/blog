# OpenNext Next.js Rebuild Plan

## Status

Done for the active runtime rebase.

## Goal

Make Next.js + OpenNext the active runtime for the standalone Personal Site while preserving current public behavior.

## Slice 1: Platform and Route Rebase

Status: done.

Files:

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `open-next.config.ts`
- `wrangler.jsonc`
- `src/app/**`
- `src/middleware.ts`
- `src/lib/cloudflare-env.ts`

Work:

1. replace Astro scripts and dependencies with Next.js + OpenNext scripts and dependencies
2. add the Next App Router shell and metadata adapter
3. port current Astro pages and endpoints to Next routes
4. preserve cache-control, proxy-owned redirects, sitemap, static robots, health, cron, and media behavior
5. define runtime variables in Wrangler and read them through the OpenNext Cloudflare context

Verification:

- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm preview --hostname 127.0.0.1 --port 3203`
- HTTP checks for `/`, `/?type=writing`, `/blog` as `404`, `/projects`, `/thoughts`, `/articles/stop-migrate-nextjs-to-astro`, `/api/health`, `/api/cron/thoughts`, `/sitemap.xml`, `/robots.txt`
- browser verification for `/` and article detail

## Slice 2: Astro Retirement Cleanup

Status: done for active route/config files; historical docs remain for context.

Files:

- `astro.config.mjs`
- `src/pages/**`
- `src/layouts/**`
- pure redirect routes under `src/app/blog`, `src/app/projects`, `src/app/thoughts`, `src/app/en`, and `src/app/zh`
- `src/middleware.ts`
- `env.d.ts`
- docs and verification notes

Work:

1. delete retired Astro entrypoints after Next parity is proven
2. remove Astro-only type declarations and docs references
3. move compatibility redirects into middleware and delete thin redirect route handlers
4. remove historical topic/query pages that no longer match the Personal Site direction
5. keep domain components and approved CSS modules
6. update task ledger and roadmap with final evidence

Verification:

- rerun full Slice 1 verification after deleting Astro files

## Initial Acceptance Boundary

This task is not complete until the active package scripts build and preview the Next.js/OpenNext app. If a route is intentionally deferred, the task ledger must name it explicitly with the blocking reason.

## Slice 3: Custom Worker Entrypoint

Status: done.

Files:

- `src/worker.ts`
- `wrangler.jsonc`
- docs and verification notes

Work:

1. add a checked-in Worker module at `src/worker.ts`
2. delegate fetch handling to OpenNext's generated `.open-next/worker.js`
3. point Wrangler `main` at `src/worker.ts`
4. keep behavior unchanged until a future slice needs scheduled handlers, Durable Objects, or other Worker-level exports

Verification:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm exec opennextjs-cloudflare build`
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3205`
- HTTP checks for `/`, `/blog` as `404`, `/api/health`, and `/robots.txt`

## Slice 4: Middleware Redirect Consolidation

Status: done.

Files:

- `src/middleware.ts`
- deleted pure redirect route handlers under `src/app/blog`, `src/app/projects`, `src/app/thoughts`, `src/app/en`, and `src/app/zh`
- `src/middleware.test.ts`
- docs and verification notes

Work:

1. move legacy archive and locale redirect logic into middleware
2. keep the redirect mapping local to middleware
3. delete route handlers whose only job was redirecting
4. verify OpenNext still builds and previews the Worker successfully

Verification:

- `pnpm test -- src/middleware.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm exec opennextjs-cloudflare build`
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3207`
- HTTP checks for `/blog` as `404`, `/projects`, `/thoughts`, `/en/blog` canonicalizing to `/blog`, `/zh/articles/modern-astro`, and `/articles/modern-astro`

## Slice 7: Notion Env Public Read Path

Status: done.

Work:

1. read `NOTION_BLOG_DATABASE_ID`, `NOTION_PROJECTS_DATABASE_ID`, and `NOTION_INTRO_PAGE_ID` from Worker env instead of runtime hardcoded ids
2. keep `NOTION_SECRET` as the only secret required for Notion reads
3. preserve Notion page covers in writing feed cards and article detail heroes
4. keep `/blog` absent while `/?type=writing` remains the writing filter state

Verification:

- `pnpm cf-typegen`
- targeted Notion/feed/article/middleware tests
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- HTTP and browser checks for `/`, `/?type=writing`, `/articles/<real-slug>`, `/blog` as `404`, and `/sitemap.xml`

## Slice 8: Runtime Synthetic Fallback Removal

Status: done.

Work:

1. remove runtime synthetic article, article detail, home intro, project, and stack records from Notion adapters
2. keep test mocks inside test files only
3. make production fail fast when required Notion credentials or ids are absent
4. let non-production render empty lists, empty profile content, or missing article results instead of synthetic content

Verification:

- `rg` check for runtime synthetic fallback records
- targeted Notion, sitemap, and stack tests
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- HTTP checks for `/`, `/?type=projects`, and `/sitemap.xml`

## Slice 5: Wrangler Env Consolidation

Status: done.

Files:

- `wrangler.jsonc`
- `.dev.vars.example`
- `cloudflare-env.d.ts`
- `src/lib/cloudflare-env.ts`
- deleted `src/config/**`
- docs and verification notes

Work:

1. move non-secret runtime variables to `wrangler.jsonc` `vars`
2. define `NOTION_SECRET` through Wrangler `secrets.required`
3. regenerate `cloudflare-env.d.ts` from `wrangler.jsonc`
4. remove the repo-local `src/config` package
5. update runtime code to read env through OpenNext Cloudflare context

Verification:

- `pnpm cf-typegen`
- `pnpm test -- src/lib/cloudflare-env.ts src/app/api/health/route.test.ts src/integrations/notion/projects.test.ts src/integrations/notion/article-detail.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm exec opennextjs-cloudflare build`
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3208`

## Slice 6: Next Font Ownership

Status: done.

Files:

- `src/app/layout.tsx`
- `src/app/globals.css`
- docs and verification notes

Work:

1. replace hand-authored Google Fonts preconnect/stylesheet tags with `next/font/google`
2. expose the existing sans, UI, editorial, and heading font families through Next Font CSS variables on `<html>`
3. keep Tailwind `font-sans`, `font-serif`, `font-mono`, and `font-heading` wired through theme variables
4. remove hand-written font-family definitions from global CSS except the local monospace fallback

Verification:

- `pnpm test -- src/domains/shell/site-shell.test.tsx src/domains/home/intro.test.tsx`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- HTTP/HTML check for `/` to confirm no `fonts.googleapis.com` or `fonts.gstatic.com` links and the Next Font variable classes render on `<html>`
