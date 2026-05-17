# Blog2 Shadcn Convergence Spec

## Summary

Reduce repeated UI structure in `web/apps/blog2` by converging business-page components onto the existing shadcn/base-nova primitives that already live under `src/components/ui`.

This is not a redesign of the public blog. It is a structural cleanup of the business-page layer.

The target outcome is:

- keep page structure, information hierarchy, and old-blog migration behavior in `src/domains/*`
- stop re-implementing common UI primitives inside business components when an existing shadcn component already covers the use case

## Problem

`blog2` is already a shadcn project:

- `components.json` is present
- `src/components/ui` already contains a broad primitive set
- project dependencies already include the expected shadcn stack

The current duplication is higher in the tree. Several domain components still hand-roll:

- empty states
- filter controls
- clear actions
- separators
- card shells
- table markup
- callout/reference blocks
- lightweight status/meta pills

This creates three problems:

1. UI behavior drifts across pages because similar structures are implemented independently.
2. Maintenance cost increases because business components own primitive styling they should not own.
3. The current old-blog migration work becomes harder to evolve because structural page work and primitive UI work are mixed together.

## Non-Goals

This task does not:

- rewrite `src/components/ui` to match upstream shadcn
- force all pages into a generic component-library look
- change old-blog information architecture, masonry behavior, or reading flow
- broadly refactor rich text renderers into new abstractions
- introduce a new design-system layer beyond the current shadcn primitives

## Design Principle

Use the following ownership rule:

- `src/domains/*` owns page semantics, content order, route-specific structure, and old-blog migration fidelity
- `src/components/ui/*` owns reusable primitive UI structure and interaction

In practice:

- preserve business layout where it expresses real product structure
- replace repeated primitive-like markup with existing shadcn components
- keep custom markup only where the content block is meaningfully domain-specific

## Primitive Mapping

The first-choice mappings are:

- empty state -> `Empty`
- filters/forms -> `Field`, `FieldLabel`, `Select`, `Button`
- clear/reset actions -> `Button`
- separators/dividers -> `Separator`
- card shells -> `Card`
- lightweight metadata or tags -> `Badge`
- informational/callout blocks -> `Alert`
- data tables -> `Table`

These mappings are preferred unless they materially harm the existing page structure.

## Scope

### First Priority: Stack

`src/domains/stack/stack-list.tsx` is the highest-value convergence target.

Changes:

- replace native `<select>` controls with existing `Select`
- replace the clear-filters button with `Button`
- replace the divider with `Separator`
- replace the empty-results block with `Empty`
- converge stack entry shells toward `Card`
- use `Badge` where lightweight chip metadata fits

This page currently carries the most obvious primitive duplication in the business layer.

### Second Priority: Projects And Thoughts

`src/domains/projects/projects-list.tsx`

- replace empty-state markup with `Empty`
- converge entry shells toward `Card`
- preserve project-specific copy and external-link behavior

`src/domains/thoughts/thoughts-feed.tsx`

- replace empty-state markup with `Empty`
- converge bookmark/reference-style blocks toward `Card` or `Alert`
- use `Badge` for small reaction/meta surfaces where appropriate
- preserve the thought body, reply structure, and masonry/feed behavior

### Third Priority: Home And Article Detail Rich Blocks

`src/domains/home/intro.tsx`

- converge callout blocks toward `Alert`
- replace hand-written table markup with `Table`
- replace dividers with `Separator`
- converge bookmark/reference blocks toward `Card`

`src/domains/article/article-detail-view.tsx`

- replace dividers with `Separator`
- converge bookmark/reference blocks toward `Card`

These pages should keep their content-renderer ownership. Only obvious primitive reuse should change.

## Explicit Boundaries

The following remain custom unless a later task changes the design:

- article heading hierarchy
- long-form rich text flow
- thought body rendering
- reply block semantics
- masonry layout ownership
- route-level page intros and archive rhythm where they express page identity

This avoids over-abstracting content rendering in the name of component reuse.

## Testing Strategy

Apply TDD per page slice:

1. update or add narrow tests around the current behavior
2. run the targeted test and observe failure or coverage gap
3. implement the smallest convergence change
4. re-run the narrow test
5. run broader type/build verification as needed

Priority verification:

- targeted Vitest coverage for touched domain components
- `pnpm --dir web --filter blog2 typecheck`
- page-level HTTP or browser verification for affected routes when local runtime allows it

## Expected Outcome

After this convergence work:

- business pages keep their current public-product structure
- common UI structure is more consistently expressed through the existing shadcn primitive set
- business components contain less duplicate primitive styling
- future public-page work can focus on content structure instead of re-solving primitive UI decisions
