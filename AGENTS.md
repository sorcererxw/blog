# AGENTS.md

## Purpose

This repository contains the standalone public blog product.

The goal is to maintain the Next.js + OpenNext public Personal Site application that was extracted from `tempura/web/apps/blog2` into its own repository at `/Users/sorcererxw/repo/sorcererxw/blog`.

This repository replaces the current split public-blog architecture across:

- `web/apps/blog`
- `web/apps/blog2`
- `server/app/blog`
- Vercel
- Railway

This app covers the public blog domain only.

It does **not** cover:

- `fusink`
- route management/admin tooling
- generic backend platform work outside the public blog

## Operating Model

This directory is designed for autonomous agent execution with progressive disclosure.

An agent should not load the entire project context by default. Start with the minimum necessary context, then expand only as needed.

### Required Read Order

For any task in this repository, read in this order:

1. `AGENTS.md`
2. the most relevant doc under `docs/specs/`
3. the most relevant doc under `docs/plans/`, if one exists
4. `docs/roadmap.md`
5. the relevant section of `docs/task-ledger.md`
6. `docs/verification.md` before claiming completion

Do not load unrelated specs, plans, or legacy code unless the current task needs them.

## Mandatory Execution Loop

Every non-trivial task must follow this loop:

1. Understand the requirement
2. Check whether an existing spec already covers it
3. If the requirement changes behavior or architecture, write or update a spec first
4. Write or update an implementation plan before substantial implementation work
5. Implement in small vertical slices
6. Verify the change with the appropriate mix of:
   - unit/integration tests
   - `curl` or HTTP-level checks
   - browser verification
7. Update the living docs before ending the task

Do not skip design and planning for substantial work.

## Definition of Done

Work is not done unless all applicable items below are complete:

- code is implemented
- tests were run or an explicit reason was recorded for why they could not be run
- HTTP behavior was checked with `curl` or equivalent when endpoints/pages are involved
- browser verification was completed when UI behavior is involved
- relevant roadmap/task ledger entries were updated
- any new architectural decisions were reflected in docs

## Verification Requirements

Use the lightest verification that still proves the behavior.

### Minimum Expectations

- Pure logic change: run targeted tests
- Route handler or server behavior change: run tests and `curl`
- UI/page change: run tests if applicable, then verify in a browser
- End-to-end slice: prefer all three

### Verification Priority

1. automated tests
2. `curl` or direct HTTP inspection
3. browser verification for rendered behavior

Do not rely on browser inspection alone when server behavior can be tested directly.

Always record verification commands and outcomes in `docs/task-ledger.md`.

## Documentation Contract

The docs in this directory have separate responsibilities.

### Stable Contract

- `AGENTS.md`

This file defines how to work.

### Living State

- `docs/roadmap.md`
- `docs/task-ledger.md`
- `docs/verification.md`

These files define what remains, what happened, and how verification should be performed.

### Design and Planning

- `docs/specs/`
- `docs/plans/`

These files define why a change exists and how it should be executed.

## Progressive Disclosure Rules

Keep context small and deliberate.

- Read the current spec before reading legacy implementation details
- Read the current plan before inventing a new plan
- Only inspect legacy code needed to migrate the current feature slice
- Do not scan the entire old Go service or old blog frontend unless the task requires it
- Summarize findings into docs instead of forcing future agents to rediscover them

## Legacy System Rules

Legacy code exists to provide:

- feature inventory
- behavioral reference
- edge-case reference

Legacy code does **not** define the target architecture.

Do not:

- recreate the old proto/client coupling
- mirror old directory layout by default
- copy abstractions whose only purpose was to support the old split architecture

Preserve behavior where it matters. Do not preserve accidental structure.

## Implementation Principles

- Build `blog2` as a standalone greenfield app
- For greenfield framework/bootstrap work, prefer the official CLI and latest stable defaults over hand-written scaffolding unless a spec explicitly says otherwise
- Keep the route layer thin
- Put business behavior behind domain use cases
- Keep external APIs inside integration adapters
- Normalize Notion content into app-native models
- Prefer simple first-version decisions when they do not block required behavior
- Use Cloudflare KV behind a storage abstraction instead of binding app code directly to raw key names everywhere

## Storage Guidance

The current design assumes:

- Notion is the source of truth for content
- Cloudflare KV stores app-owned derived and cached data
- a storage abstraction such as `BlogStore` hides KV details

Do not introduce D1 or other storage unless the current task explicitly requires it or the design docs are updated first.

## Task Logging Requirements

After meaningful work, update `docs/task-ledger.md` with:

- date
- task summary
- files changed
- key decisions
- verification performed
- follow-up work
- blockers or open questions

Record concrete details. Do not write vague summaries.

Future agents should be able to continue work from the ledger without reconstructing the session from git history alone.

## Roadmap Maintenance Requirements

Update `docs/roadmap.md` when:

- a milestone starts or completes
- scope changes
- architectural direction changes
- a migration slice is added, removed, or reordered

Keep roadmap entries concise and decision-oriented.

## Spec and Plan Rules

Create or update a spec when:

- architecture changes
- product scope changes
- data flow changes
- a new subsystem is introduced

Create or update a plan when:

- the work will take multiple steps
- multiple files or subsystems are involved
- verification requires staged execution

## Browser Verification Guidance

Use real browser verification for:

- navigation
- rendering correctness
- hydration behavior
- interactive UI
- translated content presentation
- page metadata and user-visible regressions

If browser verification cannot be run, record why in `docs/task-ledger.md`.

## Task Start Checklist

Before implementing, confirm:

- which spec applies
- whether a plan already exists
- what exact slice is being worked on
- what success looks like
- how it will be verified
- what docs must be updated afterward

## Task End Checklist

Before ending a task, confirm:

- implementation is complete for the intended slice
- verification was performed
- docs were updated
- roadmap impact is recorded
- follow-up tasks are listed
- residual risks are explicit

## Current Project Entry Point

Start from:

- `docs/specs/2026-05-13-opennext-nextjs-rebuild-design.md`
- `docs/specs/2026-05-12-personal-site-overview-design.md`
- `docs/roadmap.md`
- `docs/task-ledger.md`
- `docs/verification.md`

If a more recent spec or plan exists for the active task, use that instead.
