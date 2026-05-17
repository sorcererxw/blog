# OpenNext Next.js Rebuild Design Spec

## Summary

Rebuild the standalone Personal Site from the current Astro + Cloudflare adapter runtime back to a Next.js App Router application deployed to Cloudflare Workers through `@opennextjs/cloudflare`.

This is a framework and deployment-layer replacement. It keeps the current Personal Site product direction:

- `/` is the primary Profile Hero + Overview Feed surface
- `/articles/[slug]` remains the durable Content Detail surface
- `/projects`, `/thoughts`, `/en/**`, and `/zh/**` remain compatibility redirects owned by middleware; `/blog` is not a route and should return `404`
- sitemap, health, media, and legacy cron endpoints remain public HTTP surfaces
- `robots.txt` is a static public asset, not a route handler
- Notion, Telegram snapshot, Cloudflare KV abstractions, and domain use cases stay outside the route layer

## Target Platform

- framework: Next.js App Router
- runtime adapter: `@opennextjs/cloudflare`
- deploy target: Cloudflare Workers
- supported runtime: Next.js Node.js runtime, not the Edge runtime
- local app development: `next dev`
- worker preview/deploy: OpenNext Cloudflare CLI
- styling: keep Tailwind 4 and existing CSS modules where already approved
- fonts: load Google font families through `next/font/google` in the root layout and expose them as CSS variables consumed by Tailwind theme tokens
- UI reuse: keep existing React domain components

OpenNext Cloudflare requirements for this rebuild:

- keep `nodejs_compat`
- keep a compatibility date later than `2024-09-23`
- use a checked-in `src/worker.ts` entrypoint that delegates fetch handling to OpenNext-generated `.open-next/worker.js`
- keep OpenNext-generated `.open-next/assets`
- keep Cloudflare bindings in `wrangler.jsonc`
- use `getCloudflareContext` only when a route needs raw Worker bindings
- do not add `export const runtime = "edge"`

## Route Strategy

Move active routes from `src/pages/**` and `src/layouts/**` to `src/app/**`.

Target route layout:

```text
src/app/
  layout.tsx
  page.tsx
  not-found.tsx
  error.tsx
  articles/[slug]/page.tsx
  api/health/route.ts
  api/cron/thoughts/route.ts
  media/[id]/route.ts
  sitemap.xml/route.ts
src/middleware.ts
public/robots.txt
```

The first rebuild slice may keep historical Astro source files on disk while the Next.js runtime is made active. Once the Next route parity is verified, the old Astro entrypoints should be retired in a cleanup slice.

## Rendering and Freshness

Use Next.js dynamic rendering where current behavior depends on Notion or request URL query state.

Initial freshness targets:

- `/`: `600` second revalidation target through response/cache policy or route config
- `/articles/[slug]`: `600` second revalidation target
- sitemap: generated from current article list at request/build time
- compatibility redirects: permanent redirects from middleware for supported legacy non-blog paths
- health and cron endpoints: always dynamic

The homepage must parse query filters on the server so `/`, `/?type=writing`, `/?type=projects`, and `/?source=telegram` render meaningful initial state before hydration.

## Metadata and SEO

Replace Astro head rendering with Next metadata primitives and a small adapter around the existing `SeoDocument` model.

Requirements:

- preserve canonical URL behavior
- preserve page-level robots directives through metadata
- serve crawler rules from `public/robots.txt`
- preserve Open Graph and Twitter metadata
- preserve article structured data and homepage structured data through JSON-LD scripts
- keep route code thin; do not move SEO construction into components

## Environment and Bindings

Runtime variables are defined through Wrangler config, not a repo-local `src/config` package.

Cloudflare bindings and variables remain declared in `wrangler.jsonc` when a current runtime path consumes them. Non-secret variables live under `vars`; required secret bindings live under `secrets.required` and are provisioned outside the repository. App code reads the generated Cloudflare env shape through the OpenNext Cloudflare context helper, not direct `process.env` config wrappers.

Notion public read source ids are non-secret Wrangler vars: `NOTION_BLOG_DATABASE_ID` for writing entries and article details, `NOTION_PROJECTS_DATABASE_ID` for projects, and `NOTION_INTRO_PAGE_ID` for the Profile Hero intro page. `NOTION_SECRET` remains a required secret.

KV storage must remain behind existing storage abstractions. Do not bind page code directly to raw KV key names.

## Out of Scope

- changing the Personal Site product model
- reintroducing primary archive pages for `/blog`, `/projects`, or `/thoughts`
- reintroducing page files for redirects
- keeping historical topic/query pages that conflict with the active Personal Site direction
- adding D1 or a new database
- changing Notion schemas
- rebuilding admin, route management, `fusink`, or generic backend services

## Success Criteria

- `pnpm test` passes
- `pnpm typecheck` passes
- `pnpm build` produces a Next.js build
- `pnpm preview` serves an OpenNext worker locally
- HTTP checks prove `/`, `/?type=writing`, `/blog` returning `404`, supported proxy compatibility redirects, article detail, sitemap, static robots, health, cron, and media surfaces
- browser verification proves the homepage renders Profile Hero, Overview Feed filters hydrate, and article detail renders
- living docs record the new architecture and verification evidence
