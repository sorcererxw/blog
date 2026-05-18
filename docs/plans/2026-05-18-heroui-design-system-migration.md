# HeroUI Design System Migration Plan

## Goal

Progressively replace the local shadcn/Base UI component set with HeroUI v3, deleting each old `src/components/ui/*` file as its call sites migrate.

## Shell Theme Toggle

Status: done locally

Files:

- `src/app/layout.tsx`
- `src/components/shell/site-header.tsx`
- `src/components/shell/theme-toggle.tsx`
- shell tests
- docs ledger and verification baseline

Work:

- add a HeroUI icon-only `Button` to the right side of the header
- render sun and moon icons from `lucide-react`
- persist the selected theme to `localStorage`
- synchronize `.light` / `.dark` classes and `data-theme` on `document.documentElement`
- initialize the root theme before hydration from stored preference or system color scheme

Verification:

- shell render tests
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `curl` for `/` and one article detail page
- browser verification when tooling is available

## Slice 0: Contract and Dependency Baseline

Files:

- `docs/specs/2026-05-18-heroui-design-system-migration-design.md`
- `docs/plans/2026-05-18-heroui-design-system-migration.md`
- `docs/roadmap.md`
- `docs/task-ledger.md`
- `docs/verification.md`
- `package.json`
- `pnpm-lock.yaml`
- `src/app/globals.css`

Work:

- install `@heroui/react`, `@heroui/styles`, and `tailwind-variants`
- import HeroUI styles after Tailwind
- audit token collisions with the existing app CSS variables
- keep shadcn styles temporarily only while unmigrated local primitives still need them
- record HeroUI as the active component direction in roadmap and verification docs

Verification:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `curl` for `/`
- browser verification for `/`

## Slice 1: Separator

Status: done locally

Files:

- call sites importing `@/components/ui/separator`
- `src/components/ui/separator.tsx`
- tests beside changed surfaces
- docs ledger

Work:

- replace call sites with HeroUI separator support or a simple semantic element if HeroUI has no better primitive for the use case
- delete `src/components/ui/separator.tsx`
- remove unused Base UI separator dependency usage
- completed with HeroUI `Separator` for client-only legacy field internals and server-safe `separatorVariants` for rich-content server rendering

Verification:

- targeted render tests for touched surfaces
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- browser verification for the touched page

## Slice 2: Badge

Status: done locally

Files:

- Overview Feed, Stack, Thoughts, and any other badge call sites
- `src/components/ui/badge.tsx`
- affected tests
- docs ledger and verification baseline if feed badge state changes

Work:

- replace `Badge` call sites with HeroUI defaults; current standalone label usage maps to HeroUI `Chip` because HeroUI documents `Badge` for anchored indicators and `Chip` for labels/statuses
- do not preserve the old shadcn badge styling during this migration
- delete `src/components/ui/badge.tsx`

Verification:

- `pnpm test -- src/domains/feed/overview-feed-view.test.tsx`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `curl` for `/` and `/?type=writing`
- browser verification for homepage feed labels

## Slice 3: Button

Files:

- button call sites
- `src/components/ui/button.tsx`
- affected tests
- docs ledger

Work:

- replace primitive buttons with HeroUI `Button`
- use HeroUI `onPress` for interactive buttons where applicable
- preserve `NextLink` usage for navigational actions
- delete `src/components/ui/button.tsx`

Verification:

- targeted tests for touched interactions
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- browser verification for click and keyboard behavior

## Slice 4: Card

Status: done locally

Files:

- Overview Feed cards
- Projects cards
- Thoughts embeds
- Article/Home rich content cards
- `src/components/ui/card.tsx`
- affected tests
- docs ledger and verification baseline

Work:

- replace local Card primitive with HeroUI compound card structure
- keep feed card frame, border, foreground text, and masonry stability equivalent
- use semantic wrappers only for product-specific structures such as `FeedModuleCard`
- delete `src/components/ui/card.tsx`
- completed with HeroUI React `Card` in the client Overview Feed and `cardVariants` server-safe rendering for server components

Verification:

- feed and article/home render tests
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `curl` for `/`, `/?type=writing`, and one article detail
- browser verification for homepage masonry and article detail rich-content blocks

## Slice 5: Empty

Status: done locally

Files:

- empty state call sites
- `src/components/ui/empty.tsx`
- affected tests
- docs ledger

Work:

- replace local Empty composition with HeroUI or product-specific empty-state components
- delete `src/components/ui/empty.tsx`
- completed by rendering empty states with HeroUI card surface classes rather than keeping an Empty primitive wrapper

Verification:

- targeted render tests for empty states
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## Slice 6: Label and Field

Status: deleted during final cleanup because there were no active call sites

Files:

- form/filter labeling call sites
- `src/components/ui/label.tsx`
- `src/components/ui/field.tsx`
- affected tests
- docs ledger

Work:

- no active app call sites remained after earlier page cleanup
- deleted `src/components/ui/label.tsx` and `src/components/ui/field.tsx`
- removed their old `class-variance-authority` dependency with the final shadcn/Base UI cleanup

Verification:

- targeted interaction/accessibility tests where present
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- browser verification for visible controls

## Slice 7: Tabs

Status: done locally

Files:

- Overview Feed filter controls
- `src/components/ui/tabs.tsx`
- feed tests
- docs ledger and verification baseline

Work:

- replace local Base UI tabs and the remaining hand-written tab-like feed filter markup with HeroUI `Tabs`
- preserve anchor-backed fallback navigation for `/?type=...` and `/?source=...`
- preserve hydrated filter state and feed reflow animation
- delete `src/components/ui/tabs.tsx`

Verification:

- feed filter tests
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `curl` for `/`, `/?type=writing`, `/?type=projects`, and `/?source=telegram`
- browser verification for click, keyboard navigation, URL state, hydration, and no console errors

## Slice 8: Select

Status: deleted during final cleanup because there were no active call sites

Files:

- `src/components/ui/select.tsx`
- docs ledger

Work:

- the only active Select call site was the removed Stack page
- deleted the unused local Select primitive during final shadcn/Base UI removal

Verification:

- `rg -n "@/components/ui/select|components/ui/select" src package.json pnpm-lock.yaml`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## Slice 9: Table

Status: done locally

Files:

- Notion rich-content table renderers
- `src/components/ui/table.tsx`
- article/home rich-content tests
- docs ledger and verification baseline

Work:

- replace local table primitive with HeroUI table or a semantic rich-content table component outside `src/components/ui`
- preserve responsive overflow behavior for article detail tables
- delete `src/components/ui/table.tsx`
- completed with a `src/components/rich-content/rich-content-table.tsx` client boundary because HeroUI `Table` is client-only while the rich-content renderers are server modules

Verification:

- rich-content render tests
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `curl` for an article containing table content if available
- browser verification for article detail table overflow and no clipping regression

## Slice 10: Final shadcn/Base UI Removal

Status: done locally

Files:

- `package.json`
- `pnpm-lock.yaml`
- `components.json`
- `src/app/globals.css`
- `eslint.config.mjs`
- docs ledger and roadmap

Work:

- remove `components.json`
- remove `shadcn`, `@base-ui/react`, and `class-variance-authority` if no remaining code uses them
- remove `@import "shadcn/tailwind.css"`
- remove lint exemptions that only existed for `src/components/ui`
- verify `src/components/ui` is gone or empty and not imported
- replace the old shadcn-style token configuration with the provided HeroUI theme variables
- migrate active app token classes from shadcn names such as `text-muted-foreground`, `bg-card`, `border-border`, and `text-primary` to HeroUI names such as `text-muted`, `bg-surface`, `border-separator`, and `text-accent`

Verification:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm exec opennextjs-cloudflare build`
- `rg -n "shadcn|@base-ui|class-variance-authority|@/components/ui|components/ui|text-muted-foreground|bg-card|border-border|outline-ring|text-primary|--card|--muted-foreground|--primary|--secondary|--popover|--ring|--input|--destructive" src package.json pnpm-lock.yaml eslint.config.mjs`
- `find src/components/ui -maxdepth 1 -type f -print 2>/dev/null | sort`
- `test ! -e components.json`
- `curl` checks for `/`, `/?type=writing`, and `/api/health`
- browser verification remains unavailable in this environment because the Browser tool was not exposed and Node REPL has no Playwright package
