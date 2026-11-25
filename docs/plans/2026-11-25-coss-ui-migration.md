# coss UI Migration Implementation Plan

## Goal

Completely replace HeroUI v3 (`@heroui/react`, `@heroui/styles`, `tailwind-variants`) with official coss UI (`https://coss.com/ui`) components and design tokens while keeping Vite 8 + TanStack Start + Cloudflare Workers native runtime, all site features, and zero-cost performance optimizations intact.

## Steps

### Phase 1: Dependencies & Design Tokens
1. Remove `@heroui/react`, `@heroui/styles`, and `tailwind-variants` from `package.json`; add `@base-ui/react` and `class-variance-authority`; run `pnpm install`.
2. Rewrite `src/styles/globals.css` with official coss UI neutral light/dark CSS tokens (`:root` / `.light` / `[data-theme="light"]` and `.dark` / `[data-theme="dark"]`), `@theme inline` mappings, `@fontsource/libre-bodoni` + `@fontsource/courier-prime` typography, and base styles without `@heroui/styles`.
3. Update `src/routes/__root.tsx` for Base UI root isolation (`relative` on `<body>`, `isolate relative flex min-h-svh flex-col` wrapper).

### Phase 2: Official coss UI Primitives
4. Add official coss UI components under `src/components/ui/`:
   - `spinner.tsx`
   - `button.tsx`
   - `badge.tsx`
   - `card.tsx`
   - `separator.tsx`
   - `segmented-control.tsx`
   - `tabs.tsx`
   - `table.tsx`
   (Adapting only `@/registry/default/lib/utils` -> `@/lib/utils` and `@/registry/default/ui/*` -> `@/components/ui/*`, removing unnecessary Next.js `"use client"` directives.)
5. Delete `src/components/heroui/server-primitives.tsx`.

### Phase 3: Migrate App Components & CSS Tokens
6. Migrate `src/components/shell/theme-toggle.tsx` to coss UI `Button`.
7. Migrate `src/components/rich-content/rich-content-table.tsx` to coss UI `Table` primitives (preserving `role="columnheader"` and `role="rowheader"` semantics).
8. Migrate `src/components/feed/overview-feed-view.tsx` to coss UI `Card`, `Badge`, `Tabs`/`TabsList`/`TabsTab`, and coss UI tokens (`border-border`, `bg-muted`, `text-muted-foreground`, `outline-ring`, `rounded-md`/`rounded-lg`).
9. Migrate `src/components/article/article-detail-view.tsx`, `src/components/home/intro-content.tsx`, `src/components/projects/projects-list.tsx`, `src/components/thoughts/thoughts-page.tsx`, `src/components/article/article-list.tsx`, `src/components/shell/site-header.tsx`, `src/components/shell/site-footer.tsx`, `src/components/shell/public-boundary.tsx`, `src/routes/__root.tsx`, `src/components/article/article-detail-view.module.css`, and `src/components/home/intro.module.css` to coss UI components and CSS tokens.

### Phase 4: ESLint, Tests & Cleanup
10. Update `eslint.config.mjs` to exempt `src/components/ui/` from `local/no-arbitrary-tailwind-design-tokens`.
11. Update HeroUI-specific assertions in `src/components/feed/overview-feed-view.test.tsx` and `src/components/projects/projects-list.test.tsx` (and `src/components/home/intro.test.tsx` / `src/components/article/article-detail-view.test.tsx` if needed) to verify coss UI semantics (`data-slot="tabs"`, `data-slot="badge"`, `data-slot="card"`, `aria-selected="true"`, `text-muted-foreground`).

### Phase 5: Verification & Living Docs
12. Run `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `wrangler deploy --dry-run`, and measure client JS/CSS + Worker bundle deltas.
13. Verify local Wrangler Worker (`wrangler dev --config dist/server/wrangler.json`) via `curl` and real browser verification (`/`, `/?type=writing`, theme toggle dark/light, `/articles/grpc-gateway-comparison`, `/articles/screenshot-render`, SPA navigation).
14. Update `docs/roadmap.md`, `docs/task-ledger.md`, and `docs/verification.md`.
