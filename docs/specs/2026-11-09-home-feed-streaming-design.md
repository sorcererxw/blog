# Homepage Continuous Feed Loading

## Decision and scope

The user rejected numbered pages on November 9: the feed must load continuously. This supersedes the pagination UI, page query contract and numbered-page SEO rules in `2026-11-09-home-performance-design.md`. Keep its visible SSR, small initial response, local font and image-zone repairs. Update the existing draft PR #57 and its Cloudflare preview; do not merge or deploy production.

## Behavior and data flow

- Render the first 24 matching entries visibly on the server. Continue with 24-item batches as the user approaches the bottom; append to the existing chronological DOM list. Do not display page numbers or Previous/Next controls, and do not add page history entries while scrolling.
- Share provider assembly between the homepage and a thin `GET /api/feed` route. Preserve provider-cache keys, TTL, X KV reads and full-source server assembly; this change bounds serialization rather than source fetches.
- Filter before taking any batch. Use the last delivered item ID as the `after` cursor, not an offset, so new entries inserted above it do not duplicate earlier content. The API returns only serialized batch items and `nextCursor`. A known final cursor yields an empty terminal batch; unknown/repeated cursors return 400 in the API (404 for the native HTML continuation). Cursor removal during source refresh has a visible reload recovery.
- Balance CSS columns independently within each appended batch, so loading another batch does not repack or move earlier cards. These are invisible layout groups, with one chronological DOM timeline and no numbered navigation.
- Observe the Load more anchor with IntersectionObserver. Keep that real anchor as a keyboard/manual/error retry control and a no-JavaScript continuation URL (`/?after=...` plus current filters). With JS it fetches/appends JSON; without JS it navigates to the next SSR batch. No browser-specific API is required to see the initial cards.
- Allow only one in-flight append per feed. Abort on filter changes/unmount, ignore late old responses, disconnect observers and clear transition timers. Deduplicate appended IDs. A load failure preserves existing cards, shows a retry/reload action and suspends automatic retry loops.
- Filter links reset the stream to that filter's first batch. Refresh and Back/Forward restore the URL-owned filter/initial batch; a refresh does not promise preservation of scroll-loaded batches. Existing ordinary card/rich-text/timestamp links, reduced motion and visible SSR remain intact.
- Root, filter and continuation browse URLs canonicalize to `/`; ignore the withdrawn `page` parameter. JSON-LD describes the current SSR batch only. Keep query/continuation URLs out of the sitemap. The JSON endpoint is not an indexable page.

## Verification

- Domain tests: complete cursor traversal/order, filtering before slicing, new items before a cursor, exact-boundary/short/empty final batches, invalid cursors and URL encoding.
- Route/SSR tests: bounded first render and JSON, API cursor validation and completion, root canonical and metadata/provider separation, real Load more/filter links and no pagination controls.
- Client browser checks on the exact Cloudflare commit: initial 24 visible cards, automatic append 24→48→72 without losing earlier entries, manual loading, full traversal/end state, filter reset/history, quick filters during an append, error retry and no stale updates, desktop/mobile/tablet/no-JS, media, reduced motion and console health.
- Run tests/lint/typecheck/build and direct HTTP traversal before claiming the replacement complete. Earlier pagination results are historical and do not validate this interaction. Comparable laboratory performance remains separate, with no unmeasured speed-up claim.
