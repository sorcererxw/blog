# Blog2 Astro Migration Design Spec

## Summary

Move `web/apps/blog2` from a Next.js + OpenNext-on-Cloudflare runtime to a standalone Astro application deployed with Astro's official Cloudflare adapter.

This is a framework pivot, not a product pivot.

The public blog surface stays the same:

- home
- blog archive
- article detail
- projects
- stack
- thoughts
- health and legacy cron endpoints

The goal is to keep the existing domain and integration logic, while replacing the framework and deployment layer with a content-first stack that fits the product better.

This spec supersedes the framework assumption in `docs/specs/2026-03-28-blog2-design.md` that `blog2` must remain a Next.js app.

## Why Change

`blog2` is mostly a content site with a very small amount of interactivity.

The current codebase already behaves that way:

- most public pages are `force-static`
- article detail uses `generateStaticParams()`
- thoughts now read a checked-in snapshot
- the only significant client-side UI is the stack filter control

But the app still carries a full Next.js + OpenNext + Cloudflare deployment chain, plus Next-specific concepts in the route layer:

- `src/app/**`
- `generateMetadata()`
- `generateStaticParams()`
- `next/font/google`
- `next/link`
- `next/navigation`
- OpenNext worker generation

That is extra machinery for a product whose core job is "render content well on Cloudflare."

Astro is a better fit because:

- it is built for content-heavy multi-page sites
- static-first behavior matches most current routes
- React islands let us keep the few interactive pieces that matter
- the official Cloudflare adapter removes the OpenNext translation layer

## Measured Success Criteria

This migration should not be justified by aesthetics alone.

Before cutover, capture a baseline for:

- local dev startup and preview workflow friction
- build and preview time
- deployment chain complexity
- route parity failures found in browser checks
- production-facing page performance where we have data

The migration only earns approval if it improves at least one meaningful operational or user-facing metric without regressing public behavior.

## Migration Preconditions

Before any real framework cutover work starts:

1. rotate and externalize the committed secrets in `src/config/server.ts`, unless the user explicitly accepts the risk and defers it
2. reconcile the roadmap and mission docs so the team is not simultaneously optimizing for "finish the Next.js app" and "replace the framework"
3. make the freshness policy explicit for `/projects` and `/stack`
4. define the exact public-surface parity checklist, including navigation visibility, metadata behavior, and error/not-found states

Current explicit decision:

- `/projects` and `/stack` preserve the current `10 minute` freshness target during the Astro migration

## Scope

### In Scope

- migrate `blog2` in place to Astro
- keep the app in `web/apps/blog2`
- keep Notion as the source of truth for public content
- keep checked-in thoughts snapshot flow
- keep Cloudflare as the deploy target
- preserve public route structure and visible behavior unless the migration requires a documented exception
- preserve business logic in `src/domains/**` and external adapters in `src/integrations/**`

### Out of Scope

- parallel "blog3" app
- migrating content from Notion into markdown or Astro content collections
- changing the information architecture of the public blog
- introducing a new database
- rebuilding admin, `fusink`, or generic backend tooling
- adding new public features unrelated to the framework migration

## Product and Runtime Boundaries

`blog2` remains a public blog product only.

The migration changes:

- route files
- page/layout composition
- deployment/runtime configuration
- framework-specific UI boundaries

The migration does not change:

- content ownership
- public URLs
- page-level product scope
- the existing Notion normalization logic unless a framework boundary forces it

## Chosen Direction

Build `blog2` as an Astro app with the official Cloudflare adapter and React integration.

### Platform Shape

- framework: latest stable Astro
- deploy adapter: `@astrojs/cloudflare`
- UI reuse: `@astrojs/react`
- styling: keep Tailwind 4, CSS modules, and current design tokens
- runtime target: Cloudflare Workers
- static default: yes
- opt into on-demand rendering only where the route truly needs runtime behavior

### Route Strategy

Move from `src/app/**` to `src/pages/**` and `src/layouts/**`.

Target route layout:

```text
src/
  layouts/
    SiteLayout.astro
  pages/
    index.astro
    blog/index.astro
    articles/[slug].astro
    projects/index.astro
    stack/index.astro
    thoughts/index.astro
    404.astro
    api/
      health.ts
      cron/
        thoughts.ts
```

The route move must preserve the current public shell behavior, including:

- active navigation logic
- whether `/stack` is visible in production navigation
- custom `404` UI
- custom error-boundary UI
- page-level metadata behavior

### Rendering Strategy

Use static generation for routes that are already effectively build-time content:

- `/`
- `/blog`
- `/articles/[slug]`
- `/thoughts`

Use explicit on-demand rendering only for routes that need runtime freshness or request awareness:

- `/api/health`
- `/api/cron/thoughts`
- `/projects` and `/stack` only if we keep their current freshness semantics instead of moving them to build-time output

The default should remain static-first. Runtime routes should be the exception, not the center of gravity.

The migration must not silently change the current `/projects` and `/stack` freshness behavior. That choice needs to be documented before implementation.

### UI Strategy

Do not rewrite every TSX view into `.astro` just because we can.

Instead:

1. keep framework-neutral React view components where that is already working
2. remove Next-only imports from shared view code
3. render those React components from Astro pages without hydration by default
4. hydrate only the truly interactive islands

Initial client island expectation:

- `src/domains/stack/stack-list.tsx`

Components that should become framework-neutral or Astro-owned during migration:

- `src/app/layout.tsx` -> `src/layouts/SiteLayout.astro`
- `src/domains/shell/site-header.tsx`
- `src/domains/shell/site-footer.tsx`
- any component that imports `next/link`, `next/navigation`, or `next/font/google`

### Data and Integration Strategy

Keep the domain and integration layers.

Do not move business logic into Astro pages.

Preserve:

- `src/domains/article/**`
- `src/domains/projects/**`
- `src/domains/stack/**`
- `src/domains/thoughts/**`
- `src/integrations/notion/**`
- `src/integrations/telegram/**`
- cache interfaces in `src/integrations/kv/**`

Framework code should call those modules. Those modules should not learn Astro.

### Cloudflare Strategy

Remove:

- `next.config.mjs`
- `open-next.config.ts`
- OpenNext build/deploy/preview scripts

Add:

- `astro.config.mjs`
- Astro Cloudflare adapter configuration
- Wrangler config aligned to Astro's worker output

Keep Cloudflare bindings explicit and behind a small platform adapter instead of importing bindings directly all over the app.

The platform adapter should be framework-owned, not domain-owned. Domain modules should receive storage or environment-backed collaborators, not call Astro or Cloudflare APIs directly.

### Fonts and Metadata

Replace `next/font/google` and Next metadata helpers with Astro-owned equivalents.

Chosen direction:

- move fonts to explicit CSS/font packages or explicit `<link>` ownership
- centralize SEO metadata in small helper utilities consumed from Astro pages/layouts

Do not keep a Next-compat abstraction just to avoid touching metadata.

## Alternatives Considered

### 1. Stay on Next.js and Keep Shipping

Pros:

- no migration cost
- no temporary deployment risk

Cons:

- keeps a framework/runtime chain that is heavier than the product needs
- keeps OpenNext as an extra translation layer
- keeps Next-specific route and metadata concepts in a content-heavy app

Decision:

- rejected

### 2. Build a Parallel Astro App Beside `blog2`

Pros:

- lower cutover risk
- cleaner greenfield rewrite

Cons:

- duplicate app surface
- duplicate docs and deploy config
- doubles migration overhead for a relatively small app

Decision:

- rejected

### 3. Migrate `blog2` In Place to Astro

Pros:

- keeps product ownership simple
- reuses the existing domain/integration code
- removes framework complexity without creating a second public app

Cons:

- requires a route-layer and deployment-layer cutover
- temporarily mixes React view reuse with Astro entrypoints

Decision:

- chosen

## Risks

### Risk 1: Framework-Layer Rewrite Creeps into a Product Rewrite

Mitigation:

- keep URL structure and content semantics fixed
- treat design changes as regressions unless explicitly planned

### Risk 2: Next-Specific View Code Is More Widespread Than It Looks

Mitigation:

- audit imports before cutting code
- convert shared components to framework-neutral anchors/props first

### Risk 3: Cloudflare Runtime Behavior Changes During the Adapter Swap

Mitigation:

- verify local `astro dev` and `astro preview` against the real Workers runtime
- keep health endpoint and runtime smoke checks in the first migration slice

### Risk 4: Secrets Stay Committed During the Platform Rewrite

Mitigation:

- treat secret rotation and env externalization as a required migration task, not a nice-to-have TODO

## Acceptance Criteria

The migration is done when:

- `blog2` builds and previews as an Astro app on Cloudflare
- the public routes above render without product regressions
- the remaining interactive UI is isolated to explicit React islands
- Next.js and OpenNext dependencies/config are removed
- deployment and local verification run through Astro + Wrangler, not Next + OpenNext
- docs, roadmap, task ledger, and verification guidance all reflect Astro as the active architecture
