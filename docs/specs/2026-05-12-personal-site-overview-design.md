# Personal Site Overview Design Spec

## Summary

Reframe this repository from a standalone public blog into a Personal Site whose primary public surface is one homepage: a Profile Hero followed by a unified masonry Overview Feed.

This is a product and information-architecture pivot. It supersedes the older public-blog-only product boundary while keeping the approved Astro + Cloudflare technical direction.

## Product Direction

The site is the public home for one authored identity. Blog entries, projects, and social posts are all public content surfaced inside the same overview experience.

The homepage should not behave like a blog archive with extra sections attached. It should behave like a personal overview: introduce the person first, then let visitors browse a mixed stream of writing, work, and external posts.

## In Scope

- Profile Hero at the top of `/`
- masonry Overview Feed on `/`
- unified Feed Module presentation system
- Blog Entry, Project, and Social Post feed items
- multiple Content Sources normalized into one Overview Feed Index
- Feed Filters on `/` using view state rather than section routes
- legacy non-blog archive route compatibility
- existing article detail pages as deep-linked Content Details

## Out of Scope

- turning Notion into a complete CMS for every external post
- adding standalone social-post detail pages
- making Stack Inventory a public first-class section
- retaining the legacy Stack Inventory page or Stack-specific Notion/KV pipeline
- preserving `/blog`, `/projects`, or `/thoughts` as primary product pages
- introducing D1 or another new storage system solely for the first overview implementation

## Domain Model

The domain language is defined in `CONTEXT.md`.

Core rules:

- `Personal Site` is the product term; avoid using `Blog2` or `public blog` for the target product.
- `/` is the only primary public entry surface.
- `Profile Hero` appears before the `Overview Feed`.
- `Overview Feed` reads from an app-owned `Overview Feed Index`.
- `Overview Feed Index` targets a ten minute freshness window.
- `Profile Hero` is sourced from Notion and targets a one hour freshness window.
- `Feed Item` types for v1 are `Blog Entry`, `Project`, and `Social Post`.
- `Social Post` carries a `Social Source` such as Telegram channel or Twitter, but source does not create a separate presentation component family.
- `Stack Inventory` is not part of the Personal Site product surface and is not a feed item type.

## Presentation Model

All feed content uses one Feed Module presentation system.

The original V1 Feed UI implementation used shadcn primitives for shared module structure:

- Feed Filters use shadcn `Tabs`
- Feed Modules use shadcn `Card`
- Feed source labels use shadcn `Badge`

`docs/specs/2026-05-18-heroui-design-system-migration-design.md` supersedes that component-source decision. HeroUI v3 is now the target shared component implementation. During migration, each replaced primitive must be removed from `src/components/ui` in the same slice rather than preserved as a long-lived compatibility wrapper.

Feed Modules support these Module Sizes:

- `compact`
- `standard`
- `feature`

Module Size changes visual weight only. It must not change the underlying Feed Item type or create source-specific rendering branches.

Different content types and sources may have distinct ingestion and normalization paths, but the rendered feed modules should stay visually unified.

Module Size ownership rules:

- Content Sources must not provide Module Size, card height, column placement, or masonry estimates
- Content Sources normalize public content into standard Feed Items
- Feed Items may carry `presentationIntent: "feature"` when the author explicitly wants special presentation treatment
- `feature` is manual-only and must not be inferred automatically
- the hydrated Feed Layout Engine maps Feed Items and Presentation Intent into Module Size and Layout Estimates
- media intrinsic width and height can be carried as Feed Media Preview metadata, but they are not Layout Estimates

The server-rendered Overview Feed should use a single-column fallback in Overview Feed Index order. Browser-hydrated tablet and desktop views may replace that fallback with masonry columns after the Feed Layout Engine calculates Layout Estimates. The server-rendered feed must not depend on browser text measurement.

The Feed Layout Engine should use Pretext for variable text measurement after hydration. It should calculate Layout Estimates from measured text, media intrinsic ratios or fallback ratios, Presentation Intent, and fixed Feed Module chrome constants. Text preparation can be cached separately from width-dependent layout, and container width changes should trigger a new Layout Estimate pass without relying on DOM height measurement.

## Sorting

The Overview Feed sorts Feed Items by Displayed Time.

Rules:

- Content Sources may provide a manual Displayed Time override
- Source Published Time preserves the upstream publication timestamp
- if Displayed Time exists, it controls sorting
- if Displayed Time is missing, Source Published Time can be used for sorting
- items with a sort time appear before items without a sort time
- timed items are ordered newest first
- items without either time appear at the bottom

## Project Destinations

Projects can have an External Target, a Content Detail, both, or neither.

Rules:

- if a Project has an External Target, that is its primary destination
- if a Project has both an External Target and a Content Detail, the Content Detail is secondary context
- if a Project has neither, the module can render as a non-clickable item

## Social Post Ownership

Social Posts are summaries of external platform posts, not full copied social archives.

Rules:

- the original platform post is the primary External Target
- the homepage may show summary text, source, time, and media preview
- no standalone Social Post detail pages in v1
- if the original post becomes unavailable, the site may retain the summary but should not pretend to own the canonical content

V1 Social Source scope:

- implement Telegram from the existing snapshot flow first
- reserve the model for Twitter/X, but do not implement Twitter/X ingestion in the first overview slice

## Compatibility Routes

Legacy non-blog archive paths should preserve old links without remaining primary site structure.
The old `/blog` archive path is not part of the target public surface and should return `404`; writing is reached through `/` and `/?type=writing`.

Target redirects:

- `/projects` -> `/?type=projects`
- `/thoughts` -> `/?type=social`

These redirects are compatibility behavior, not app route surfaces. If the framework can represent them through middleware or proxy routing, do not keep separate route files for them.

`/articles/[slug]` remains available as Content Detail for long-form Blog Entries.

`/stack` is removed from the Personal Site surface and should return `404`; do not keep a hidden Stack route, navigation entry, Notion adapter, or KV cache path.

## Sitemap and Discovery

The sitemap should expose the new Personal Site structure rather than the legacy archive structure.

Rules:

- include `/`
- include Content Detail URLs such as `/articles/[slug]`
- include manually authored durable topic/query pages only if they remain part of the product
- do not include `/blog`, `/projects`, `/thoughts`, or `/stack`
- do not include filtered query URLs
- preserve old non-blog archive link equity through permanent redirects to Filter Queries

`/blog` is not a compatibility route and should not redirect to `/?type=writing`.

## Feed Filters

Feed Filters are URL-backed client states on `/`.

The initial request should still use the query string to render a correct SSR state, so shared URLs and no-JavaScript navigation remain meaningful. After hydration, filter tab changes should update the URL and filter the already-loaded Overview Feed in the browser instead of requesting a new page.

Initial query shape:

- `/?type=writing`
- `/?type=projects`
- `/?type=social`
- `/?source=telegram`
- `/?source=twitter` after a Twitter Social Source exists

Filter controls should keep regular `href` values as a fallback, then use a narrow React island for hydrated client-side filtering.

When hydrated filtering changes the visible Feed Items, Feed Modules should animate insertion and removal. The animation must preserve reduced-motion preferences and must not create source-specific rendering branches.

The Overview Feed renders all matching Feed Items in one server-rendered response. V1 should not introduce pagination or infinite scroll. Implementation should still use responsible media loading so the one-page model does not make image-heavy feeds unnecessarily expensive.

## Feed Media

Feed Modules may show Feed Media Previews, but the feed must not become a full media embed surface.

Rules:

- render thumbnail or preview media only
- route images through the existing Cloudflare image delivery or canonical media path when possible
- default Feed Media Previews to lazy loading
- allow eager loading only for the small number of above-the-fold feature/standard modules
- do not embed full external video or social players in the feed
- if external social media cannot be stably proxied or transformed, degrade to text plus External Target
- richer media belongs in Content Detail or the External Target, not in the feed module

## Storage and Freshness

Keep the current Astro + Cloudflare direction and continue using Cloudflare KV or the existing storage abstraction for app-owned derived data.

The homepage should read the normalized Overview Feed Index rather than pulling every Content Source during the request.

The Profile Hero is sourced from one fixed Notion Profile Page, not a profile database. The implementation should not introduce an active-record selection rule unless a later product decision requires multiple profile variants.

The fixed Profile Hero page id is provided by Wrangler `vars.NOTION_INTRO_PAGE_ID`.

Blog Entries are sourced from the Notion database id provided by Wrangler `vars.NOTION_BLOG_DATABASE_ID`. Projects are sourced from the Notion database id provided by Wrangler `vars.NOTION_PROJECTS_DATABASE_ID`. A Blog Entry's Notion page cover is part of the public content model and should be preserved for both Overview Feed media previews and `/articles/[slug]` detail hero images.

The Profile Hero renders the full Notion Profile Page content rather than extracting only a small whitelist of fields. The renderer should still preserve the role of the surface as a Profile Hero, not an article-detail page.

The Profile Hero may constrain visible Profile Content by default and provide same-page Hero Expansion for the full content. The default collapsed state should keep the Overview Feed reachable from the opening screen rather than letting an arbitrarily long profile page dominate the whole homepage.

Hero Expansion should use native HTML/CSS in v1. Do not introduce a React island for expansion unless native behavior fails a concrete interaction or accessibility requirement.

Failure rule:

- if a Content Source refresh fails, preserve the last successful Overview Feed Index result where possible
- runtime integrations must not return synthetic content when Notion or external source configuration is missing
- production should fail fast on missing required source credentials or ids; non-production may render empty content states instead of synthetic content

## Open Questions

- exact collapsed height and native expansion labels for Profile Hero
- exact Notion/project fields for Displayed Time overrides
- which Social Sources are included in the first implementation slice
- exact accepted query parameter values for Feed Filters
