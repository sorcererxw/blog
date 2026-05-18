# Tailwind Inline Style Convergence Design

## Summary

Prefer inline Tailwind utilities in Astro and React component markup instead of component-local CSS modules for ordinary layout, typography, spacing, borders, and state styling.

Keep CSS modules only when the styling depends on selectors that are materially clearer or safer in CSS than inline utilities.

## Goal

- reduce low-value CSS module indirection in public page components
- keep complex class composition behind `cn`, which wraps `twMerge`
- add lint guardrails so new code does not reintroduce broad CSS module usage or template-based conditional class strings

## Rules

- Ordinary one-element styling belongs inline as Tailwind classes.
- Conditional or compositional `className` expressions must use `cn(...)` from `src/lib/utils.ts`.
- Tailwind typography, spacing, radius, and ring utilities must use named tokens for font size, letter spacing, line height, padding, margin, gap, border radius, and ring width; arbitrary utilities in those categories are not allowed.
- `src/components/ui/` is exempt because it is the shadcn/base UI layer and should preserve upstream primitive defaults unless a separate component-layer decision is made.
- CSS modules are allowed for:
  - rendered rich text container selectors
  - third-party generated markup selectors
  - animation keyframes and transition-state selectors
  - theme/global base rules
- CSS modules are not allowed for simple card shells, grids, local page spacing, labels, icon wrappers, or hover states when equivalent Tailwind utilities are readable.

## Current Allowed CSS Modules

- `src/domains/article/article-detail-view.module.css`: rich text block selectors, Shiki dark-theme selectors, Notion block color classes
- `src/domains/home/intro.module.css`: Notion-rendered rich text container selectors
- `src/domains/feed/masonry-feed.module.css`: responsive masonry layout switching plus transition keyframes

## Non-Goals

- no visual redesign
- no token palette change
- no removal of global theme variables
- no migration of Shiki or Notion rich text selectors into brittle inline utilities
- no broad ban on arbitrary Tailwind utilities outside font size, letter spacing, line height, padding, margin, gap, border radius, and ring width

## Verification

- targeted component tests for touched render surfaces
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- HTTP and browser verification for `/`
