# Blog2 Verification Guide

## 2026-04-14 Current Astro State

The current active runtime for `blog2` is Astro + the official Cloudflare adapter.

Most older verification notes below remain historically useful, but they describe earlier Next.js phases. Use the evidence below as the current truth for the migration state.

## 2026-05-04 Standalone Repo Verification

The app now lives in the standalone repository root at `/Users/sorcererxw/repo/sorcererxw/blog`.

Use these root-level commands for current work:

- `pnpm install`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm preview --host 127.0.0.1 --port 3203`

For HTTP verification after preview starts:

- `curl --max-time 15 -I http://127.0.0.1:3203/`
- `curl --max-time 15 -I http://127.0.0.1:3203/blog`
- `curl --max-time 15 -I http://127.0.0.1:3203/thoughts`
- `curl --max-time 15 -i http://127.0.0.1:3203/api/health`

Historical commands using `pnpm --dir web --filter blog2 ...` apply to the old `tempura` monorepo layout only.

Current evidence:

- `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx src/domains/article/article-list.test.tsx src/domains/article/article-detail-view.test.tsx src/domains/thoughts/thoughts-page.test.tsx src/lib/legacy-locale-redirect.test.ts src/styles/scroll-behavior.test.ts src/pages/api/health.test.ts`: PASS (`62` tests)
- `pnpm --dir web --filter blog2 typecheck`: PASS with only `2` remaining hints
- `pnpm --dir web --filter blog2 build`: PASS after moving article detail to on-demand rendering
- `pnpm --dir web --filter blog2 exec astro preview --host 127.0.0.1 --port 3203`: PASS
- `curl --max-time 15 -I http://127.0.0.1:3203/`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3203/blog`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3203/thoughts`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3203/projects`: `200 OK`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 15 -I http://127.0.0.1:3203/stack`: `200 OK`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 20 -I http://127.0.0.1:3203/articles/stop-migrate-nextjs-to-astro`: `200 OK`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 20 -I http://127.0.0.1:3203/articles/not-a-real-slug`: `404 Not Found`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 15 -i http://127.0.0.1:3203/api/health`: `200 OK`
- `curl --max-time 15 -i http://127.0.0.1:3203/api/cron/thoughts`: `410 Gone`
- `curl --max-time 15 -I http://127.0.0.1:3203/en`: `301 Moved Permanently` to `/`
- `curl --max-time 15 -I http://127.0.0.1:3203/zh/blog`: `301 Moved Permanently` to `/blog`
- `curl --max-time 20 -L -s http://127.0.0.1:3203/articles/stop-migrate-nextjs-to-astro | rg -n "Back to the archive|放弃从 Next.js 迁移到 Astro.js"`: confirms article detail body and archive CTA
- `curl --max-time 20 -L -s http://127.0.0.1:3203/articles/not-a-real-slug | rg -n "Page not found.|Open archive|The requested article is missing"`: confirms the page-level boundary for missing slugs
- `find src/app -maxdepth 3 -type f`: no results, the old Next route tree is retired
- `rg -n "from 'next|from \"next|next/|src/app/|@/app/" src -S`: no results, runtime code no longer depends on Next

Current known risk:

- Notion and Telegram runtime credentials now resolve from environment variables in `src/config/server.ts`; deployments must provide the corresponding secrets out of band

## Purpose

This file defines how to verify work in the standalone blog repo.

Every substantial task should use the smallest verification set that can still prove the behavior. When possible, verify at three levels:

- automated tests
- HTTP checks
- browser verification

## Verification Layers

### 1. Automated Tests

Use automated tests for:

- content normalization
- storage abstractions
- domain use cases
- route handlers
- utility logic

Preferred pattern:

- run the narrowest relevant test first
- then run the next broader test scope if the slice touches multiple units

Record:

- exact command
- pass/fail result
- any skipped coverage and why

## 2. HTTP Verification

Use `curl` or equivalent for:

- route handlers
- JSON endpoints
- sitemap
- metadata endpoints
- server-rendered pages when an HTTP-level sanity check is useful

Check for:

- status code
- headers when relevant
- response shape
- obvious content regressions

Record:

- exact command
- response summary
- any important headers or body details

## 3. Browser Verification

Use real browser verification for:

- page rendering
- hydration
- navigation
- interactive UI
- visual regressions
- translated content display
- comments or embeds

Check for:

- page loads without runtime errors
- expected content appears
- navigation and interactive elements work
- no obvious layout breakage
- no browser console errors that block the feature

Record:

- page/route tested
- action performed
- outcome
- important console/runtime issues if any

## Required Minimum by Change Type

### Logic-only change

- targeted automated tests

### Server/API change

- targeted automated tests
- `curl` verification

### UI/page change

- targeted automated tests when applicable
- browser verification

### End-to-end feature slice

- targeted automated tests
- `curl` verification where applicable
- browser verification

## Local Verification Expectations

Once the app scaffold exists, common verification should include:

- install/build sanity
- targeted test commands
- local page load checks
- browser-based validation of the changed route

Do not declare a task complete solely because the code compiles.

## Recording Format

When updating `docs/task-ledger.md`, write verification entries like:

- `pnpm test -- --runInBand src/domains/article/article.test.ts`: PASS
- `curl -I http://localhost:3000/en/blog`: 200 OK
- `browser check /en/blog`: page rendered, no blocking console errors

Use real commands and real outcomes. Avoid vague wording such as "tested locally".

## Failure Handling

If verification fails:

- record the failure
- do not claim success
- either fix the issue or explicitly mark the task as blocked/incomplete

If a verification step cannot be run:

- record exactly why
- state what was verified instead
- leave a follow-up item if the missing verification still matters

## 2026-04-14 Astro Migration Planning Verification

This slice created migration design and planning docs only. No runtime code changed.

Verification for this planning slice should record:

- current-state code inspection commands
- roadmap/spec/task-ledger alignment checks
- official Astro documentation reviewed for Next.js migration, Cloudflare adapter behavior, and rendering modes

Do not claim implementation verification yet. The Astro migration needs a separate runtime verification pass once code changes begin.

Captured baseline evidence for the current Next.js app:

- escalated `pnpm --dir /Users/sorcererxw/repo/sorcererxw/tempura/web --filter blog2 build`: PASS in `46s`
- direct `pnpm --dir /Users/sorcererxw/repo/sorcererxw/tempura/web --filter blog2 exec next dev --hostname 127.0.0.1 --port 3102`: server ready in `343ms`
- `pnpm --dir /Users/sorcererxw/repo/sorcererxw/tempura/web --filter blog2 dev -- --hostname 127.0.0.1 --port 3102`: FAIL, Next interpreted `--hostname` as a project directory
- `curl --max-time 15 -I http://127.0.0.1:3102/`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3102/blog`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3102/articles/stop-migrate-nextjs-to-astro`: `200 OK`, `x-nextjs-prerender: 1`
- `curl --max-time 15 -I http://127.0.0.1:3102/projects`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3102/stack`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3102/thoughts`: `200 OK`
- `curl --max-time 15 -i http://127.0.0.1:3102/api/health`: `200 OK`
- `curl --max-time 15 -i http://127.0.0.1:3102/api/cron/thoughts`: `410 Gone`
- `curl --max-time 15 -s http://127.0.0.1:3102/ | rg -n "<title>|<meta name=\"description\""`: confirms home title and Notion-derived description are currently route-owned metadata
- `bb-browser open http://127.0.0.1:3102/stack; sleep 2; bb-browser eval "document.body.innerText.slice(0,400)"`: confirms the browser-visible stack page currently shows the shell nav plus `Stack`, `Platform`, and `Category`
- `bb-browser open http://127.0.0.1:3102/thoughts; sleep 2; bb-browser eval "document.body.innerText.slice(0,500)"`: confirms the browser-visible thoughts page currently renders live snapshot-backed content, not just an empty state

## 2026-04-15 Cloudflare Image Delivery Planning Verification

This slice created image-delivery design and planning docs only. No runtime code changed.

Verification for this planning slice should record:

- current-state image-surface inventory commands
- roadmap/spec/plan/task-ledger alignment checks
- official Cloudflare image-transformation documentation and Astro Cloudflare documentation reviewed for the chosen runtime path

Do not claim implementation verification yet. The image-delivery plan needs a separate runtime pass once code changes start.

Recommended implementation evidence set for this slice:

- `pnpm --dir web --filter blog2 test -- <touched image helper tests> <touched component tests>`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`

## 2026-04-15 Search-Native SEO Planning Verification

This slice created SEO design and planning docs only. No runtime code changed.

Verification for this planning slice should record:

- current-state route and layout inspection commands
- roadmap/spec/plan/task-ledger alignment checks
- external reference review for search-result snippets, article structured data, and schema/image expectations
- plan-review findings that changed scope or sequencing

Do not claim runtime verification yet. The SEO slice needs a separate implementation pass once route code changes begin.

Recommended implementation evidence set for this slice:

- `pnpm --dir web --filter blog2 test -- <touched seo builder tests> <touched route tests>`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl --max-time 20 -s <route> | rg -n "<title>|<meta|application/ld\\+json|canonical"`
- `curl --max-time 20 -s <sitemap-route>`
- `curl --max-time 20 -s <robots-route>`
- browser verification for one article page and the query-entry page
- run the snippet-preview command and record the output summary in `docs/task-ledger.md`

## 2026-04-15 Search-Native SEO Implementation Verification

This slice changed route rendering, HTML head output, collection-page copy, and public discovery routes.

Minimum evidence for this implementation slice:

- targeted tests for SEO builders and route handlers
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl` checks for:
  - `/blog`
  - one known article detail route
  - `/topics/astro-cloudflare-publishing`
  - `/robots.txt`
  - `/sitemap.xml`
- browser verification for:
  - `/blog`
  - `/topics/astro-cloudflare-publishing`
- run `pnpm --dir web/apps/blog2 run seo:preview` against the local preview server and record whether any route is still flagged with `weakCopy`
- `pnpm --dir web --filter blog2 exec astro preview --host 127.0.0.1 --port <port>`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/ | rg -n "/cdn-cgi/image/"`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/blog | rg -n "/cdn-cgi/image/"`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/articles/<real-slug> | rg -n "/cdn-cgi/image/"`
- browser verification for `/`, `/blog`, `/articles/<real-slug>`, and `/thoughts` confirming transformed URLs, stable layout, and no blocking runtime errors

## 2026-04-15 Cloudflare Image Delivery Implementation Verification

Use this evidence set for the first working image-delivery slice:

- `pnpm --dir web --filter blog2 test -- src/domains/media/canonical-image.test.ts src/lib/images/cloudflare.test.ts 'src/pages/media/[id].test.ts' src/domains/article/article-list.test.tsx src/domains/article/article-detail-view.test.tsx src/domains/home/intro.test.tsx src/domains/thoughts/thoughts-page.test.tsx`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `pnpm --dir web --filter blog2 run preview -- --host 127.0.0.1 --port <port>`
- `curl --max-time 20 -I http://127.0.0.1:<port>/blog`
- `curl --max-time 20 -I http://127.0.0.1:<port>/articles/<real-slug>`
- `curl --max-time 20 -I http://127.0.0.1:<port>/thoughts`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/blog | rg -n "/cdn-cgi/image/|/media/"`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/articles/<real-slug> | rg -n "/cdn-cgi/image/|/media/"`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/thoughts | rg -n "/cdn-cgi/image/|/media/"`
- `curl --max-time 20 -i 'http://127.0.0.1:<port>/media/<id>?u=<encoded-source>' | head -n 20`
- browser verification that page markup emits transformed URLs and that canonical `/media/[id]` routes are reachable

Important local-preview limitation:

- local `astro preview` for `@astrojs/cloudflare` does **not** emulate Cloudflare's `/cdn-cgi/image` endpoint
- as a result, local browser checks can confirm that the page emits the transformed URLs, but image decode through those URLs may still show `naturalWidth = 0`
- treat deployed-worker verification as the final proof for transformed-image rendering, while using local preview to validate page markup, route behavior, and canonical media fallback

Important local-build limitation:

- Miniflare-backed local `astro build` can fail with `SQLITE_BUSY_RECOVERY` if multiple Cloudflare-aware checks run concurrently in the same workspace
- when that happens, rerun `build` in isolation before treating it as a code regression

## 2026-04-14 Astro Platform Rebase Verification

Use this evidence set for the first working Astro route-layer cutover:

- `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx src/domains/article/article-list.test.tsx src/domains/article/article-detail-view.test.tsx src/lib/legacy-locale-redirect.test.ts`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `pnpm --dir web --filter blog2 exec astro preview --host 127.0.0.1 --port 3203`
- `curl --max-time 15 -I http://127.0.0.1:3203/`
- `curl --max-time 15 -I http://127.0.0.1:3203/blog`
- `curl --max-time 15 -I http://127.0.0.1:3203/articles/stop-migrate-nextjs-to-astro`
- `curl --max-time 15 -I http://127.0.0.1:3203/projects`
- `curl --max-time 15 -I http://127.0.0.1:3203/stack`
- `curl --max-time 15 -I http://127.0.0.1:3203/thoughts`
- `curl --max-time 15 -i http://127.0.0.1:3203/api/health`
- `curl --max-time 15 -i http://127.0.0.1:3203/api/cron/thoughts`
- `curl --max-time 15 -I http://127.0.0.1:3203/en`
- `curl --max-time 15 -I http://127.0.0.1:3203/zh/blog`
- `bb-browser open http://127.0.0.1:3203/; sleep 2; bb-browser eval "document.body.innerText.slice(0,300)"`
- `bb-browser open http://127.0.0.1:3203/thoughts/; sleep 2; bb-browser eval "document.body.innerText.includes('No thoughts published yet.') || document.body.innerText.includes('Replying to') || document.body.innerText.includes('Forwarded from')"`

Current evidence:

- targeted shell/article/redirect tests: PASS (`63` tests total in the current Vitest run)
- `astro check`: PASS with hints only after excluding test files from the Astro typecheck scope
- `astro build`: PASS with the Cloudflare adapter after switching Shiki code highlighting to an explicit JavaScript regex engine
- `astro preview`: PASS on `http://127.0.0.1:3203`
- `/`: `200 OK`
- `/projects`: `200 OK` with `cache-control: public, max-age=0, s-maxage=600`
- `/stack`: `200 OK` with `cache-control: public, max-age=0, s-maxage=600`
- `/api/health`: `200 OK`
- `/api/cron/thoughts`: `410 Gone`
- `/en`: `301 Moved Permanently` to `/`
- `/zh/blog`: `301 Moved Permanently` to `/blog`
- browser-visible home page in Astro preview shows the shell and current home content
- browser-visible thoughts page in Astro preview renders real snapshot-backed content
- `rg -n "from 'next|from \"next|next/|src/app/|@/app/" src -S`: no remaining runtime references to Next or `src/app/**`
- `find src/app -maxdepth 3 -type f`: no remaining files, the old app runtime tree has been retired
- initial Astro preview runs returned `307 Temporary Redirect` responses to trailing-slash URLs, but this was fixed by switching Astro to `build.format: "file"` with `trailingSlash: "never"`
- current verification now shows `/blog`, `/thoughts`, and article detail routes return `200 OK` without the old redirect

Post-retirement follow-up evidence:

- `pnpm --dir web install --no-frozen-lockfile`: PASS after removing `next`, `next-themes`, and `next-env.d.ts`
- `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx src/domains/article/article-list.test.tsx src/domains/article/article-detail-view.test.tsx src/domains/thoughts/thoughts-page.test.tsx src/lib/legacy-locale-redirect.test.ts src/styles/scroll-behavior.test.ts src/pages/api/health.test.ts`: PASS (`62` tests)
- `pnpm --dir web --filter blog2 typecheck`: PASS with hints only after removing the old app route tree
- one retry of `pnpm --dir web --filter blog2 build`: FAIL due upstream Notion timeouts (`RequestTimeoutError`) and one `Network connection lost` event while article detail pages were still fully prerendered
- after switching `src/pages/articles/[slug].astro` to on-demand rendering with `Cache-Control: public, max-age=0, s-maxage=600`, `pnpm --dir web --filter blog2 build`: PASS in `9.94s`
- after removing the temporary `next` runtime dependency, `pnpm --dir web --filter blog2 build`: PASS again with article detail still on-demand
- `pnpm --dir web --filter blog2 exec astro preview --host 127.0.0.1 --port 3203`: PASS
- `curl --max-time 20 -I http://127.0.0.1:3203/articles/stop-migrate-nextjs-to-astro`: `200 OK`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 20 -I http://127.0.0.1:3203/articles/not-a-real-slug`: `404 Not Found`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 20 -L -s http://127.0.0.1:3203/articles/stop-migrate-nextjs-to-astro | rg -n "Back to the archive|放弃从 Next.js 迁移到 Astro.js"`: confirms article detail body and archive CTA render in Astro preview
- `curl --max-time 20 -L -s http://127.0.0.1:3203/articles/not-a-real-slug | rg -n "Page not found.|Open archive|The requested article is missing"`: confirms missing article slugs render the page-level boundary

## Blog2 Foundation Harness

Use these commands for the current foundation slice:

- `pnpm --dir web --filter blog2 test -- src/config/env.test.ts app/api/health/route.test.ts`
- `pnpm --dir web --filter blog2 test`
- `pnpm --dir web --filter blog2 lint`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl -i http://127.0.0.1:3001/api/health`

Browser verification is not required for this slice because the task adds test infrastructure and a server health route, not a rendered UI change. If a future task changes page rendering, browser verification becomes mandatory again.

## Current Public Slice Verification Notes

The current worktree includes several rendered public slices. Use the actual evidence that exists for each slice:

- `article listing`: `pnpm --dir web --filter blog2 test -- src/domains/article/list-articles.test.ts`, `pnpm --dir web --filter blog2 lint`, `pnpm --dir web --filter blog2 typecheck`, `pnpm --dir web --filter blog2 build`, `curl -I http://localhost:3001/en/blog`
- `thoughts`: `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts src/domains/thoughts/list-thoughts.test.ts`, `pnpm --dir web --filter blog2 typecheck`, browser verification for `http://localhost:3001/thoughts`
- `thoughts direct Telegram`: `pnpm --dir web --filter blog2 test -- src/domains/thoughts/list-thoughts.test.ts src/integrations/telegram/thoughts.test.ts`, `pnpm --dir web --filter blog2 typecheck`, `pnpm --dir web --filter blog2 build`, `pnpm --dir web --filter blog2 exec opennextjs-cloudflare build`, `curl -I http://localhost:3001/thoughts`
- `homepage intro`: `pnpm --dir web --filter blog2 test -- src/domains/home/intro.test.tsx`, `pnpm --dir web --filter blog2 lint`, `pnpm --dir web --filter blog2 typecheck`, `curl -I http://localhost:3001/en`
- `shared shell`: `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx`, `pnpm --dir web --filter blog2 exec eslint 'app/[lang]/layout.tsx' src/domains/shell/site-header.tsx src/domains/shell/site-footer.tsx src/domains/shell/site-links.ts src/domains/shell/site-shell.test.tsx`, `pnpm --dir web --filter blog2 typecheck`, `pnpm --dir web --filter blog2 build`, `curl -I http://localhost:3001/en`

Browser MCP note:

- browser navigation has been repeatedly blocked by the local Chrome profile lock at `/Users/bytedance/Library/Caches/ms-playwright/mcp-chrome`
- when browser MCP is blocked, the fallback evidence used so far has been `curl`, `nextjs_call get_errors`, and `nextjs_call get_page_metadata` where applicable
- do not claim browser success unless a browser session actually completed without the profile-lock error

For future rendered-page slices, prefer recording all three layers when available:

- narrow automated tests
- `curl`/HTTP evidence
- browser verification or an explicit profile-lock blocker note

## 2026-03-31 Direct Telegram Thoughts Verification

Use this evidence set for the current thoughts migration away from cron/KV snapshots:

- `pnpm --dir web --filter blog2 test -- src/domains/thoughts/list-thoughts.test.ts src/integrations/telegram/thoughts.test.ts`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `pnpm --dir web --filter blog2 exec opennextjs-cloudflare build`
- `pnpm --dir web --filter blog2 dev`
- `curl -I http://localhost:3001/thoughts`
- `curl -s http://localhost:3001/thoughts | rg -n "No thoughts published yet|Open in Telegram|tech_bb"`

Current evidence:

- targeted thoughts/direct-Telegram tests: PASS
- `typecheck`: PASS
- `build`: PASS, but Wrangler/workerd still warns that `TelegramThoughtsCoordinatorObject` is not exported from the worker during local validation
- `opennextjs-cloudflare build`: PASS
- local `/thoughts` route: `200 OK`
- local `/thoughts` HTML: renders the explicit empty state instead of demo thoughts when live Telegram content is unavailable

Interpretation:

- the page now behaves like a direct-read surface from the app's perspective
- the public fallback changed from demo content to empty state as intended
- no Durable Object wiring remains in the worker configuration; the remaining verification risk is Telegram runtime behavior itself

## 2026-04-06 Thoughts Snapshot Verification

Use this evidence set for the current snapshot-based thoughts migration:

- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/domains/thoughts/list-thoughts.test.ts src/domains/thoughts/sync-thoughts.test.ts src/integrations/telegram/thoughts.test.ts`
- `pnpm --dir web --filter blog2 build`
- `pnpm --dir web --filter blog2 sync:thoughts`
- `curl -I http://localhost:3000/thoughts`
- `curl -s http://localhost:3000/thoughts | rg -n "No thoughts published yet|Forwarded from|Preview title|reply child|photo parent"`
- Next.js MCP `get_errors`
- `bb-browser open http://localhost:3005/thoughts`
- `bb-browser snapshot -i -c -d 4`
- `bb-browser errors`
- `bb-browser console`
- `bb-browser eval "document.body.innerText"`

Current evidence:

- targeted snapshot thoughts tests: PASS (`60` tests total in the current Vitest run, including the new snapshot loader, static page, and sync command tests)
- `build`: PASS; `/thoughts` is emitted as `○ /thoughts`
- `sync:thoughts`: FAILS fast with a clear env requirement message when `TELEGRAM_APP_ID`, `TELEGRAM_APP_SECRET`, and `TELEGRAM_TOKEN` are unset
- `curl -I http://localhost:3000/thoughts`: `200 OK`
- `curl -s http://localhost:3000/thoughts | rg -n "No thoughts published yet"`: confirmed the page renders the checked-in empty snapshot state
- Next.js MCP `get_errors`: `{"configErrors":[],"sessionErrors":[]}`
- `bb-browser snapshot -i -c -d 4`: page opened successfully on `http://localhost:3005/thoughts`
- `bb-browser errors`: no JS errors
- `bb-browser console`: only React DevTools + HMR connection messages
- `bb-browser eval "document.body.innerText"`: confirmed the browser-visible body includes `No thoughts published yet.`

Interpretation:

- `/thoughts` now renders from a checked-in snapshot instead of runtime Telegram or KV reads
- the public route is static and build-backed
- the local sync command is wired into the package scripts and fails clearly when credentials are missing
- browser verification confirms the empty snapshot state renders cleanly with no runtime JS errors

## 2026-03-31 Thoughts Page Alignment Verification

Use this evidence set for the route-owned Telegram presentation alignment:

- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts`
- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts src/domains/thoughts/list-thoughts.test.ts`
- `pnpm --dir web --filter blog2 typecheck`
- `rg -n "thoughts-feed|ThoughtsFeed" web/apps/blog2/src -S`
- browser verification for `http://localhost:3001/thoughts`

Current evidence:

- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts`: PASS after adding route-level regression coverage for old-blog-aligned cards and null Telegram history handling
- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts`: PASS after adding regression coverage for photo media, visible Telegram jump links, and local reply-link continuity
- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts src/domains/thoughts/list-thoughts.test.ts`: PASS
- `pnpm --dir web --filter blog2 typecheck`: PASS
- `rg -n "thoughts-feed|ThoughtsFeed" web/apps/blog2/src -S`: no matches after deleting the old `thoughts-feed` layer
- Next.js browser automation on `http://localhost:3001/thoughts`: PASS for page load and DOM inspection; the page exposed `261` Telegram links and rendered live thoughts content in the session
- Next.js browser DOM inspection after the follow-up interaction/media fix: `hasOpenInTelegram: true`, `telegramLinks: 522`, `localReplyLinks: 36`
- `curl --max-time 10 -I http://127.0.0.1:3001/thoughts`: timed out in this session, so direct HTTP verification remains anomalous even though browser automation reached the route

Interpretation:

- `/thoughts` now owns Telegram card rendering directly and no longer depends on the deleted `thoughts-feed` component
- the route renders live Telegram-linked message cards rather than the old simplified text-only layout
- the main remaining verification gap is the inconsistent local `curl` reachability to the running dev server

## 2026-03-29 Blog Archive Ledger Slice

Use this evidence set for the current `/blog` archive redesign:

- `pnpm --dir web --filter blog2 test -- src/domains/article/article-list.test.tsx`
- `pnpm --dir web --filter blog2 typecheck`
- `curl --max-time 15 -I http://localhost:3000/en/blog` once the local Next workspace-resolution issue is fixed
- browser verification for `/en/blog` on desktop and mobile once the local Next workspace-resolution issue is fixed

Current blocker note:

- `next dev` currently starts but route compilation falls into a bad module-resolution state that tries to resolve `tailwindcss` from `web/apps`, which prevents reliable HTTP and browser verification in this worktree

## 2026-03-29 Old Blog Structure Migration Verification

Use this evidence set for the current public-UI migration that copies `web/apps/blog` structure into `blog2`:

- `pnpm --dir web --filter blog2 test`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `pnpm --dir web --filter blog2 dev`
- route checks for `/en`, `/en/blog`, `/en/thoughts`, `/en/projects`, `/en/stack`

Current evidence:

- `pnpm --dir web --filter blog2 test`: PASS (`16` files, `44` tests)
- `pnpm --dir web --filter blog2 typecheck`: PASS
- `pnpm --dir web --filter blog2 build`: FAIL after multiple unrelated UI primitive issues surfaced outside the migrated page domains. Current blocking failures moved from stale local `lucide-react.d.ts`, to React 19 primitive typing, and then to `src/components/ui/drawer.tsx`
- `pnpm --dir web --filter blog2 dev`: starts on `http://localhost:3001`, but route compilation is blocked by `Can't resolve 'tailwindcss' in '/Users/bytedance/repo/github.com/sorcererxw/tempura/web/apps'`
- `curl -i http://localhost:3001/en`, `/en/blog`, `/en/thoughts`, `/en/projects`: all hang while the dev server is in the broken module-resolution state

Interpretation:

- the migrated public page tests are green
- app-level verification is still incomplete because the current worktree has unrelated primitive/runtime debt that prevents a clean `build` and route rendering

## 2026-03-29 Shadcn Convergence Verification

Use this evidence set for the business-domain shadcn convergence slice that touched `stack`, `projects`, `thoughts`, `home intro`, and `article detail`:

- `pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx src/domains/projects/projects-list.test.tsx`
- `pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx`
- `pnpm --dir web --filter blog2 test -- src/domains/home/intro.test.tsx src/domains/article/article-detail-view.test.tsx`
- `pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx src/domains/projects/projects-list.test.tsx src/domains/thoughts/thoughts-feed.test.tsx src/domains/home/intro.test.tsx src/domains/article/article-detail-view.test.tsx`

Current evidence:

- `pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx src/domains/projects/projects-list.test.tsx`: PASS during the stack/projects convergence phase
- `pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx`: PASS after the final `thoughts-feed` fixes
- `pnpm --dir web --filter blog2 test -- src/domains/home/intro.test.tsx src/domains/article/article-detail-view.test.tsx`: PASS after the final intro/article fixes
- `pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx src/domains/projects/projects-list.test.tsx src/domains/thoughts/thoughts-feed.test.tsx src/domains/home/intro.test.tsx src/domains/article/article-detail-view.test.tsx`: PASS (`16` files, `49` tests)

Reviewer evidence:

- `thoughts-feed`: final reviewer pass with no findings after quote-rendering and explicit-link fixes
- `intro`: final reviewer pass with no findings after replacing `Alert` semantics with `Card` presentation for static callouts
- `article-detail-view`: final reviewer pass with no findings after bookmark/separator convergence

Current blocker note:

- browser and HTTP verification for these routes is still blocked by the existing local `next dev` module-resolution issue already documented in this file; do not claim rendered-route verification until that blocker is resolved
