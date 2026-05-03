# Blog2 Design Spec

## Summary

Build a new full-stack blog application at `web/apps/blog2` as a greenfield Next.js project deployed on Cloudflare.

This project replaces the current split architecture where:

- the frontend lives in `web/apps/blog`
- the public blog backend lives in `server/app/blog`
- the frontend and backend communicate through generated RPC clients
- deployment is split across Vercel, Railway, and Railway-hosted database infrastructure

The new system should reduce operational and code maintenance complexity by consolidating the public blog domain into a single Next.js application deployed on Cloudflare.

## Scope

### In Scope

- Create a new Next.js app from scratch at `web/apps/blog2`
- Deploy the new app on Cloudflare
- Use Notion as the source of truth for blog content
- Migrate public blog capabilities from the old stack into the new app
- Preserve async/background capabilities required by the public blog domain
- Use Cloudflare KV as the primary application-side storage layer for cached and derived blog data

### Out of Scope

- Reworking the existing `web/apps/blog` codebase in place
- Reusing the old generated RPC client and proto-driven frontend integration
- Migrating `fusink` management, route management, or related admin functionality
- Migrating the entire generic Go backend platform
- Building a full CMS separate from Notion

## Product Boundaries

`blog2` is a dedicated public blog product, not a general replacement for the existing `server/app/blog` service.

The new app is responsible for:

- public blog pages
- content retrieval and rendering
- public-facing service endpoints needed by the app
- blog-domain async jobs

The new app is not responsible for:

- admin tooling
- generic site management
- OAuth/admin account workflows from the existing backend
- the broader `fusink` domain

## Source of Truth

Notion remains the source of truth for content.

`blog2` will read from Notion directly rather than using Railway Postgres as the main content store.

However, Notion is not treated as the application runtime store for every request. The application will normalize and cache Notion-derived content into its own Cloudflare-backed storage model so that public traffic does not depend on repeated direct reads from Notion.

## Storage Strategy

### Chosen Direction

Use Cloudflare KV as the primary storage layer in the first version because:

- the data volume is small
- the implementation is simpler than introducing D1 immediately
- the main goal is to collapse deployment and runtime complexity quickly

### KV Responsibilities

KV will store:

- normalized article payloads
- article lookup records by slug and Notion page id
- article list indexes
- project, stack, and thoughts indexes
- translation outputs
- Telegram message snapshots
- image metadata cache
- job cursors
- coarse-grained job locks
- lightweight job run records

### KV Limits Accepted by Design

This design explicitly accepts:

- application-managed idempotency
- key-based retrieval as the dominant access pattern
- manually maintained indexes
- eventual consistency tradeoffs where acceptable
- avoiding relational querying in the first version

### Migration Escape Hatch

All KV access must be hidden behind a storage abstraction such as `BlogStore`.

This keeps the door open to migrating some state later to D1 if background processing or indexing becomes more complex.

## Architecture

### High-Level Shape

`web/apps/blog2` will be a standalone Next.js full-stack app with clear internal boundaries:

- route layer for pages and HTTP entrypoints
- domain use cases for blog behavior
- integrations for external systems
- content normalization for Notion-to-app transformation
- background job runners for async workflows

The application must not replicate the old pattern where UI code depends on generated RPC clients that delegate all behavior to a separate service.

### Bootstrap Strategy

The application should be bootstrapped from the latest stable Next.js baseline rather than by manually assembling framework files from scratch.

The intended initialization direction is:

- latest stable Next.js
- Tailwind via the standard project bootstrap path
- shadcn initialized with the default preset/style

This keeps the baseline modern, reduces drift from upstream conventions, and avoids carrying forward old app assumptions from `web/apps/blog`.

### Internal Boundaries

#### App Route Layer

Responsible for:

- page routes
- route handlers
- sitemap and metadata endpoints
- cron-trigger entrypoints
- request parsing and response shaping

Not responsible for:

- direct Notion SDK access
- direct KV manipulation
- business logic

#### Domain Layer

Organized around blog capabilities such as:

- article
- project
- stack
- thought
- telegram
- translation
- image metadata

This layer exposes use cases like:

- `listArticles`
- `getArticleBySlug`
- `listProjects`
- `listStack`
- `listTelegramMessages`
- `translateArticle`
- `retranslateArticle`
- `refreshTelegramMessages`

#### Integrations Layer

Holds adapters for:

- Notion
- Cloudflare KV
- translation provider
- Telegram
- image metadata extraction
- observability/logging

This isolates vendor SDK usage from domain logic.

#### Content Normalization Layer

Responsible for turning Notion pages and blocks into application-native content models.

This is a critical boundary because the old Go service embeds a substantial amount of Notion-specific transformation logic. The new app should centralize this work instead of scattering it across pages and components.

#### Jobs Layer

Responsible for:

- Notion sync jobs
- translation jobs
- Telegram refresh jobs
- image metadata refresh jobs

Jobs reuse domain use cases and storage abstractions rather than introducing a separate logic path.

## Suggested Directory Layout

```text
web/apps/blog2/
  app/
    [lang]/
    api/
    sitemap.ts
  src/
    domains/
      article/
      project/
      stack/
      thought/
      telegram/
      translation/
      image-meta/
    integrations/
      notion/
      kv/
      translator/
      telegram/
      image-meta/
    content/
    jobs/
    config/
    lib/
    types/
```

The key rule is:

- route code calls use cases
- use cases depend on abstractions
- integrations contain external system details

## Runtime Flows

### Public Read Flow

For article pages, article lists, projects, stack, and thoughts:

1. a page or route handler receives the request
2. it calls the relevant domain use case
3. the use case checks KV for normalized or indexed data
4. on miss, the app reads from Notion or the external source
5. the result is normalized into app-native models
6. the result is written back to KV
7. the response is rendered

The runtime principle is:

public requests should read application-owned derived data first, and only fall back to source systems when necessary

### Async Job Flow

For sync, translation, Telegram refresh, and image metadata refresh:

1. a Cloudflare-triggered entrypoint starts the job
2. the job checks cursor and lock keys
3. the job fetches incremental or target data
4. the job normalizes or enriches the data
5. the job writes updated records and indexes into KV
6. the job updates cursor and run metadata
7. the job invalidates or refreshes affected cache keys

## Feature Migration Targets

The greenfield app will gradually absorb the public capabilities currently spread across `web/apps/blog` and `server/app/blog`.

### Public Features to Migrate

- article list pages
- article detail pages
- projects page
- stack page
- thoughts or Telegram-driven public content page
- sitemap
- image metadata resolution used by content rendering
- public blog configuration needed for rendering and navigation

### Async Capabilities to Preserve

- article translation workflows
- retranslate entrypoint
- Telegram content fetching
- image metadata refresh logic
- Notion synchronization workflows needed to keep derived content fresh

### Features Explicitly Left Behind

- `fusink` admin and route management flows
- generic site CRUD and route CRUD
- admin auth flows
- backend capabilities unrelated to the public blog product

## Migration Strategy

This should be executed as a greenfield rebuild with staged capability migration.

### Phase 1: Foundation

Create the new app with:

- CLI-initialized Next.js baseline
- Tailwind baseline from the standard initialization path
- shadcn initialized with the default preset/style
- Cloudflare deployment baseline
- environment and binding model
- shared layout and i18n shell
- logging and error handling

Deliverable:

- deployable `blog2` app with minimal placeholder pages

### Phase 2: Public Read Path

Build:

- article listing
- article detail rendering
- projects page
- stack page
- sitemap
- Notion read path
- normalization pipeline
- KV-backed caching and indexes

Deliverable:

- a functioning read-only public blog experience on `blog2`

### Phase 3: Secondary Public Features

Build:

- thoughts or Telegram-driven content pages
- image metadata support
- SEO and metadata parity work
- behavior compatibility items such as route conventions and comments integration where still desired

Deliverable:

- public feature parity close to the current site

### Phase 4: Async Jobs

Build:

- Notion refresh jobs
- Telegram refresh jobs
- translation jobs
- retranslate entrypoint
- job locking, cursors, and invalidation rules

Deliverable:

- old blog backend no longer required for the public blog domain

## Migration Principles

### Greenfield, Not Incremental Refactor

Do not evolve `web/apps/blog` into `blog2`.

Do not transplant old backend patterns into the new app.

Use the old codebase only as:

- behavior reference
- feature inventory
- source of edge-case knowledge

### Preserve Product Behavior, Not Historical Structure

The goal is to preserve useful public functionality while discarding:

- proto-driven frontend coupling
- unnecessary service boundaries
- old directory conventions
- backend abstractions that exist only because of the old platform shape

### Prefer Simpler First-Version Decisions

When the choice is between:

- introducing more infrastructure now
- or keeping the first version simple and leaving an escape hatch

prefer the simpler first-version design unless it blocks required public behavior.

## Risks

### Risk: Hidden Logic in the Old Go Service

The old backend likely contains subtle content normalization and edge-case handling that is not obvious from the frontend alone.

Mitigation:

- inventory old handlers and transformation logic before each feature migration
- define expected behavior explicitly in tests in the new app

### Risk: KV-Only State Becomes Awkward

Background jobs and derived indexes may eventually outgrow KV-only ergonomics.

Mitigation:

- keep a strict storage abstraction
- design key spaces intentionally
- treat D1 as a future escape hatch rather than a current dependency

### Risk: Notion Rate Limits or Latency

Direct source reads can become slow or fragile if caching is weak.

Mitigation:

- cache normalized payloads aggressively
- favor job-driven refresh where possible
- ensure request-time fallback reads are bounded and observable

### Risk: Async Task Duplication

Without relational constraints, duplicate background work is easier to trigger.

Mitigation:

- use coarse-grained lock keys
- keep cursor logic explicit
- make job handlers idempotent at the application layer

## Success Criteria

The migration is successful when:

- the public blog domain runs entirely from `web/apps/blog2`
- deployment is consolidated onto Cloudflare
- the new app reads content from Notion directly
- KV holds the app-owned derived and cached blog data
- translation and Telegram-related async capabilities continue to work
- the old public blog backend is no longer required for public blog traffic
- maintenance complexity is materially lower because the public blog no longer spans separate frontend and backend products
