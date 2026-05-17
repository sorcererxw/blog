# Project Cleanup Design Spec

## Summary

Clean the standalone Personal Site repository after the OpenNext + Next.js rebuild so the active project shape is easy to read.

This is a repository hygiene slice. It does not change the Personal Site product model, public routes, content sources, storage model, or deployment target.

## Goals

- keep active specs and plans focused on the current Personal Site and OpenNext direction
- preserve superseded design history without making it part of the default agent read path
- remove local generated artifacts and IDE state from the working tree
- remove package dependencies that are no longer referenced by source code or scripts
- keep verification commands and cleanup decisions visible in the living docs

## Active Documentation Boundary

The default `docs/specs/` and `docs/plans/` directories should contain docs that are still active for current work.

Active docs include:

- Personal Site overview product direction
- OpenNext + Next.js runtime direction
- Tailwind inline style convergence
- current or still-applicable feature slices such as image delivery
- this cleanup slice

Superseded docs should move under:

```text
docs/archive/specs/
docs/archive/plans/
```

Archive files preserve history and decision evidence, but future agents should not treat them as the active design path unless a task explicitly asks for historical context.

## Cleanup Boundary

Remove local-only generated or editor state from the working tree:

- `.next/`
- `.open-next/`
- `.wrangler/`
- `.idea/`
- empty retired Astro route directories under `src/pages/`

Keep `node_modules/` during the cleanup work so verification does not pay an unnecessary reinstall cost. Dependency changes should still be validated by refreshing `pnpm-lock.yaml`.

## Dependency Boundary

Remove dependencies only when they have no source or script imports after the OpenNext rebuild.

Keep dependencies that are still part of the active runtime, UI primitives, source integrations, build chain, or local verification flow.

## Non-Goals

- deleting historical docs entirely
- changing public route behavior
- renaming runtime cache keys such as `blog2:*`
- renaming the npm package
- changing Notion, Telegram, KV, or Cloudflare binding behavior
- replacing the current UI primitive approach

## Success Criteria

- active docs directories are materially smaller and contain only active or still-applicable design docs
- archived docs remain available under `docs/archive/`
- local generated and IDE directories are removed or ignored
- unused dependencies are removed from `package.json` and `pnpm-lock.yaml`
- `pnpm install --lockfile-only`, `pnpm test`, `pnpm typecheck`, and `pnpm build` pass
- `docs/task-ledger.md` records the cleanup commands and outcomes
