# Personal Site

Standalone public Personal Site application for `sorcererxw.com`.

The app is a Next.js App Router project deployed to Cloudflare Workers through OpenNext. It serves the public blog and personal-site surfaces only: the homepage overview feed, article detail pages, sitemap, health checks, media proxying, and compatibility redirects.

## Scope

Included:

- Profile Hero and Overview Feed on `/`
- article details on `/articles/[slug]`
- Notion-backed writing, project, and profile content
- runtime Telegram public-page ingestion for social feed items
- Cloudflare Worker deployment through `@opennextjs/cloudflare`
- Cloudflare KV-backed canonical media caching behind app abstractions

Excluded:

- admin tooling
- route management tools
- private backend platform services
- `fusink`

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- OpenNext Cloudflare
- Wrangler
- Vitest
- ESLint

## Local Setup

Install dependencies:

```sh
pnpm install
```

Create local secrets in `.dev.vars`:

```sh
NOTION_SECRET=...
```

Non-secret runtime ids are configured in `wrangler.jsonc`.

Run the app:

```sh
pnpm dev
```

## Useful Commands

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

Generate Cloudflare environment types after changing `wrangler.jsonc`:

```sh
pnpm cf-typegen
```

## Deployment

Preview the OpenNext Worker locally:

```sh
pnpm preview
```

Deploy to Cloudflare:

```sh
pnpm deploy
```

Required secrets are provisioned outside the repository. Do not commit `.dev.vars` or generated build artifacts.

## Documentation

Start with:

- `AGENTS.md`
- `docs/roadmap.md`
- `docs/task-ledger.md`
- `docs/verification.md`

Active specs and implementation plans live under `docs/specs/` and `docs/plans/`. Archived migration notes live under `docs/archive/`.
