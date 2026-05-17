# Project Cleanup Plan

## Status

Done.

## Goal

Reduce repository noise after the OpenNext + Next.js rebuild without changing product behavior.

## Slice 1: Documentation Archive

Files:

- `docs/specs/**`
- `docs/plans/**`
- `docs/archive/**`
- `docs/roadmap.md`
- `docs/task-ledger.md`

Work:

1. keep the active Personal Site, OpenNext, Tailwind, image delivery, and cleanup docs in the default specs/plans directories
2. move superseded foundation, archive-page, route-layer, UI-redesign, direct-Telegram, thoughts-page, search-wedge, and Astro runtime docs into `docs/archive/specs/` and `docs/archive/plans/`
3. record the archive rule in the roadmap and task ledger

Verification:

- `find docs/specs docs/plans -maxdepth 1 -type f | sort`
- `find docs/archive -maxdepth 2 -type f | sort`

## Slice 2: Local Artifact Cleanup

Files:

- `.gitignore`
- local generated directories
- empty retired route directories

Work:

1. remove `.next/`, `.open-next/`, `.wrangler/`, and `.idea/`
2. remove empty `src/pages/**` directories left after Astro route retirement
3. add `.idea/` to `.gitignore`
4. keep `node_modules/` for verification

Verification:

- `git status --short --ignored`
- `test ! -e src/pages`

## Slice 3: Dependency Cleanup

Files:

- `package.json`
- `pnpm-lock.yaml`

Work:

1. remove dependencies with no source or script imports
2. refresh the lockfile
3. verify the app still builds and tests

Verification:

- `pnpm install --lockfile-only`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

## Acceptance Boundary

The cleanup is complete when the repository keeps the current implementation and active docs easy to scan, while historical context remains available under `docs/archive/`.
