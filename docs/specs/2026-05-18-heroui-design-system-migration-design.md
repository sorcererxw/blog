# HeroUI Design System Migration Design

## Summary

Migrate the Personal Site design-system implementation from the local shadcn/Base UI component set to HeroUI v3, while preserving the current public visual language and route behavior.

This is a component and token ownership change. It is not a product redesign, routing change, feed layout rewrite, or content model change.

## Goals

- make HeroUI v3 the target public component library
- keep Tailwind CSS v4 and app-owned CSS variable tokens
- remove shadcn/Base UI components progressively instead of keeping a permanent compatibility layer
- keep UI composition in `src/components/*`; `src/domains/*` owns data models, normalization, sorting, and use cases
- verify each migrated component through the smallest route slice that proves real rendered behavior

## Current State

The active app already uses Tailwind CSS v4, OKLCH CSS variables, and a small local component set under `src/components/ui`.

Current local primitives include:

- `badge`
- `button`
- `card`
- `empty`
- `field`
- `label`
- `select`
- `separator`
- `table`
- `tabs`

Business surfaces import these primitives from `@/components/ui/*`. The current roadmap and Personal Site overview spec previously named shadcn as the Feed UI primitive source; this spec supersedes that component-source decision.

## Target State

HeroUI v3 is the target component implementation for shared public UI primitives.

The app should use:

- `@heroui/react` for React component behavior
- `@heroui/styles` for HeroUI component styles
- Tailwind CSS v4 for app/component layout styling
- app-owned tokens in `src/app/globals.css` for site brand colors, typography, radius, and base surfaces

HeroUI should not own product data flow, feed layout estimates, routing, metadata, Notion rendering, or Cloudflare bindings.

## Migration Rule: No Long-Lived UI Wrapper

Each component migration must delete the corresponding old `src/components/ui/<component>.tsx` file in the same slice.

Do not migrate by keeping `src/components/ui/*` as a long-lived compatibility facade around HeroUI.

For every migrated primitive:

1. update call sites away from `@/components/ui/<component>`
2. use HeroUI imports directly with HeroUI default styling, or introduce a narrowly named app component outside `src/components/ui` when the wrapper represents product semantics rather than primitive compatibility
3. delete the old `src/components/ui/<component>.tsx`
4. remove now-unused shadcn/Base UI dependencies when no remaining component needs them
5. record the deleted file and replacement import strategy in `docs/task-ledger.md`

Allowed app wrappers must be semantic, not primitive mirrors. For example, `FeedSourceBadge` or `ArticleCallout` is acceptable when it owns product meaning; `components/ui/badge.tsx` wrapping HeroUI `Badge` is not.

Migrated components should use HeroUI defaults unless a later product/design task explicitly requests local styling.

## Token Strategy

The app token source remains `src/app/globals.css`.

Rules:

- keep public brand tokens stable unless a separate visual redesign spec approves a change
- import Tailwind before HeroUI styles
- audit HeroUI variable names before importing `@heroui/styles` globally
- resolve conflicts by making app tokens explicit rather than letting package defaults silently redefine site colors
- keep dark-mode variables aligned with existing `.dark` behavior
- keep route/component styling on inline Tailwind utilities where the Tailwind convergence spec already requires it

The first token slice may temporarily keep the shadcn CSS import until the last shadcn-dependent primitive is removed. The final cleanup must remove unused shadcn bootstrap files and dependencies.

## Theme Toggle

The public shell may expose a light/dark theme toggle in the header.

Rules:

- place the toggle on the right side of the header action area
- use a HeroUI icon-only button and the existing HeroUI token variables
- use moon and sun icons for the selected and unselected visual states
- persist the selected theme in `localStorage`
- apply the theme to `document.documentElement` through both the `.dark` / `.light` class and `data-theme` so the existing HeroUI token selectors stay active
- keep this as shell UI behavior, not a domain concern

## Component Migration Order

Migrate from lowest-risk display primitives to higher-risk interactive primitives:

1. `separator`
2. `badge`
3. `button`
4. `card`
5. `empty`
6. `label` and `field`
7. `tabs`
8. `select`
9. `table`

`tabs`, `select`, and `table` are higher risk because they touch keyboard interaction, anchor-backed filter navigation, form-like controls, or rich-content rendering.

## Feed UI Contract

The Overview Feed remains one unified Feed Module presentation system. The component library may change, but these product rules do not:

- Feed Filters remain URL-backed client state on `/`
- Feed Modules remain unified across Blog Entries, Projects, and Social Posts
- Content Sources do not provide module size, masonry estimates, or card placement
- hydrated layout remains browser-owned through the Feed Layout Engine
- `/blog` stays absent

HeroUI migration must not reintroduce source-specific feed card families or route-level archive surfaces.

## Non-Goals

- no broad visual redesign
- no route changes
- no feed layout engine rewrite
- no change to Notion, Telegram, KV, OpenNext, or Cloudflare binding contracts
- no migration to D1 or another storage layer
- no permanent dual support for shadcn and HeroUI primitives

## Verification

Each component slice must run the lightest verification that proves the touched behavior:

- display-only primitive: targeted tests, `pnpm lint`, `pnpm typecheck`, `pnpm build`, route `curl`, and browser verification for affected visible surfaces
- route or feed primitive: include `/`, relevant filter URLs such as `/?type=writing`, and article detail if rich content is affected
- interactive primitive: include browser verification for keyboard/click behavior, hydrated state, no console errors, and no horizontal overflow

Every slice must update `docs/task-ledger.md` with commands and outcomes. Update `docs/verification.md` when the migrated component changes a reusable verification baseline.
