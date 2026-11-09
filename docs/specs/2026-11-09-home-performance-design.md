# Homepage Visibility and Pagination

## Scope

BOT-135 implements the approved first two performance improvements: visible server-rendered content and a 24-item homepage page. This amendment supersedes the no-pagination and hydration-owned layout sections of the overview spec. Notion/Telegram/X ingestion, cache policy, card meaning and destinations, and production routing are unchanged.

## Behavior

- Normalize `type`, `source`, and positive integer `page` query values. Invalid or repeated page values use page 1.
- Filter the complete chronological feed before slicing. Only the current page is serialized into client props and JSON-LD.
- Keep at most 24 entries in a steady page. Empty page 1 is valid; a valid integer beyond the last page returns 404.
- Previous/next links preserve filters, are ordinary href links in SSR, and receive Next navigation enhancement. Filter links reset page to 1. Refresh and Back/Forward remain URL-owned.
- Unfiltered pages self-canonicalize (`/`, `/?page=2`, etc.). Existing filtered states retain root canonical; paged URLs are not added to the sitemap. ItemList describes only visible-page content, capped at the existing 50-item ceiling.
- Feed cards are visible in the initial HTML without hydration, width measurement, or an opacity gate. CSS columns use a single chronological DOM list and reserve media aspect ratios. Mobile has one column, tablet two, and desktop three.
- Desktop visual reading is down each column then across, rather than the prior shortest-column packing. DOM and keyboard chronology are retained. This visual tradeoff avoids client reparenting at hydration.
- Preserve lightweight entry/exit transitions after navigation and reduced-motion support. Do not ship the text-measurement engine in the feed client path.

## Verification

Cover all-page traversal/order, filtering before slicing, final/empty/invalid pages, href/canonical behavior, bounded route output, and metadata/provider separation. Run full tests, lint, typecheck, production build, HTTP and real-browser navigation/no-JS/mobile/desktop QA. Report any unrun stage and do not infer LCP/TBT/CLS improvements without comparable measurements.

## Preview build repair amendment

After network restrictions were lifted, the exact candidate `aabe11714cbd2956b4bfbfbc35b4561e841e8fb3` reached Cloudflare build `3dc0dd3f-6c8a-49ac-ad35-2ab16fcccbe4`. It failed inside Next 16.2.6's Google font loader at extension extraction (`Cannot read properties of null (reading '1')`). Local Google CSS requests now succeed, so this is not reported as another network-policy denial or as a locally reproduced font API regression.

Keep Libre Bodoni heading weights 400–600 and Courier Prime display/code weights 400/700, existing CSS variables and `display: swap`. Vendor the requested Latin WOFF2 fonts with upstream OFL licenses/provenance and load them through `next/font/local`, removing Google font fetching from future builds. Other scripts, CJK and unsupported glyphs continue to use fallback fonts. Verify rendered typography, generated assets and font loading on the real preview.

A preview version must include OpenNext-generated `.open-next/worker.js` and assets. Saving a shared Cloudflare version-command change was rejected by automatic review because the production-service settings page made its blast radius unclear; the edit was discarded and the original command retained. The safer path builds locally in standalone mode, packages with OpenNext, and runs only `wrangler versions upload` for a preview version, without changing shared build settings or deploying production. This is a preview prerequisite, not a redesign of the content/cache path.
