# Overview Feed Masonry Layout Optimization Design

## Summary

Replace `@chenglou/pretext` canvas-estimated masonry heights in `src/domains/feed/feed-layout-engine.ts` with a two-stage browser-owned layout pipeline:

1. **Zero-dependency heuristic estimator** aligned to the real rendered card geometry (`aspect-[16/10]` single media, `QuotePreview` + `QuoteMediaGrid`, `p-5`/`gap-3`, `16px/26px` body text, `Libre Bodoni` titles, CJK/Latin character widths) for SSR-safe deterministic fallbacks, tests, and first-pass rendering.
2. **Single-pass batched DOM height calibration** in `OverviewFeed` (`useIsomorphicLayoutEffect` before paint while `data-overview-feed-reveal="pending"`), reading exact `getBoundingClientRect().height` values per card at the active column width (where every image already has a deterministic CSS `aspect-ratio`), re-running `assignFeedLayout` with exact pixel heights, and re-checking once after `document.fonts.ready`.
3. **Trailing undated LPT balancing**: dated feed items strictly preserve chronological descending placement into the shortest column, while the trailing contiguous group of undated items (`displayedAt`/`sourcePublishedAt` missing or epoch `<= 0`, such as undated Notion Projects) is placed tallest-first (LPT) into the shortest column to eliminate jagged bottom tails.

## Motivation

Live measurement across all 244 cards on the overview feed showed a `1,107px` bottom height spread between columns (`37,446px` / `38,553px` / `38,114px`) caused by cumulative height estimation drift:

- `FeedLayoutItem` omitted `quote`, underestimating every X quote card by `200–450px`.
- `estimateMediaHeight` used raw `height / width` for single images even though `MediaGrid` always clips single images to `aspect-[16/10]`, overestimating portrait photos by `400px+`.
- Hardcoded font sizes (`15.2px / 23px`), padding (`36px`), and fixed chrome (`116–148px`) diverged from real coss UI / Tailwind styles, and Pretext ran before web fonts loaded with CJK system font fallback drift cached forever.

Because every media slot on the feed locks its vertical height via CSS `aspect-ratio`, reading real rendered card heights in one batched `useLayoutEffect` pass before initial reveal eliminates estimation error completely while removing the `@chenglou/pretext` runtime dependency from client bundles.

## Architecture & Invariants

- `src/domains/feed/feed-layout-engine.ts` stays pure, synchronous, framework-agnostic, and free of external dependencies (`@chenglou/pretext` removed).
- `assignFeedLayout` accepts optional `measuredHeights` (`Record<string, number>`). Measured positive heights override heuristic estimates directly.
- Chronological order of all dated items is preserved; only contiguous undated items at the end of the list are LPT-balanced.
- `OverviewFeed` uses `useIsomorphicLayoutEffect` (no SSR warnings), batches all DOM reads before any state update, quantizes rounded heights with a `> 1px` change threshold, and never hides the feed back to `opacity-0` after initial reveal.
- All `QuoteMediaGrid` and `MediaGrid` slots continue using deterministic CSS `aspect-ratio` so heights do not shift as images decode.
