# Blog2 UI Redesign Spec

## Summary

Rebuild the public `blog2` UI by copying the core public-page structures from `web/apps/blog` and reimplementing them inside the `blog2` architecture.

This is not a loose visual inspiration task. The target is:

> preserve the old blog's public product structure, page rhythm, and content hierarchy, while keeping the `blog2` data flow, routing, and component boundaries.

The redesign covers the whole public reader-facing surface:

- global shell
- home
- blog archive
- article detail
- thoughts
- projects
- stack
- not-found and error surfaces

The redesign must remain compatible with the current migration work:

- `blog2` stays locale-aware
- Notion-backed content remains the main source of truth
- current route boundaries stay intact
- current test and verification flow stays intact

## Design Context

### Users

Primary visitors are:

- software engineers
- geeks
- technology enthusiasts

They use the site in two modes:

- deep reading for long-form articles
- fast browsing across archive-like surfaces such as thoughts, projects, and stack notes

### Brand Personality

The blog should feel:

- authored
- rational
- pragmatic
- quietly confident

It should not feel:

- ornamental
- startup-like
- portfolio-first
- trend-chasing
- like a component showcase

### Product Direction

For this redesign, `web/apps/blog` is the primary structural reference for the public experience.

That means:

- core public page structure should be copied from the old blog
- information order should follow the old blog unless `blog2` data constraints require adaptation
- shared page relationships should follow the old blog
- visual polish can be updated, but structural invention should be minimized

The result should feel like the old blog rebuilt on the `blog2` stack, not like a new editorial concept layered over the existing `blog2` pages.

## Hard Implementation Constraints

### Structural Constraint

Core public pages must copy the old `web/apps/blog` structure rather than loosely reinterpret it.

This applies to:

- `home`
- `blog`
- `articles/[slug]`
- `thoughts`
- `projects`
- shell-level header and footer framing

`Projects` and `Thoughts` must use the same masonry structure as the old blog.

### Styling Constraint

`globals.css` must stay small and foundational.

Allowed in `globals.css`:

- theme tokens
- font variables
- base element rules
- reset-level styles
- a very small number of truly global utilities

Forbidden in `globals.css`:

- page-specific layout rules
- archive-specific structure rules
- article-detail-specific structure rules
- masonry page rules
- large sets of business-domain classes
- complex selector-based composition for individual routes

If styles belong to one page or one business surface, they must live with that page or component.

If a structure is reused heavily, it must become a reusable component instead of another set of global classes.

### Tailwind Discipline

Implementation should prefer standard Tailwind and component-local composition.

Allowed:

- standard Tailwind layout, spacing, typography, border, and state utilities
- shared tokens defined centrally
- component-local wrapper elements when they express real structure

Forbidden:

- arbitrary-value-heavy recreation of old CSS
- dumping migrated page styling into `globals.css`
- one-off utility strings used only to mimic old layout hacks

### Architecture Constraint

The redesign copies the old public product structure, but it does **not** copy the old implementation architecture.

Do not:

- mirror the old directory layout
- recreate old data-layer coupling
- port large global stylesheets from the old app
- preserve old implementation accidents

Do:

- preserve `blog2` route and domain boundaries
- rebuild old page structures with `blog2` components
- keep data flow and rendering contracts app-native

## Page Structures

### Shared Shell

The shell should copy the old blog's public framing.

Structure:

- header
  - site mark / title
  - public navigation
  - locale control
- main content area
  - single primary reading surface
- footer
  - compact colophon
  - structural links
  - quiet closing copy

The shell should feel like a blog shell, not an application frame.

### Home

Home should copy the old blog homepage structure.

Structure:

- header
- main content body
  - Notion-driven homepage content rendered directly as the main artifact
  - headings, paragraphs, quotes, bookmarks, and media in content order
- footer

Home should not introduce a new hero composition, opening spread, or product-marketing framing.

### Blog Archive

The archive should copy the old blog archive's role and page hierarchy.

Structure:

- header
- page heading block
  - title
  - short archive description
- archive body
  - article grid copied from the old blog
  - featured first entry behavior where the old blog uses it
  - article entries with cover, date, title, icon marker, and summary
- footer

The archive must remain the main browse entry for writing.

For this migration, the old blog's cover-forward grid is the source of truth, even though it is less ledger-like than earlier redesign drafts.

### Article Detail

Article detail should copy the old article page skeleton.

Structure:

- header
- article head
  - title
  - date and light metadata
- article body
  - Notion-rendered content blocks
- article end matter
  - comments or adjacent follow-up surface
  - return paths where appropriate
- footer

The page should enter reading immediately. The body is the dominant artifact.

### Thoughts

Thoughts should copy the old blog thoughts page structure.

Structure:

- header
- page heading block
- masonry stream
  - timestamp-led thought entries
  - media or links only when present
- footer

Thoughts should read like an archive notebook stream, not a social product feed.

### Projects

Projects should copy the old blog projects page structure and share the same masonry language as thoughts.

Structure:

- header
- page heading block
- masonry stream
  - project entries
  - title, description, and supporting metadata in the same visual grammar as the old blog
- footer

Projects and Thoughts must feel like sibling surfaces built from the same structural system.

### Stack

Stack should stay subordinate to writing and adjacent archive surfaces.

Structure:

- header
- page heading block
- grouped stack or list body
- footer

If the old blog has a clear structural reference, copy it. If not, adapt the lightest possible appendix-like structure that still fits the old public shell language.

### Error and Not-Found Surfaces

These surfaces must also sit inside the same publication shell.

Structure:

- header
- short status copy
- one or two clear routes back into the site
- footer

They should not look like default framework fallbacks.

## Component Strategy

The redesign should be implemented as a small set of structural components that own their own styling.

Expected component responsibilities:

- `SiteHeader`
- `SiteFooter`
- `HomeIntro` or equivalent homepage body component
- `ArticleList`
- `ArticleDetailView`
- shared masonry component for thoughts and projects
- stack list/group component

If `Thoughts` and `Projects` need the same masonry structure, that structure should be a reusable component rather than duplicated page CSS.

If shell framing is shared, it should live in shell components rather than route-specific global styles.

## Execution Order

### Slice 1: Shell and Styling Reset

Rebuild:

- shell structure to match old blog
- base tokens and typography
- `globals.css` so it contains only foundational rules
- component-local ownership for page structure styling

### Slice 2: Home and Blog Archive

Copy the old `home` and `blog` structures into `blog2` components and routes.

### Slice 3: Article Detail

Rebuild the old article structure inside the current article domain.

### Slice 4: Thoughts and Projects Masonry

Copy the old masonry-based public surfaces and unify them behind shared structure.

### Slice 5: Stack and Edge Surfaces

Bring stack, not-found, and error surfaces into the same copied public language.

## Definition of Done

The redesign is successful when:

- core public pages in `blog2` visibly match the old blog's structure
- `Projects` and `Thoughts` share the old masonry structure
- `globals.css` contains only foundational rules and tokens
- page and business-surface styling has moved into components or domain-local structure
- the site no longer reads like a redesign experiment; it reads like the old public blog rebuilt on the new stack
- locale behavior and current data flow remain intact
