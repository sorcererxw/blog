# coss UI Design System Migration Design

## Summary

Replace HeroUI v3 (`@heroui/react`, `@heroui/styles`, `tailwind-variants`) completely with **coss UI** (`https://coss.com/ui`, built on `@base-ui/react` + Tailwind CSS v4 + `class-variance-authority`) across all public UI primitives, CSS design tokens, and shared wrappers.

This is a complete component-library and design-token cutover. Product behavior, routing, feed layout engine, Notion/Telegram/X data pipelines, KV SWR caching, Cloudflare Workers edge caching, and zero-cost constraints remain unchanged.

## Supersedes

- Supersedes `docs/specs/2026-05-18-heroui-design-system-migration-design.md`.

## Goals

- Remove `@heroui/react`, `@heroui/styles`, `tailwind-variants`, and `src/components/heroui/` completely (zero dual-system support).
- Adopt official coss UI registry components under `src/components/ui/`:
  - `badge.tsx` (replaces HeroUI `Chip`)
  - `button.tsx` + `spinner.tsx` (replaces HeroUI `Button`)
  - `card.tsx` (replaces HeroUI `Card` and `HeroCard*`)
  - `separator.tsx` (replaces HeroUI `Separator` and `HeroSeparator`)
  - `table.tsx` (replaces HeroUI/React Aria `Table` inside `RichContentTable`)
  - `tabs.tsx` + `segmented-control.tsx` (replaces HeroUI/React Aria `Tabs`)
- Adopt coss UI's official neutral CSS variable token system in `src/styles/globals.css` (`--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--info`, `--info-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--border`, `--input`, `--ring`, `--radius`), supporting both `.light`/`[data-theme="light"]` and `.dark`/`[data-theme="dark"]`.
- Preserve site typography (`Libre Bodoni` for `--font-heading`, `Courier Prime` for `--font-display` and `--font-code`) via self-hosted `@fontsource/*`.
- Apply coss UI's Base UI root isolation (`relative` on `<body>`, `isolate relative flex min-h-svh flex-col` on root app shell in `src/routes/__root.tsx`).
- Reduce client JavaScript and CSS bundle size further by eliminating React Aria / HeroUI runtime and prebuilt stylesheets.

## Token Mapping Rules

HeroUI v3 and coss UI assign different semantics to `--muted` and `--accent`:

| Semantic Role | Removed HeroUI Token | coss UI Token |
| :--- | :--- | :--- |
| Page background | `--background` | `--background` (`bg-background`) |
| Primary text | `--foreground` | `--foreground` (`text-foreground`) |
| Card surface | `--surface` (`bg-surface`) | `--card` (`bg-card`) + `--card-foreground` |
| Subtle surface / code / media bg | `--default` (`bg-default`) | `--muted` (`bg-muted`) / `--secondary` (`bg-secondary`) |
| Secondary / muted text | `--muted` (`text-muted`) | `--muted-foreground` (`text-muted-foreground`) |
| Borders & dividers | `--separator` (`border-separator`) | `--border` (`border-border`) |
| Focus outline / ring | `--focus` (`outline-focus`) | `--ring` (`outline-ring` / `ring-ring`) |
| Hover surface fill | — | `--accent` (`hover:bg-accent`) |
| Primary interactive / link accent | `--accent` (`text-accent`) | `--primary` (`text-primary` / `bg-primary`) |

All product components and CSS modules must migrate off HeroUI-only tokens (`--surface`, `--default`, `--separator`, `--focus`, `--field-*`, `--segment`, `--overlay`, `--danger`, `rounded-small`, `rounded-medium`) onto standard coss UI + Tailwind v4 tokens.

## Component Mapping

- `ThemeToggle` (`src/components/shell/theme-toggle.tsx`): coss UI `Button` (`variant="ghost"`, `size="icon-sm"`, `onClick`), retaining `localStorage` key `blog-theme` and `.dark`/`.light`/`data-theme` sync.
- `OverviewFeed` (`src/components/feed/overview-feed-view.tsx`):
  - Filter bar: coss UI `Tabs`, `TabsList`, `TabsTab` (built-in sliding indicator, `nativeButton={false}` with `render={<SiteLink ... />}`).
  - Feed cards: coss UI `Card` (`data-slot="card"`), preserving `role="link"`, keyboard navigation, timestamp anchor, and masonry layout engine.
  - Type/source pill: coss UI `Badge` (`variant="secondary"`, `data-slot="badge"`).
- `RichContentTable` (`src/components/rich-content/rich-content-table.tsx`): coss UI semantic HTML `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, preserving `role="columnheader"` and `role="rowheader"` accessibility semantics without React Aria's heavy client table runtime.
- `ArticleDetailView`, `HomePageContentBase`, `ProjectsList`, `ThoughtsPage`: coss UI `Card` (`CardHeader`, `CardTitle`, `CardDescription`, `CardPanel`/`CardContent`), `Separator`, and `Badge`.

## ESLint & Repository Hygiene

- `eslint.config.mjs` exempts official copied coss UI registry primitives under `src/components/ui/**` from `local/no-arbitrary-tailwind-design-tokens` (coss UI intentionally uses optical border-compensation `calc(--spacing(...)-1px)` and inner radius `calc(var(--radius-*)-1px)` utilities) while keeping the rule enforced on all app/product components.
- `src/components/heroui/` is deleted completely.

## Verification Criteria

- Zero references to `@heroui/react`, `@heroui/styles`, `tailwind-variants`, `components/heroui`, `HeroCard`, or `HeroSeparator` in `src/` and `package.json`.
- `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `wrangler deploy --dry-run`, `git diff --check` all pass.
- Local Wrangler Worker HTTP checks and real browser verification confirm `/` (3-column masonry, coss UI Tabs/Card/Badge/Button, theme toggle dark/light, filter switching), `/articles/grpc-gateway-comparison` (coss UI Table + Shiki), and `/articles/screenshot-render` (`<!--render-->` + Shiki) render with zero errors.
