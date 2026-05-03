# Blog2 Search-Native SEO Design

## Summary

Improve `blog2` SEO as a product surface, not as a tag-cleanup task.

The target outcome is:

- search engines understand the site as a technical publication for engineers
- search results look worth clicking for technical-stack and problem-solution queries
- the current high-intent routes stop behaving like generic page shells with thin metadata

This slice should turn the existing public surfaces into search-native technical assets:

- article detail pages act as the proof pages
- archive, thoughts, stack, and projects act as structured collection pages
- one manually authored query-entry page acts as the first search wedge for engineering queries

## Problem

`blog2` currently emits basic page titles and descriptions, but the SEO system is still ad hoc.

Current gaps:

- `src/layouts/SiteLayout.astro` only emits `<title>` and `<meta name="description">`
- route files mostly pass raw `title` strings, not route-owned SEO contracts
- there is no unified canonical URL generation
- there is no Open Graph or Twitter card strategy
- there is no route-level structured data strategy
- there is no snippet-quality guardrail to stop vague or duplicated search-result copy from shipping
- there are no dedicated topic-entry pages for engineering search intent

For an engineer audience, this produces the worst of both worlds:

- search engines get weak signals about what each page is for
- engineers see search results that read like a generic personal site instead of a technical blog

## User and Search Intent

### Primary audience

- engineers

### Primary search intents

- technical stack discovery
- concrete problem-solution queries

### V1 wedge

V1 should target one query family first, not several.

Chosen starting wedge:

- Astro + Cloudflare publishing and migration

### Desired perception

When an engineer sees a `blog2` result in search, the result should feel like:

- this page is about a specific technical topic
- this author has actually solved or documented the problem
- clicking will reveal implementation detail, not generic self-branding copy

## Product Goal

Make `blog2` feel like a technical publication in search results, not a generic personal homepage.

That means this slice must improve both:

1. machine understanding
2. human click appeal

If a change only improves crawler hygiene but does not improve result quality for engineers, it is incomplete.

If a change introduces new architecture without a sharper query wedge, it is also incomplete.

## In Scope

- a shared SEO domain under `src/domains/seo/`
- route-level SEO contracts for:
  - `/`
  - `/blog`
  - `/articles/[slug]`
  - `/thoughts`
  - `/projects`
  - `/stack`
- canonical URL generation for all public routes
- Open Graph and Twitter card metadata generation
- structured data generation for the supported route classes
- first-party sitemap and robots behavior owned by Astro
- snippet-writing rules and preview/lint tooling for titles and descriptions
- one manually authored query-entry page for the chosen wedge

## Out of Scope

- promising ranking changes or traffic growth that cannot be verified from the app
- rewriting the entire content archive
- building a generic CMS for SEO fields
- large-scale taxonomy automation from Notion in v1
- a reusable topic-hub system in v1
- search UI or on-site full-text search
- comments, translations, and unrelated route redesign

## Existing Code Leverage

This slice should reuse the current app shape instead of inventing a new content system.

Existing leverage:

- Astro route layer already owns all public routes
- `SiteLayout.astro` is already the shared HTML `<head>` entrypoint
- article detail already has the richest content model and should become the strongest `TechArticle` surface
- thoughts, stack, and projects already expose stable route boundaries and content models
- Cloudflare image delivery is already in place, which helps social-card and structured-data image ownership

## Chosen Direction

### Search-Native Technical Publication

Treat `blog2` as a technical publication with multiple search-facing page classes.

Define a single SEO domain that produces:

- canonical URLs
- result titles
- descriptions
- Open Graph payloads
- Twitter payloads
- JSON-LD structured data
- robots decisions

Then make each route declare what kind of page it is.

### Page classes in v1

#### Home

Purpose:

- identify the site and author
- route engineers toward the right surfaces

SEO role:

- `WebSite`
- `Person`

#### Article detail

Purpose:

- prove real problem solving
- rank for concrete engineering topics

SEO role:

- `TechArticle`
- optional `BreadcrumbList`

#### Archive, thoughts, projects, stack

Purpose:

- expose structured collections
- support browsing and collection-level discovery

SEO role:

- `CollectionPage`
- `ItemList`

#### Query-entry page

Purpose:

- serve search intent directly
- aggregate proof across articles, thoughts, projects, and stack

SEO role:

- `CollectionPage`
- `ItemList`
- optional `FAQPage` only when the page genuinely contains question-answer content

## Query Wedge Direction

V1 should not start with a reusable hub system.

It should start with one manually authored query-entry page for the chosen wedge.

Why:

- the site is still stabilizing after the Astro migration
- the roadmap still prioritizes route stability over broad new product scope
- a manually authored page keeps the wedge explicit and easier to verify

Rules:

- the page must target one engineering query family
- the page must contain a strong result title and non-generic description
- the page must link to proof pages already present in the site
- the page must not invent content that the site cannot support
- the page must include an explicit query-to-proof map

## Metadata Rules

### Title rules

- every public route must own an explicit SEO title
- titles must state the topic, not just the route label
- titles should be concise and written for truncation tolerance
- duplicate titles across public routes are not allowed
- labels like `Blog`, `Thoughts`, `Projects`, and `Stack` are not sufficient as final SEO titles

### Description rules

- every public route must own an explicit description
- descriptions must summarize the page content, not the site in general
- descriptions should sound like technical content, not self-branding copy
- descriptions should help an engineer predict what they will learn by clicking
- descriptions must explain why the page deserves the click, not just what route it is

### Copy contract rules

- proof pages must describe a concrete technical problem, decision, or implementation
- collection pages must explain what kind of technical material they contain
- the query-entry page must read like a credible answer surface, not a tag index
- empty states and fallback copy must not leak into search-facing snippets for indexable pages

### Canonical rules

- every indexable route must emit a canonical URL
- locale redirect aliases and obsolete route forms must point at the canonical route
- canonical generation must be centralized, not hand-built in each page

### Social-card rules

- every route class must produce Open Graph and Twitter metadata
- article pages should prefer article-relevant cover images where available
- collection pages should use stable representative images or fall back cleanly
- social-card images must be crawlable and same-zone when possible

## Structured Data Rules

### Article detail

Use `TechArticle` with at least:

- headline
- description
- author
- datePublished
- dateModified when available
- image
- mainEntityOfPage

### Collection surfaces

Use `CollectionPage` plus `ItemList`.

Collection pages should expose:

- page identity
- ordered or representative item list
- item names and URLs

### Home

Use `WebSite` and `Person`.

This helps the site identify itself as an authored technical publication rather than a generic company site.

## Runtime and Ownership

### Astro ownership

Astro should own:

- canonical `<link>`
- standard meta tags
- OG/Twitter tags
- JSON-LD script emission
- sitemap
- robots

### Domain ownership

`src/domains/seo/` should own:

- SEO data types
- title and description composition
- structured data builders
- route-class helpers
- snippet preview data

Routes should pass one explicit `seo` object to the layout instead of loosely passing `title` and `description`.

## Verification Expectations

This slice is not done unless the app proves:

- all target routes emit canonical URLs
- all target routes emit explicit titles and descriptions
- article detail emits valid article structured data
- collection routes emit collection structured data
- sitemap and robots are reachable and correct
- no targeted route falls back to duplicated or vague snippet copy
- the query-entry page renders and links to real proof surfaces

## Success Criteria

- targeted public routes have explicit SEO contracts instead of ad hoc `title` props
- search-result copy for the targeted routes reads like technical content for engineers
- the site exposes crawlable canonical and structured-data signals for the targeted routes
- the v1 query-entry page creates one credible engineering landing page tied to a clear query wedge
- verification can show the rendered head markup and structured data for each route class

Outcome contract for v1:

- chosen query family
- chosen entry-page path
- why this page deserves the click
- which proof pages support it
- which proof pages need tighter copy before the page ships

## Alternatives Considered

### 1. Foundation-First SEO Only

Fix titles, descriptions, canonical, sitemap, robots, and structured data for existing routes only.

Pros:

- smallest blast radius
- easiest to verify

Cons:

- improves hygiene more than acquisition shape
- does not create better query-entry pages for engineers

Decision:

- rejected as too small for the stated outcome

### 2. Search-Native Technical Publication, Narrow Wedge First

Fix the SEO foundation and add one manually authored query-entry page that aggregates proof across existing technical surfaces.

Pros:

- improves machine understanding and click appeal together
- matches the desired "technical blog" search-result feel
- keeps v1 bounded to one query wedge

Cons:

- requires some editorial rules in addition to engineering work

Decision:

- chosen

### 3. Search-Native Technical Publication Without Copy Tightening

Fix metadata and structured data, but do not require route-level snippet-copy tightening.

Pros:

- lower editorial effort

Cons:

- likely leaves search results generic even after technical implementation
- fails the stated click-through goal

Decision:

- rejected

## Risks

### Risk 1: The slice collapses into meta-tag cleanup

Mitigation:

- require a query-entry page and snippet-quality rules in the plan

### Risk 2: The query-entry page turns into a thin aggregation page

Mitigation:

- keep v1 manual
- require the page to link to real supporting proof surfaces

### Risk 3: Route SEO contracts drift back into ad hoc props

Mitigation:

- route files pass a typed `seo` object to the layout
- add snippet preview or lint checks

### Risk 4: Social-card images break or use weak assets

Mitigation:

- reuse the Cloudflare image-delivery path
- define explicit image fallback rules per route class

### Risk 5: Search results become technically valid but still not worth clicking

Mitigation:

- require route-level copy contracts
- require snippet preview review before shipping
- prioritize proof pages over generic collection labels

### Risk 6: The slice remains too generic to prove value

Mitigation:

- define one query wedge
- define one entry page for that wedge
- map supporting proof pages before implementation
