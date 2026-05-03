# Blog2 Thoughts Page Alignment Design

## Summary

Align `blog2`'s `/thoughts` page with the old `blog` thoughts experience while keeping the current direct Telegram read path.

The alignment includes:

- old-blog-style masonry message cards
- whole-card Telegram linking
- reply previews with in-page anchors
- richer Telegram content rendering for rich text, photos, webpage previews, forwarded labels, and reactions

The alignment does not restore the old backend client or protobuf-driven rendering path.

## Why Change

The current `blog2` thoughts implementation is split across two concerns:

- `web/apps/blog2/src/app/thoughts/page.tsx` performs direct Telegram reads and renders a simplified card list
- `web/apps/blog2/src/domains/thoughts/thoughts-feed.tsx` contains a richer but still partial feed rendering layer

That split no longer matches the intended product direction.

The user wants the entire Telegram thoughts surface to be owned by `/thoughts` directly, and wants the rendered experience aligned with the old `blog` page rather than the current simplified `blog2` view.

The current page also under-renders Telegram content:

- rich-text formatting is incomplete compared with the old page semantics
- message-card structure is simplified
- card interaction does not match the old whole-card click behavior

## Scope

### In Scope

- move Telegram thoughts presentation ownership into `web/apps/blog2/src/app/thoughts/page.tsx`
- remove the separate `thoughts-feed` UI abstraction
- align `/thoughts` card semantics with `web/apps/blog/app/[lang]/thoughts/page.tsx`
- improve rich-text rendering to support the Telegram formatting already represented by the normalized data model
- preserve the current direct Telegram read path and empty-state behavior on Telegram failure
- update tests and documentation

### Out of Scope

- restoring old `APIClient` or protobuf dependencies
- changing other public pages
- changing the direct Telegram read architecture back to cron/KV-first correctness
- introducing a reusable Telegram UI system outside `/thoughts`
- adding new storage or background jobs

## Product Behavior

### Successful Request

When `/thoughts` loads successfully:

1. the page reads Telegram messages through the existing direct-read path
2. the page sorts messages newest first
3. the page renders them in a masonry layout
4. each card links to the original Telegram message
5. replies render a preview of the referenced message and can link to the local message anchor
6. rich-text formatting, webpage previews, photos, forwarded labels, and reactions render with old-blog-style semantics

### Failure Behavior

If Telegram reads fail:

- the page keeps the current explicit empty state
- the page does not render demo content
- the page does not depend on cron freshness for correctness

## Architecture

### Route Ownership

`web/apps/blog2/src/app/thoughts/page.tsx`

This file becomes the single presentation boundary for Telegram thoughts.

Responsibilities:

- read thoughts through the current direct Telegram loader
- parse and cache page-level results as it does today
- compute message lookup data needed for reply previews
- render masonry message cards
- host the local helper renderers needed only by `/thoughts`

Local helpers may remain in the same file unless extraction is required purely for testability, but they should stay page-local rather than re-forming a separate `domains/thoughts` UI layer.

### Removed UI Abstraction

`web/apps/blog2/src/domains/thoughts/thoughts-feed.tsx`

This component should be deleted.

Reasoning:

- it duplicates page-level rendering ownership
- it creates drift between the route and the actual Telegram page semantics
- the user explicitly wants the Telegram surface collapsed into `/thoughts`

### Integration Boundary

`web/apps/blog2/src/integrations/telegram/*`

The Telegram integration layer remains responsible for fetching and normalizing data, not for page composition.

If the normalized message shape is missing any formatting details required by the old page semantics, the integration layer may be updated to expose those values cleanly to the route.

## Rendering Contract

The new `/thoughts` page should align to the old `blog` page in the following ways:

### Card Semantics

- each message card is externally linked to Telegram
- the card keeps a stable local DOM id so reply previews can target it
- the rendered order and visual grouping should stay compatible with masonry height estimation

### Reply Previews

- replies should resolve against the current page's message list
- when the referenced message is present, the preview should show message text summary
- the preview should link to the local anchor for the referenced message
- when the referenced message is absent, the page may render a fallback textual reference

### Rich Text

The route-local rich-text renderer should support the Telegram formatting represented by normalized segments, including:

- plain text
- hyperlinks
- hashtags
- bold
- italic
- underline
- monospace
- strike
- quote

The renderer must avoid invalid block/inline nesting and should preserve readable whitespace behavior.

### Media And Metadata

- photos render inline inside the card
- webpage previews render as a compact reference block
- forwarded messages render a forwarded label
- reactions render in a compact footer row
- the timestamp remains visible as secondary metadata

## Data Model Expectations

The page should continue consuming `blog2`'s native normalized Telegram data, not old backend message types.

If needed, the normalized types may be extended so the page can render:

- full rich-text flags per segment
- reply targets
- forwarded source text
- webpage preview data
- photo variants
- reactions

## Testing Strategy

Use TDD for the rendering change.

Required evidence:

- page-level tests proving the current simplified `/thoughts` output no longer matches expectations
- tests for whole-card link semantics
- tests for reply preview and local anchor behavior
- tests for rich-text formatting combinations
- tests for webpage preview, forwarded labels, photos, and reactions
- removal or replacement of the old `thoughts-feed` tests
- HTTP verification for `/thoughts`
- browser verification if the browser tooling blocker is not present

## Risks

### Nested Interaction Risk

Whole-card external linking plus local reply anchor behavior can produce invalid nested interactive markup if implemented carelessly.

The implementation should prefer structurally valid markup rather than recreating the earlier overlay-click workaround.

### Rich-Text Drift Risk

If normalized Telegram segments do not preserve enough formatting detail, the page may still fail to match old-blog semantics even after route-level refactoring.

That should be solved by extending normalized data, not by reintroducing legacy transport types.
