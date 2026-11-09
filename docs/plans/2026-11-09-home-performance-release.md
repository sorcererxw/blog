# BOT-135 Draft PR and Cloudflare Preview Acceptance

## Publication state

- Repository `sorcererxw/blog`, base `main` at `c2bc171cdf1a21f5621de1decf1b543b275b603d`; branch `codex/bot-135-home-performance-verify`.
- Draft PR https://github.com/sorcererxw/blog/pull/57 is published after the user confirmed the restriction was lifted. Original performance implementation: `735f0a8b1ee386da8e8a14769a19a21a7db11647`; preview repairs: local fonts at `a85d3aa6deaf874b5c433c618ff8db71b2c92d84` and image-zone URLs at `907004c1f0458eb658c16eb7ae836e770b4146ba`.
- Full functional QA was performed on source `907004c1f0458eb658c16eb7ae836e770b4146ba`, version `198ff516-2501-40fa-ad67-02ac34fd3a26`, https://198ff516-blog.xw.workers.dev/. Stable manual alias: https://bot135-home-performance-blog.xw.workers.dev/. The 38-request matrix, desktop/tablet/mobile, no-JS native Next, history/repeated filters, images/fonts and console checks passed. See the current evidence in `docs/verification.md` and the ledger for commands, intermediate failures and limits.
- The automated Cloudflare source build passed Next but failed direct version upload because it did not build `.open-next/assets`. The first shared-setting save was rejected and discarded; after materially new exact-build and official scope evidence, a single save retry was accepted. Only the non-production version command changed to `pnpm run upload`; the production branch/build/deploy command remain intact. The final documentation-only push must confirm the corrected automatic pipeline.
- Record the final full branch HEAD, its automatic build and actual version URL in PR #57. For a documentation-only successor, prove `git diff <tested-source> HEAD -- src image-loader.ts next.config.ts open-next.config.ts wrangler.jsonc package.json pnpm-lock.yaml` is empty, reuse the functional source evidence explicitly, and smoke the successor's own preview.
- Earlier SSH/Fonts/registry/telemetry policy denials are historical. No automatic retry or alternate route was used before new authorization/evidence. No merge or production deployment was performed. Production deployment/version IDs remained unchanged in recorded checks.
- Comparable laboratory LCP/TBT/CLS remains unrun. Functional QA is not a claim of measured performance improvement.

## Independent application review

What this change does: It renders a visible chronological feed in server HTML and sends at most 24 matching items to the client per page. Real links make pagination and filtering work before JavaScript loads.

No application defect requiring a fix was found in the diff against the base above. The review followed the route into feed normalization, filtering, serialization, SEO helpers, client card rendering, media sizing and provider-cache wrappers. The expected workload is a public personal site with a complete provider-backed feed assembled on the server and a bounded client page.

- SSR visibility: initial rendered items have the active transition state, CSS columns need no width measurement, and there is no opacity or hydration gate. Media wrappers retain aspect ratios.
- Pagination: positive safe integers are accepted; invalid/repeated page values normalize to page 1. Filtering precedes slicing; page 1 can be empty; valid integers beyond the last page call `notFound()`. Previous/next URLs preserve filters; filter URLs omit page.
- SEO: unfiltered numbered pages self-canonicalize; filtered states retain the root canonical. Page-body JSON-LD is derived from the same sliced items; entries without destinations are omitted. Metadata still reads only the home source. Sitemap generation is unchanged.
- Client navigation: Next links own URL navigation, refresh and history. The active filter derives from route props. Before a new transition, effect cleanup cancels the previous timeout; unmount cleanup prevents its later state update. Transitions may briefly contain the previous and next pages together, then settle after 220 ms.
- Serialization: only the slice reaches `serializeOverviewFeedItems()`. The 24-item bound is not a fixed byte bound: rich text, galleries and quoted posts can be large. Earlier fixture bytes cannot establish live savings. The feed client imports the small module-size helper instead of the Pretext layout engine; other historical layout code remains outside this client import path.
- Cache/load: provider wrappers, keys, 600-second TTL, X KV reads and parallel source fan-in are unchanged. Pagination still assembles and sorts the complete server feed, so it does not solve cold provider latency or guarantee smaller provider fetches.

The approved visual tradeoff remains: desktop reads down each CSS column, then across, instead of shortest-column packing. Live font/image reflow and real performance remain preview acceptance work. This independent-review paragraph describes the original offline checkpoint. Later real HTTP/browser checks and preview build/media repairs are recorded in the publication state above and `docs/verification.md`.

Targeted follow-up command:

```sh
node_modules/.bin/vitest run src/domains/feed/feed-pagination.test.ts src/app/page.test.ts src/components/feed/overview-feed-view.test.tsx src/integrations/kv/provider-cache.test.ts src/integrations/kv/provider-wrappers.test.ts --maxWorkers=2 --minWorkers=1 --reporter=dot --no-cache
```

Result: PASS, 5 files / 31 tests, exit 0. The first run without `--no-cache` passed all assertions but exited 1 on an `EPERM` write to `node_modules/.vite/vitest/results.json`; disabling the optional results cache avoided that write. No denied network operation was retried. The earlier full 38-file / 142-test result is inherited evidence, not a new full run.

## Original ready-to-use draft PR (published; current result belongs in PR #57)

Title:

> perf: show homepage feed in SSR and paginate 24 matching items

Body (copy the following section verbatim when creating the draft):

---

## Problem and change

The homepage previously serialized the complete feed and hid its enhanced layout until client width measurement and hydration finished. The server now filters the complete timeline before taking a 24-item page, and CSS columns make those cards visible in the initial HTML.

Previous/Next are real links that preserve filters. Choosing a filter resets to page 1; refresh and browser history stay URL-driven. Unfiltered numbered pages self-canonicalize, filtered states retain the root canonical, and ItemList JSON-LD describes only the visible page. The feed client no longer imports the Pretext layout engine.

Desktop packing changes to reading down each column, then across. Provider cache policy and full-feed server assembly remain unchanged; cold provider latency is still a separate concern.

## Validation and remaining work

- Existing local validation: 38 test files / 142 tests, TypeScript, ESLint, diff checks and an earlier production build passed.
- Independent follow-up: 5 targeted test files / 31 tests passed using installed Vitest with `--no-cache`; application source is unchanged.
- Earlier local-only 90-item KV fixture: HTTP pagination/filter/canonical/JSON-LD checks and desktop/mobile, native no-JavaScript navigation, history, repeated filters, empty state and reduced-motion browser checks passed.
- Fresh publication-time production build: did not complete because network policy denied Google Fonts. The earlier successful build is historical evidence for the same application source.
- Real Cloudflare preview build, exact deployed SHA, live-data acceptance and comparable laboratory performance measurements: pending. No live LCP, TBT, CLS or byte reduction is claimed.

Acceptance procedure and evidence requirements: `docs/plans/2026-11-09-home-performance-release.md`. Keep this PR in draft until actual preview checks are recorded. This request covers a draft PR and preview verification; merge and production deployment are outside its scope.

---

## Original resume-publication procedure (completed; retained for handoff)

These are future steps, not commands executed by this follow-up:

1. Confirm materially new evidence permits the denied operation and verify its previous outcome. Recheck the local branch, clean worktree, base, full HEAD and absence of an existing PR. Do not force-push or switch to `main`.
2. Push `codex/bot-135-home-performance-verify` once through the permitted original path. If it is denied again, stop that action and record the target and reason.
3. Create one draft PR against `main` with the title/body above. Save the body to a UTF-8 file and use a structured argument or `--body-file` so newlines remain intact.
4. Read the actual Cloudflare build/deployment result for this branch. Record the PR URL, deployment/version ID, full checkout SHA, successful build log URL, actual preview URL and timestamp. Do not invent a workers.dev URL or treat a production URL as the preview.
5. Verify the preview belongs to this exact full SHA. A matching branch name, stale PR check or HTTP 200 alone is insufficient. Confirm preview bindings/vars supply the expected real content and `PUBLIC_SITE_URL=https://sorcererxw.com`; do not change production data or purge production KV for QA.

## Real-preview acceptance procedure

The HTTP/browser rows have been exercised on the exact source/version recorded above; comparable laboratory performance remains pending. For future reruns, fill an evidence record for each with exact SHA, URL/query, timestamp, observed status/count and artifact path. Collect ordinary GET responses, including final response headers and HTML; inspect card DOM separately from escaped RSC payload and JSON-LD so duplicates in transport do not inflate counts. Record decoded HTML bytes and transferred/compressed bytes separately.

### HTTP, boundaries and SEO

| Request or scenario | Required result |
| --- | --- |
| `/api/health` | 200 with the expected application health response. |
| `/` and `/?page=1` | 200; 24 feed cards if at least 24 matching items exist, otherwise all available items. Root canonical `https://sorcererxw.com/`; no Previous link. |
| Each unfiltered page through the actual last page N | 200; preserve chronological DOM order and no duplicate/missing IDs within a stable provider snapshot. Middle pages have 24 cards; last has 1–24, or zero only for empty page 1. Previous/Next hrefs are real anchors. |
| `/?page=N+1` | Actual HTTP 404, not just a rendered not-found message in a 200 stream. If streaming changes the status, record it as a failed acceptance check. |
| `/?page=0`, `-1`, `1.5`, `abc`, unsafe integer, and repeated `page=2&page=3` | 200 with page-1 data and root canonical, subject to the same source availability. |
| `/?page=2` (when available) | Canonical and Open Graph URL `https://sorcererxw.com/?page=2`; no tracking query in canonical. |
| `/?type=writing`, `/?type=projects`, `/?source=telegram`, `/?source=x` | Only matching items, page size bound, and root canonical. Traverse at least one real multi-page filter and its last/next-out-of-range page. Never infer filtered page count from the unfiltered count. |
| Combined `type=social&source=telegram&page=2` (when available) | Filter first, then slice; Previous/Next preserve both filter keys and set page correctly. |
| Empty state, e.g. a source confirmed absent | Page 1 is 200 with explicit empty-state text; page 2 is 404; no dead pagination links. Do not alter real content to manufacture this case. |
| JSON-LD on first, numbered and filtered pages | Valid JSON containing WebSite, Person, CollectionPage and ItemList; CollectionPage URL follows canonical policy. ItemList has only visible-page destinations, at most 24 entries, correct names and one-based positions. Destination-less cards can make the list shorter; empty itemListElement may be omitted by the existing compactor. |
| `/sitemap.xml` and discovery headers | Sitemap still contains `/` and article details, with no paged/filter query URLs. Preserve existing homepage Link discovery relations. |

Example evidence capture after assigning the **actual** URL; this is not a runnable substitute URL:

```sh
# Set BOT135_PREVIEW_ORIGIN to the confirmed preview origin, with no trailing slash.
: "${BOT135_PREVIEW_ORIGIN:?Set the confirmed exact-commit Cloudflare preview origin}"
curl --max-time 90 --compressed -sS -D /tmp/bot135-preview-root.headers -o /tmp/bot135-preview-root.html -w 'status=%{http_code} bytes=%{size_download} ttfb=%{time_starttransfer} total=%{time_total}\n' "$BOT135_PREVIEW_ORIGIN/"
curl --max-time 90 --compressed -sS -D /tmp/bot135-preview-page2.headers -o /tmp/bot135-preview-page2.html -w 'status=%{http_code} bytes=%{size_download}\n' "$BOT135_PREVIEW_ORIGIN/?page=2"
```

Discover N from actual pagination, then request the last and first out-of-range page explicitly. A one-page live filter cannot prove multi-page filtering; mark it unavailable and retain the local fixture test as supplementary evidence. If source refreshes change the feed mid-traversal, record IDs/timestamps and repeat in a stable window before treating order differences as pagination bugs. Do not delete or rewrite remote KV.

### Real browser behavior

Use the confirmed preview at desktop 1280×900, tablet 768×1024 and mobile 390×844. Capture screenshots, network/errors and console output tied to the full SHA.

- Reload from a fresh browser state: readable cards before hydration, 3/2/1 columns at the listed widths, no horizontal overflow or hydration mismatch, and reserved image areas. Inspect DOM chronology; accept the documented column-major visual order.
- Next, Previous, refresh, direct page URLs, Back and Forward must agree on URL, active filter, page label and card identities. From page 2+, choose each filter and confirm page resets to 1.
- Change filters rapidly, including before a response completes and within the 220 ms transition window. After responses settle and transitions finish, show only the final URL's page, at most 24 cards, without stale later timer updates. Navigate away during a transition and check for errors.
- Disable JavaScript in the real browser and reload. Cards stay visible; native anchor activation must navigate filters and Previous/Next without script. The timestamp anchor remains the card destination. Restore JavaScript afterward.
- Check empty state, external/rich-text/quote links, keyboard focus and reduced motion. Reduced-motion cards must have no entry/exit animation or transition.
- Record app console errors/warnings and failed requests. Separate extension messages from application issues; do not discard hydration or image failures as extension noise.

### Comparable laboratory performance

Do not reuse synthetic fixture timings as live performance evidence or compare a development build with a production preview.

1. Prepare a base-commit build and candidate-commit build in equivalent Cloudflare preview environments, using the same source content snapshot, runtime/bindings, region, image/font delivery and cache conditions. Record both exact SHAs and deployment IDs. If only production versus preview is available, label the result observational and explain the infrastructure/content mismatch.
2. Use the same installed Chrome/Lighthouse version, mobile and desktop viewport/device settings, CPU and network throttling, geography, browser profile/extension state and test URL. Warm provider/application caches consistently, but use a cold browser cache for each navigation run. Record warm/cold state explicitly; cold provider behavior is a separate series and must not be created by deleting production KV.
3. Run at least five alternating base/candidate runs per device profile. Retain every Lighthouse report/trace and capture timestamp, LCP element, LCP, TBT, CLS, TTFB, transferred HTML/JS bytes, decoded HTML bytes and rendered card count. Report medians and range/spread, including failures and outliers with reasons.
4. Inspect traces for hydration/long tasks, font and image loading, and column reflow. Compare against the original PSI conditions only when those conditions and a baseline are actually available; otherwise establish a documented new baseline. Laboratory TBT is not field INP, and preview Lighthouse does not establish real-user Core Web Vitals.
5. Record regressions before changing PR readiness. Claim a performance improvement only from comparable measured results. Until those reports exist, the result is a functional/bounded-rendering change with performance measurements pending.

## Evidence record template

```text
Candidate full SHA:
Base full SHA / deployment:
PR URL:
Cloudflare build log / deployment version:
Confirmed preview URL:
UTC time / browser and Lighthouse versions:
Source snapshot / provider and browser cache conditions:
HTTP matrix results / headers and HTML artifacts:
JSON-LD / canonical / discovery results:
Desktop / tablet / mobile / no-JS screenshots and results:
Navigation / rapid filters / console results:
Performance reports, five-run samples, medians and spread:
Failures / unavailable scenarios / remaining blockers:
Draft readiness decision:
```
