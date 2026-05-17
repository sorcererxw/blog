# Tailwind Inline Style Convergence Plan

## Slice

Convert low-complexity CSS module usage to inline Tailwind utilities and add ESLint guardrails for future work.

## Steps

- [x] Convert route boundary and profile hero module usage to inline Tailwind.
- [x] Convert projects, stack, article listing, and overview feed component-local classes to inline Tailwind utilities.
- [x] Delete CSS module files that are no longer imported.
- [x] Keep rich text and masonry CSS modules as explicit lint allowlist entries.
- [x] Add ESLint rules that:
  - restrict `.module.css` imports to the allowlist
  - reject conditional/template/binary `className` expressions so complex class decisions go through `cn(...)`
- [x] Run tests, lint, typecheck, build, HTTP checks, and browser verification.
- [x] Record verification and decisions in `docs/task-ledger.md`.
