# Blog2 Search-Native SEO Implementation Plan

## Summary

Implement the `Search-Native Technical Publication` direction for `blog2`, but with one narrow query wedge first.

This plan should improve both:

- search-engine understanding
- engineer-facing click appeal in search results

The plan stays bounded by:

- centralizing route SEO into a typed SEO domain
- upgrading existing public routes first
- keeping v1 to one query wedge and one manually authored landing page

## Scope

### In Scope

- shared SEO domain and layout contract
- route upgrades for home, blog, article detail, thoughts, projects, and stack
- sitemap and robots ownership in Astro
- structured data for article and collection pages
- snippet preview or lint tooling
- one manually authored query-entry page for the chosen wedge

### Out of Scope

- full content rewrite across the entire archive
- dynamic topic extraction from Notion
- broad SEO analytics or rank-tracking infra
- unrelated route or visual redesign
- a reusable topic-hub system in v1

## Existing Code Map

### Route entrypoints

- `src/pages/index.astro`
- `src/pages/blog/index.astro`
- `src/pages/articles/[slug].astro`
- `src/pages/thoughts/index.astro`
- `src/pages/projects/index.astro`
- `src/pages/stack/index.astro`

### Shared shell

- `src/layouts/SiteLayout.astro`

### Content models

- `src/domains/article/**`
- `src/domains/thoughts/**`
- `src/domains/projects/**`
- `src/domains/stack/**`

### Config

- `astro.config.mjs`
- `wrangler.jsonc`
- `src/config/runtime.ts`

## Architecture

## Route and Dependency Diagram

```text
src/pages/*
  -> buildRouteSeo(...)
    -> src/domains/seo/model.ts
    -> src/domains/seo/build-seo.ts
    -> src/domains/seo/build-structured-data.ts
    -> src/domains/seo/site.ts
  -> SiteLayout.astro
    -> render canonical/meta/og/twitter/json-ld

query-entry page
  -> src/domains/seo/query-wedge.ts
    -> existing article / thoughts / stack / projects data

sitemap / robots routes
  -> src/domains/seo/site.ts
  -> existing route inventory
```

## Core Decisions

### 1. Introduce a typed SEO domain

Add `src/domains/seo/` with:

- route SEO model types
- site-level config
- title and description composition
- canonical URL helpers
- OG/Twitter helpers
- structured-data builders
- snippet preview helpers

The layout should accept a single `seo` object, not loose `title` and `description` props.

The SEO domain also needs one explicit site contract:

- canonical site origin
- default author identity
- default social image fallback
- default robots behavior

### 2. Keep route ownership explicit

Each route should define its SEO inputs at the route layer.

Why:

- article pages know their content semantics
- collection pages know their list semantics
- the layout should render metadata, not infer page intent

Route ownership must also cover indexability decisions:

- canonical routes
- redirect aliases
- 404 and missing-content pages
- any non-indexable fallback state

### 3. Ship one manually authored query-entry page

Add one search-entry page in v1, not a reusable hub system.

Implementation direction:

- choose one explicit query wedge
- map that wedge to supporting proof surfaces already in the site
- author one landing page that links to those proof surfaces

Do not build automatic taxonomy generation yet.

If the mapping stays too thin after proof-page review, cut this slice instead of inventing supporting content.

### 4. Add snippet quality enforcement

Add a preview or lint script that enumerates:

- route
- title
- description
- canonical URL

The script should flag:

- duplicate titles
- missing descriptions
- generic descriptions
- titles that are too vague
- routes missing canonical URLs
- collection pages that still use route-label copy as final snippet copy

### 5. Tighten route-level snippet copy

Every targeted route needs explicit search-facing copy rules.

Implementation direction:

- article detail pages lead with the concrete technical problem or decision
- archive and collection pages explain what technical material they contain
- the query-entry page explains why it is the right answer surface for the wedge
- home page stays lower priority until the publication positioning is clearer
- route copy changes must be anchored in actual page content, not generic SEO phrasing

### 6. Make schema source gaps explicit

Before implementation, define how v1 supplies required schema fields when current models are thin.

At minimum, decide:

- author source for `TechArticle`
- `dateModified` behavior when Notion data does not expose it cleanly
- social and structured-data image fallback rules
- indexability behavior for empty or missing states

## Vertical Slices

### Slice 1: SEO Domain Foundation

Goal:

- create the typed SEO system and wire it into the layout

Tasks:

- add `src/domains/seo/model.ts`
- add `src/domains/seo/site.ts`
- add `src/domains/seo/build-seo.ts`
- add `src/domains/seo/build-structured-data.ts`
- define canonical site origin and default author/image config
- update `SiteLayout.astro` to render:
  - title
  - description
  - canonical
  - robots
  - Open Graph
  - Twitter
  - JSON-LD

Verification:

- targeted unit tests for builders
- `curl` against at least `/`, `/blog`, and one article route to inspect head markup
- one test that confirms layout rendering includes canonical, robots, and JSON-LD when supplied

### Slice 2: Existing Route Upgrades and Copy Tightening

Goal:

- convert current public pages from loose metadata to route-owned SEO contracts

Tasks:

- article detail: `TechArticle`
- blog archive: `CollectionPage` + `ItemList`
- stack: `CollectionPage` + `ItemList`
- thoughts: `CollectionPage` + `ItemList` only if used as supporting proof for the wedge
- projects: `CollectionPage` + `ItemList` only if used as supporting proof for the wedge
- home: `WebSite` + `Person`, but keep it lower priority than the proof pages
- make route-level indexability explicit for 404 and alias pages

Verification:

- targeted tests around route SEO builders
- `curl` or rendered page inspection for each route class
- browser verification that no route-level regressions appear
- snippet-preview review for the upgraded routes

### Slice 3: Sitemap, Robots, and Canonical Hygiene

Goal:

- make crawl behavior explicit and verifiable

Tasks:

- add Astro-owned sitemap route or integration
- add explicit robots behavior
- ensure all indexable routes have canonical URLs
- ensure redirects and aliases point to canonical targets
- verify locale redirect aliases do not produce indexable duplicate surfaces

Verification:

- `curl` sitemap output
- `curl` robots output
- route head inspection for canonical tags

### Slice 4: Query Wedge Page v1

Goal:

- create one search-entry page for the chosen engineering query family

Tasks:

- define the v1 wedge: `Astro + Cloudflare publishing and migration`
- map the wedge to supporting proof surfaces already present in the site
- add one manually authored landing page
- connect the page to supporting proof surfaces
- document any supporting proof pages that still need sharper copy
- cut the slice if the proof map cannot support a credible landing page

Verification:

- browser verification for the landing page
- `curl` head markup for the landing page
- ensure the page links to real supporting proof pages

### Slice 5: Snippet Preview and Quality Gate

Goal:

- prevent low-quality search-result copy from shipping

Tasks:

- add a script that prints or renders route snippet data
- add rules for duplicates, missing values, and obviously weak copy
- record the script in docs so future SEO work uses it by default
- include route class, indexability, and primary query family in the output

Verification:

- run the script locally
- confirm the targeted routes appear with explicit values

## Failure Modes Registry

| Failure mode | Severity | User impact | Mitigation |
| --- | --- | --- | --- |
| Layout still owns vague fallback copy | high | search results stay generic | require route-owned SEO inputs |
| Structured data mismatches visible page content | high | weak trust, possible ignored markup | build data from existing content models only |
| Query-entry page is thin and repetitive | high | low-value search page | keep v1 manual and require proof links |
| Canonical URLs drift across routes | medium | duplicate-index confusion | centralize canonical generation |
| Social cards use poor or missing images | medium | lower click appeal in shares and previews | define fallback image rules per route class |
| Snippet lint exists but no one uses it | medium | regressions ship silently | document it in verification and task ledger expectations |
| Route snippets stay generic even after SEO plumbing lands | high | engineers still do not click | require route-level copy tightening and snippet review |
| Schema requires fields the current content models do not provide cleanly | medium | invalid or misleading markup | decide field sources up front and omit unsupported fields intentionally |
| Redirect aliases become duplicate indexable routes | high | diluted signals and duplicate pages | test locale redirects and non-canonical routes explicitly |

## Test Diagram

```text
SEO builder logic
  -> unit tests

route head markup
  -> curl / rendered HTML inspection

sitemap / robots
  -> curl

query-entry page
  -> browser verification + curl head inspection

snippet-quality script
  -> command output verification

route-level copy contract
  -> snippet preview + browser sanity review

alias and 404 indexability
  -> curl + head inspection
```

## Test Plan

Write targeted coverage for:

- title/description/canonical composition helpers
- structured-data builders
- route-specific SEO inputs
- sitemap and robots handlers
- query-to-proof mapping
- snippet-quality guardrails
- route-level snippet copy rules
- alias redirect and noindex behavior where applicable
- schema field sourcing decisions

## Not In Scope

- automatic content scoring from search-console data
- full archive backfill of editorial summaries
- schema for every experimental page type beyond the listed public surfaces

## Open Questions

- should the query-entry page live under `/topics/[slug]` or another stable content path
- what exact fallback image should collection pages use when no stronger route image exists
- whether the home page should stay broad or become more opinionated around engineering problem solving

## Verification Plan

Minimum evidence for this slice:

- targeted tests for SEO builders
- `curl` checks for:
  - `/`
  - `/blog`
  - `/articles/<known-slug>`
  - `/thoughts`
  - `/projects`
  - `/stack`
  - `/sitemap.xml` or equivalent
  - `/robots.txt`
- browser verification for one article page and the query-entry page
- snippet-preview script output recorded in the task ledger

Outcome contract required before implementation:

- chosen query family
- chosen entry-page path
- why the page deserves the click
- which proof pages support it
- which proof pages need tighter copy before the landing page ships
- which current route titles and descriptions are too generic and must be replaced
- where canonical site origin, author, and fallback images come from

## Recommended Rollout Order

1. SEO domain foundation
2. route upgrades for existing public pages
3. sitemap and robots
4. query-entry page v1
5. snippet-quality gate

This order keeps the foundation explicit before introducing one narrowly scoped search-entry page.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | --- | --- | --- |
| CEO Review | `/autoplan` | Scope and strategy | 1 | issues found, folded in | original plan was too broad in architecture and too vague in wedge definition; narrowed to one query wedge and one landing page |
| Design Review | `/autoplan` | Search-result UX and page hierarchy | 1 | issues found, folded in | route-label titles were too generic to improve CTR; route-level snippet copy tightening is now required |
| Eng Review | `/autoplan` | Architecture and verification | 1 | issues found, folded in | explicit site contract, schema source gaps, and alias-indexability decisions were missing; now added |
| DX Review | `/autoplan` | Developer experience gaps | 0 | skipped | no developer-facing API, CLI, SDK, or onboarding scope in this slice |

**VERDICT:** APPROVED WITH SCOPE REDUCTION — proceed with the narrowed SEO foundation plus one query-entry page only if the proof map stays credible.
