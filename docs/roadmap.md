# Personal Site Roadmap

## Mission

Maintain the standalone Personal Site application in `/Users/sorcererxw/repo/sorcererxw/blog`, deployed on Cloudflare.

The product direction is now overview-first: one public homepage with a Profile Hero and unified masonry Overview Feed for writing, projects, and social posts.

## Architecture Direction

- `docs/specs/2026-05-13-opennext-nextjs-rebuild-design.md` supersedes the Astro runtime direction and makes OpenNext + Next.js the active platform target
- the rebuild keeps the Personal Site product model from `docs/specs/2026-05-12-personal-site-overview-design.md`
- `docs/specs/2026-05-17-telegram-public-page-runtime-ingestion-design.md` replaces the checked-in Telegram snapshot flow with runtime public-page crawling plus Next revalidation
- `docs/specs/2026-05-18-provider-kv-cache-design.md` keeps external provider caching at the route assembly boundary through thin `BLOG_CACHE` wrappers instead of embedding cache policy inside Notion or Telegram providers
- repository extraction from `tempura/web/apps/blog2` to standalone `/Users/sorcererxw/repo/sorcererxw/blog` happened on 2026-05-04 with `blog2` history preserved
- the previous Astro migration remains historical context, not the target architecture

## Documentation Shape

- active design and plan docs stay in `docs/specs/` and `docs/plans/`
- superseded migration and product-history docs live under `docs/archive/specs/` and `docs/archive/plans/`
- route-specific docs for removed public pages also move to `docs/archive/`
- future agents should read archived docs only when a task explicitly needs historical context
- living state stays in `docs/roadmap.md`, `docs/task-ledger.md`, and `docs/verification.md`

## Current Product Boundaries

Included:

- one primary public homepage
- Profile Hero sourced from Notion
- Overview Feed built from writing, projects, and social posts
- article detail pages as deep-linked Content Details
- proxy-owned compatibility redirects for supported old non-blog archive and locale routes
- sitemap and metadata
- content normalization from multiple sources
- translation and related async workflows
- image metadata support for rendered content

Excluded:

- `fusink`
- route management/admin tooling
- generic OAuth/admin flows from the old backend
- non-blog backend products
- standalone social-post detail pages
- Stack Inventory page, navigation, and Stack-specific provider/cache pipeline

## Source of Truth and Storage

- Source of truth for Profile Hero: Notion, with a one hour freshness target
- Source of truth for Blog Entries and Projects: Notion through Wrangler-owned database id vars unless a later source-specific spec changes this
- Source of truth for Social Posts: their external Social Sources; Telegram currently uses public `t.me/s/tech_bb` pages
- App-owned derived storage: Cloudflare KV or the existing storage abstraction
- Public route provider acceleration: Cloudflare KV wraps external providers at assembly time with a ten minute TTL
- Overview Feed Index freshness target: ten minutes
- Telegram public-page crawl freshness target: ten minutes through Next fetch revalidation
- Future escape hatch: optional partial migration to D1 if KV-only storage becomes too awkward for async workflows

## Milestones

### M0: Documentation and Operating Harness

Status: Done

Goals:

- establish the design spec
- establish `AGENTS.md`
- establish roadmap, task ledger, and verification docs
- create a working execution harness for future agents

Exit criteria:

- the operating docs exist at the standalone repo root and under `docs/`
- future work can be executed without rereading the entire repository

### M1: App Foundation

Status: Done for the active OpenNext + Next.js runtime baseline

Goals:

- preserve the current Personal Site public behavior while the framework baseline moves to Next.js App Router + OpenNext on Cloudflare Workers
- keep the shared domain/integration code reusable during the route-layer cutover
- configure the OpenNext/Cloudflare deployment baseline
- establish the target env and binding model
- preserve base layout, shell, logging, and boundary behavior during the migration

Exit criteria:

- the app builds
- the app can run locally
- the app can be deployed to Cloudflare in a minimal OpenNext-backed state
- remaining developer-experience polish can be deferred if it does not block public-read migration

### M2: Public Read Path

Status: Superseded by M2a

Goals:

- implement article listing
- implement article detail rendering
- implement projects
- implement sitemap
- implement Notion fetch + normalization + KV-backed caching

Exit criteria:

- main public pages render from `blog2`
- public read traffic no longer requires the old public blog backend for these slices

### M2a: Personal Site Overview

Status: Implemented locally, pending deploy verification

Goals:

- implement the Notion-backed Profile Hero
- implement the normalized Overview Feed Index
- render one masonry Overview Feed from Blog Entries, Projects, and Social Posts
- support Feed Filters on `/` without reintroducing public archive pages
- preserve article detail pages as Content Details
- convert supported old archive pages into Compatibility Routes while keeping `/blog` absent

Exit criteria:

- `/` is the primary public product surface
- feed sorting follows Displayed Time rules
- untimed items appear at the bottom
- `/blog` returns `404`, while `/projects` and `/thoughts` no longer render primary archive experiences
- verification covers tests, HTTP checks, and browser rendering

### M3: Secondary Public Features

Status: In progress, with Telegram public-page runtime ingestion and sitewide SEO/GEO discovery hygiene implemented locally and pending deploy verification

Goals:

- implement thoughts / Telegram-driven public content from public pages
- implement X as a fixed Social Source for `https://x.com/sorcererxw` through daily cron-backed KV state
- render X quote posts with one-level quoted post previews instead of raw quoted `t.co` links
- introduce Cloudflare-backed image delivery for public media surfaces
- add image metadata support
- restore required SEO, comments, and route compatibility details
- land the approved search-native SEO slice with one narrow engineer-facing query wedge before any broader content-taxonomy expansion
- keep current Personal Site discovery explicit for search crawlers and AI answer engines through structured data, robots, sitemap, and `llms.txt`
- advertise agent discovery resources from the homepage with RFC 8288 `Link` headers and an RFC 9727 `/.well-known/api-catalog`

Exit criteria:

- public behavior approaches feature parity with the current blog

### M4: Async Workflow Migration

Status: Not started

Goals:

- migrate translation jobs
- migrate retranslate capability
- migrate Telegram refresh jobs
- migrate content refresh and invalidation flows

Exit criteria:

- the old Go blog backend is no longer required for the public blog domain

## Sequencing Rules

- prefer vertical slices that can be deployed and verified independently
- avoid broad platform work before a public feature requires it
- keep the first version simple, especially around storage and infra
- document migration findings as they are discovered

## Known Architectural Constraints

- Personal Site product, not a public-blog-only product
- Notion remains authoritative for content
- KV remains the default storage choice unless docs are updated
- legacy code is reference material, not target architecture
- the active framework migration target is Next.js App Router deployed through OpenNext on Cloudflare Workers
- Wrangler enters through checked-in `src/worker.ts`, which delegates fetch handling to OpenNext's generated worker and leaves room for future Worker-level handlers
- runtime variables are defined through Wrangler `vars` and `secrets.required`; there is no repo-local `src/config` package
- runtime integrations must not synthesize content when source configuration is missing
- `/sitemap.xml` is runtime-generated so Cloudflare builds do not require `NOTION_SECRET`, while runtime requests still require valid Notion configuration
- compatibility redirects are implemented in `src/middleware.ts`, not standalone pages or route handlers; `/blog` is intentionally not redirected
- article detail pages may render trusted authored HTML only from Notion `html` code blocks whose text starts with `<!--render-->`; all other code blocks remain display code
- feed UI primitives and tokens have migrated from the local shadcn/Base UI component set to HeroUI v3 under `docs/specs/2026-05-18-heroui-design-system-migration-design.md`; `src/components/ui/*`, `components.json`, `shadcn/tailwind.css`, and the old shadcn/Base UI dependencies are no longer part of the active source tree
- Overview Feed layout estimates are browser-owned; Content Sources provide standard Feed Items, SSR uses a single-column fallback, and hydrated tablet/desktop masonry uses the Feed Layout Engine with Pretext
- Overview Feed cards use client-side card-surface navigation, while the SEO-visible destination anchor lives on the timestamp to avoid nested `<a>` markup around rich-text links
- ordinary app/domain component styling should use inline Tailwind utilities; CSS modules are reserved for rich text selectors, generated markup selectors, animation keyframes, and documented exceptions; font size, tracking, leading, padding, margin, gap, rounded, and ring utilities should use named Tailwind/HeroUI tokens rather than arbitrary values
- current SEO/GEO discovery is defined by `docs/specs/2026-05-18-sitewide-seo-geo-design.md`; filter URLs are browse states that canonicalize to `/`, while sitemap discovery remains `/` plus article detail URLs
- homepage agent discovery uses `Link` headers for `api-catalog`, `service-doc`, and `describedby`; the API catalog remains a narrow linkset over existing public resources

## Active Priorities

1. use `docs/specs/2026-05-12-personal-site-overview-design.md` as the active product spec
2. make OpenNext + Next.js the active runtime direction
3. implement the Profile Hero and Overview Feed Index before broad visual polish
4. preserve article details and old-route compatibility while removing archive pages from the primary product structure
5. keep Telegram social content on the runtime public-page crawler defined in `docs/specs/2026-05-17-telegram-public-page-runtime-ingestion-design.md`
6. implement X Social Source sync from `docs/plans/2026-05-21-x-social-source.md` without adding homepage-time X API calls

## Open Questions

- exact Notion schema for Profile Source beyond rendering the fixed Profile Page body
- exact production X API secret provisioning for the fixed `sorcererxw` owned-read source
