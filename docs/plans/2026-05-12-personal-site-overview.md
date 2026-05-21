# Personal Site Overview Implementation Plan

## Goal

Rebuild the public product around one Personal Site homepage with a Notion-backed Profile Hero and unified masonry Overview Feed, while preserving Astro + Cloudflare as the runtime direction.

## Scope

This plan is intentionally staged. It should replace the older archive-first public-blog sequence for future implementation work.

## Slice 0: Contract and Current-State Alignment

Files:

- `CONTEXT.md`
- `docs/specs/2026-05-12-personal-site-overview-design.md`
- `docs/roadmap.md`
- `docs/task-ledger.md`

Work:

- record domain language for Personal Site, Overview Feed, Feed Item, Feed Module, and Compatibility Route
- mark the roadmap product pivot explicitly
- keep existing Astro migration work as the runtime foundation rather than reopening the framework choice

Verification:

- documentation review only
- no runtime behavior changes in this slice

## Slice 1: Feed Domain Model

Files:

- `src/domains/feed/*`
- `src/domains/article/*`
- `src/domains/projects/*`
- `src/domains/thoughts/*`
- `src/integrations/kv/*`
- tests beside changed modules

Work:

- introduce a normalized Feed Item model with item type, source, Displayed Time, destination, summary, media metadata, and optional Presentation Intent
- remove source-owned Module Size defaults and manual override handling from Feed Item normalization
- implement Displayed Time overrides separately from Source Published Time
- implement sorting rules: timed items newest first, untimed items at the bottom
- map existing article, project, and thoughts/social data into the feed model
- map existing Telegram snapshot content as the first Social Source
- reserve Twitter/X in the model without implementing ingestion
- introduce or extend the app-owned Overview Feed Index abstraction

Verification:

- targeted unit tests for feed normalization and sorting
- typecheck

## Slice 2: Profile Hero Source

Files:

- `src/domains/home/*`
- `src/integrations/notion/*`
- `src/integrations/kv/*`
- homepage route/layout files

Work:

- render the full content from one fixed Notion Profile Page
- fetch and normalize Profile Hero content
- cache or revalidate the Profile Hero with a one hour freshness target
- render the Profile Hero above the Overview Feed with native same-page expansion for long content

Verification:

- targeted tests for Profile Hero normalization
- HTTP check for `/`
- browser verification for homepage rendering

## Slice 3: Unified Overview Feed UI

Files:

- `src/domains/feed/*`
- `src/pages/index.astro`
- feed CSS module files
- related tests

Work:

- replace archive-like homepage content with the unified masonry Overview Feed
- implement Feed Module variants as presentation-owned weights: compact, standard, feature
- render the server Overview Feed as a single-column fallback in Overview Feed Index order
- introduce a browser-side Feed Layout Engine that uses Pretext to calculate Layout Estimates after hydration
- keep media intrinsic width and height as Feed Media Preview metadata, not source-owned layout estimates
- scope the first Feed Layout Engine migration to the Overview Feed; legacy thoughts-page masonry is follow-up work if that page remains visible
- implement lightweight Feed Media Preview handling using existing media delivery where possible
- keep presentation unified across item types and sources
- implement Feed Filters as URL-backed client state after SSR, not section pages
- use the active design-system primitives for Feed Filters, Feed Modules, and source labels; the initial implementation used shadcn `Tabs`, `Card`, and `Badge`, but `docs/specs/2026-05-18-heroui-design-system-migration-design.md` makes HeroUI v3 the target component implementation
- render Feed Module card surfaces with client-side click and keyboard navigation instead of an outer anchor; keep the real destination anchor on the timestamp and preserve rich-text anchors inside the card
- animate Feed Module insertion and removal when hydrated filters change the visible item set
- render all matching Feed Items in one response without pagination or infinite scroll

Verification:

- component tests for Feed Module rendering
- Feed Layout Engine unit tests for width-dependent Layout Estimates, column assignment, and stable item ordering
- DOM tests proving SSR renders the Overview Feed fallback without source-owned masonry estimates
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `curl` checks for `/`
- browser verification for `/` and `/?source=telegram`, including no horizontal overflow, no card overlap, stable filter reflow, stable responsive resize behavior, and no console layout or hydration errors

## Slice 4: Compatibility Routes

Files:

- `src/pages/blog/index.astro`
- `src/pages/projects/index.astro`
- `src/pages/thoughts/index.astro`
- `src/pages/sitemap.xml.ts`
- route tests if present

Work:

- keep `/blog` absent; it should return `404` rather than redirecting
- redirect `/projects` to `/?type=projects`
- redirect `/thoughts` to `/?type=social`
- keep `/articles/[slug]` as Content Detail
- remove `/stack`; it should return `404` and no Stack-specific domain, provider, or cache path should remain in the active app
- remove old archive routes and filter query URLs from sitemap discovery

Verification:

- `curl -I` checks for redirect status and location headers, plus `/blog` 404 behavior
- browser check for old-route navigation behavior

## Follow-Up Decisions

- exact first Social Sources beyond existing Telegram snapshot
- how Twitter/X data is collected and authorized
- whether projects without Displayed Time need an authoring cleanup pass
- exact collapsed height and native expansion labels for Profile Hero
- exact accepted query parameter values for Feed Filters
