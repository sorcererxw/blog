<!-- /autoplan restore point: /Users/sorcererxw/repo/sorcererxw/tempura/web/apps/blog2/.omx/autoplan/2026-04-15-blog2-cloudflare-image-delivery-restore.md -->
# Blog2 Cloudflare Image Delivery Plan

## Approval Status

Approved on 2026-04-15 with a scope-expansion override.

Approval scope:

- proceed with Cloudflare-backed public image delivery in `blog2`
- keep `/cdn-cgi/image/...` as the outward delivery path for v1
- expand the plan to include canonical media ingestion for volatile third-party sources instead of shipping a thin loader plus host-level bypass only

Approved with concerns:

- visual contracts and allowlist rules remain mandatory, not optional polish
- runtime semantics must stay explicit: do not blur URL transforms with unrelated Cloudflare image bindings

## Summary

Introduce a Cloudflare-backed image loader in `web/apps/blog2` by adding one app-owned remote-image transformation layer, then migrating the current public image call-sites onto it.

The plan intentionally avoids an Astro-only rewrite.

The current app renders most public media inside shared React views, so the winning move is to add a boring, explicit image-delivery boundary that Astro pages and React components can both use.

User-approved expansion:

The first implementation should also establish a canonical media-ingestion path for volatile remote sources such as Notion-hosted file URLs and Telegram CDN images, so public rendering does not depend entirely on unstable upstream media URLs.

## Success Looks Like

- public image-heavy routes stop shipping raw third-party image URLs by default
- hero, card, content, and thumbnail surfaces use Cloudflare-sized variants
- fixed-size icon surfaces stop downloading oversized remote assets
- existing layout and route behavior stay intact
- the new image layer is explicit enough to extend without guessing

## Measured Success Gates

This slice should not ship on taste alone.

Approval targets:

- reduce transferred image bytes on the highest-value public surfaces by at least `50%` versus the raw-URL baseline
- improve image-request offload rate so the browser stops hitting third-party image origins directly for the primary migrated surfaces
- hold or improve public route render quality on `/`, `/blog`, and one real `/articles/<slug>` page with no new obvious CLS or crop regressions

Secondary evidence:

- lower LCP on image-heavy routes where the route's primary visual asset is part of the first viewport
- fewer oversized-image requests on repeated list surfaces such as article cards and icon lists

## Premises

1. `blog2` already gets enough value from Cloudflare hosting that image delivery should also terminate there instead of bouncing users straight to third-party image hosts.
2. The app's current mixed Astro + React composition should be preserved; image delivery should fit that shape instead of forcing a framework rewrite.
3. Using Cloudflare transformation URLs is a better first slice than building a new image proxy route or rewriting everything to `astro:assets`.
4. Existing source metadata is good enough to land a first slice, even though not every surface has perfect dimensions yet.
5. The required remote source origins can be made explicit and maintained as part of the feature.
6. We can win first on the highest-traffic visual surfaces before expanding to every low-value icon and long-tail media case.
7. For volatile signed or short-lived sources, app-owned canonical media storage is worth the extra first-slice complexity.

## What Already Exists

| Sub-problem | Existing code to keep | Notes |
| --- | --- | --- |
| Astro + Cloudflare deploy baseline | `astro.config.mjs`, `wrangler.jsonc` | worker already deploys on Cloudflare; config currently includes an `images` binding, but the chosen mechanism for this slice still needs to be made explicit |
| Article list rendering | `src/domains/article/article-list.tsx` | cover and icon call-sites exist, easy first migration surface |
| Article detail rendering | `src/domains/article/article-detail-view.tsx` | hero, inline media, bookmark thumbnails, icon call-sites already grouped here |
| Thoughts media rendering | `src/domains/thoughts/thoughts-page.tsx` | photo cards already carry width/height in most cases |
| Home content rendering | `src/domains/home/intro.tsx` | contains the current image dimension inference fallback |
| Stack icon rendering | `src/domains/stack/stack-list.tsx` | fixed-size icon case, useful for preset validation |
| Remote data sources | `src/integrations/notion/**`, `src/integrations/telegram/**` | already normalize media URLs into app-owned models |

## Current-State Constraints

- current image rendering is mostly plain `<img>` or CSS `background-image`
- Astro adapter image-service settings alone will not fix existing React call-sites
- article covers and bookmark thumbnails do not currently carry first-class width/height metadata
- some remote sources are volatile or third-party controlled, especially Notion file URLs and Telegram CDN assets
- the site still needs to render when a source image URL is missing, malformed, or intentionally bypassed
- the current config surface can be read as if Cloudflare Images bindings and `/cdn-cgi/image` URL transforms are interchangeable, which they are not

## Dream State

```text
CURRENT
raw third-party image URLs in rendered markup
  -> browser downloads whatever the source gives it
  -> no central preset model
  -> no consistent responsive strategy

THIS PLAN
app-owned Cloudflare image loader
  -> shared URL builder + presets
  -> React-friendly remote image component
  -> explicit migration of existing public surfaces

12-MONTH IDEAL
one boring media layer for the public blog
  -> stable metadata where available
  -> explicit responsive presets by surface
  -> no accidental raw remote-image regressions
```

## Implementation Alternatives

| Approach | Effort | Risk | Pros | Cons | Decision |
| --- | --- | --- | --- | --- | --- |
| Rewrite current image surfaces to Astro `<Image />` | medium-high | medium-high | built-in responsive generation | pushes framework churn into React-heavy domains and still leaves background-image cases awkward | reject |
| Add a custom Worker image proxy route | medium | high | total server-side control | new route surface, more cache and failure complexity, duplicates Cloudflare's native URL transform path | reject |
| Add an app-owned Cloudflare transformation helper plus React image wrapper | medium | medium | fits current architecture, covers both `<img>` and CSS background use cases, incremental rollout | must define presets and bypass rules ourselves | choose |

## Runtime Mechanism Decision

This plan chooses one delivery mechanism for the first slice:

- use Cloudflare URL transforms via `/cdn-cgi/image/...`
- do not treat the existing `images` binding in `wrangler.jsonc` as the runtime path for this feature

Slice 4 must leave the repo in one of these states:

1. the unused binding is removed because the app does not need it, or
2. the binding remains, but the plan and config explicitly say it is reserved for a different future feature and not part of the public-image loader

No ambiguous middle state.

## Canonical Media Decision

The user explicitly approved the broader option:

- keep Cloudflare URL transforms as the public delivery path
- add canonical media ingestion for volatile upstream sources instead of relying only on raw-source passthrough plus bypass

This means the implementation should introduce an app-owned media contract for the unstable source families already present in `blog2`, especially:

- Notion-hosted file/image URLs that can churn
- Telegram CDN image URLs that may not be durable enough for long-lived transformed delivery

The first slice does **not** need to become a full generic DAM.

It does need:

- a stable media record or manifest shape owned by `blog2`
- a refreshable way to map source media to canonical app-owned media targets
- clear separation between canonicalized volatile sources and pass-through stable sources

## Surface Contract Matrix

| Surface | Priority | Aspect-ratio rule | Max rendered width | Crop / fit rule | Loading | Fallback |
| --- | --- | --- | --- | --- | --- | --- |
| Article hero cover | highest | reserve `16:9` by default when dimensions are unknown | full article hero width | `cover`, centered | eager / high-priority | reserved panel with current text fallback |
| Article card cover | high | reserve `4:3` card media box | card width | `cover`, centered | lazy | fixed placeholder block, card text remains readable |
| Article inline image | high | preserve source ratio when known, otherwise reserve a safe landscape box | content column width | `contain` by default, never silent crop | lazy | visible missing-media block with caption preserved |
| Bookmark thumbnail | medium-high | reserve `16:9` thumb frame | bookmark media width | `cover`, top-center | lazy | bookmark card without image, text stack preserved |
| Thought photo | medium-high | preserve source ratio when known, otherwise reserve a tall-card fallback ratio | masonry card width | `cover` only when source dimensions exist, otherwise `contain` | lazy | reserved media shell so the card does not jump |
| Fixed-size icon | medium | strict `1:1` box | `32-40px` depending on surface | `contain` first, `cover` only for photo-like icons | lazy | emoji or neutral tile fallback |

## Source Trust and Allowlist

This feature must not turn the public app into a zone-backed fetch gadget for arbitrary URLs.

The implementation should ship with a hard allowlist for currently known remote image hosts, including the source families already present in `blog2` data:

- `images.unsplash.com`
- `cdn*.telesco.pe`
- the currently used Notion-hosted image/file origins

Rules:

- unknown hosts are denied by default
- local/private/IP-literal targets are denied by default
- host expansion is a docs + code change, not a runtime accident

Volatile signed-source reality:

- Notion-hosted file URLs may still churn even when they are allowed
- Telegram CDN image URLs may be operationally stable for a while, but they are not app-owned media
- because the user approved canonical ingestion, these volatile-source families should move behind app-owned canonical media targets rather than staying as permanent passthrough risk
- stable-source families can still remain passthrough in v1 if they clear the allowlist and do not justify ingestion cost

## Operational Ownership

Before implementation is considered done, the plan must yield a small runbook covering:

- who updates the allowlist when a new image source appears
- how to detect and disable a broken host quickly
- what browser/network evidence proves the transformed path is active
- what rollback trigger sends a surface back to raw URLs
- whether the final config keeps or removes the existing `images` binding

## Slice Plan

### Slice 0: Source Inventory and Contract Lock

**Goal**

Make the current image sources, surface types, and bypass rules explicit before code churn starts.

**Files**

- `docs/specs/2026-04-15-blog2-cloudflare-image-delivery-design.md`
- `docs/plans/2026-04-15-blog2-cloudflare-image-delivery.md`
- `docs/roadmap.md`
- `docs/task-ledger.md`
- `docs/verification.md`

**Work**

- record every current remote-image surface in docs
- record the current source-origin reality
- lock the chosen loader direction to Cloudflare transformation URLs
- define verification targets for UI, HTTP, and request-level proof

### Slice 1: Shared Loader Boundary

**Goal**

Create one explicit image-delivery module that can build Cloudflare transformation URLs without leaking option strings across the app.

**Files**

- `src/lib/images/cloudflare.ts`
- `src/lib/images/presets.ts`
- tests near the helper, for example `src/lib/images/cloudflare.test.ts`

**Work**

- add a URL builder that produces `/cdn-cgi/image/<options>/<source>` URLs
- encode a small preset vocabulary for the current public surfaces
- add bypass logic for local assets, emoji, malformed URLs, and formats we intentionally leave untouched
- keep the helper framework-neutral

**Exit**

- the loader behavior is testable without rendering a whole page

### Slice 1.5: Canonical Media Contract

**Goal**

Add the minimum app-owned media model needed so volatile remote image sources stop being the long-term public rendering contract.

**Files**

- `src/domains/media/**`
- `src/integrations/kv/**` or another app-owned storage boundary already used by `blog2`
- any required typings under `src/types/**`
- targeted tests for canonical media normalization and lookup

**Work**

- define a canonical media record shape owned by `blog2`
- decide what the canonical target actually is for v1, for example app-owned mirrored URLs or app-addressable stored objects
- map Notion and Telegram volatile image sources into that record shape
- make the public image loader consume canonical records where required instead of raw volatile upstream URLs

**Exit**

- volatile-source rendering no longer depends on raw upstream URLs being the long-lived public contract

### Slice 2: React-Friendly Render Primitive

**Goal**

Add a small render helper for responsive remote images so existing React views can adopt the loader without reimplementing `srcset`, `sizes`, loading mode, and width/height behavior at each call-site.

**Files**

- `src/components/media/responsive-remote-image.tsx`
- tests near the component, for example `src/components/media/responsive-remote-image.test.tsx`

**Work**

- expose a minimal component API shaped around the current surfaces
- support priority hero loads and lazy-loaded secondary media
- preserve width/height props when known
- support fixed-size icon and thumbnail cases cleanly

**Exit**

- article and thought components can consume one media primitive instead of hand-rolling image markup

### Slice 3: Migrate High-Value Public Surfaces

**Goal**

Move the current public image surfaces onto the shared loader in traffic order, not in alphabetical component order.

**Files**

- `src/domains/article/article-list.tsx`
- `src/domains/article/article-detail-view.tsx`
- `src/domains/home/intro.tsx`
- `src/domains/thoughts/thoughts-page.tsx`
- `src/domains/stack/stack-list.tsx`
- any touched CSS module files

**Work**

- migrate homepage and article-listing media first if those routes produce the clearest byte and visual wins
- migrate article hero next
- migrate article inline images and bookmark thumbnails after the layout contracts are in place
- migrate Telegram thought photos after canonical media ingestion is proven for that source family
- migrate fixed-size remote icon cases last, once DPR-aware sizing is defined
- keep local same-origin assets, such as the shell logo, untransformed unless a specific case proves otherwise

**Exit**

- the current public routes no longer default to raw third-party image URLs on these surfaces

### Slice 4: Bindings, Docs, and Verification Sweep

**Goal**

Prove the feature end to end and document the operational assumptions.

**Files**

- `astro.config.mjs`
- `wrangler.jsonc`
- `src/types/cloudflare.ts`
- `env.d.ts` if typing changes are needed
- `docs/roadmap.md`
- `docs/task-ledger.md`
- `docs/verification.md`

**Work**

- make the Cloudflare image strategy explicit in config where that improves clarity
- document the currently required remote source origins for transformation
- verify transformed requests in browser/network inspection
- record the final verification commands and outcomes in the ledger

**Exit**

- runtime/config assumptions are explicit
- the docs tell the next agent how this image layer is supposed to work

## Architecture

```text
Astro pages / React views
        |
        v
ResponsiveRemoteImage / fixed-size URL consumers
        |
        v
Cloudflare image preset + URL builder
        |
        v
/cdn-cgi/image/<options>/<source>
        |
        v
Cloudflare zone image transformation
        |
        v
remote source image (Notion / Telegram / Unsplash / etc.)
```

## Test Diagram

| Surface | Codepath | Coverage needed |
| --- | --- | --- |
| URL builder | `src/lib/images/cloudflare.ts` | option formatting, bypass cases, stable output tests |
| Responsive image component | `src/components/media/responsive-remote-image.tsx` | render tests for hero, lazy, width/height, and `srcset` output |
| Article list covers | `src/domains/article/article-list.tsx` | existing view test should assert transformed URLs instead of raw ones |
| Article detail media | `src/domains/article/article-detail-view.tsx` | render tests for hero, inline image blocks, bookmark thumbnails |
| Home intro images | `src/domains/home/intro.tsx` | render tests for Notion image block output |
| Thoughts photos | `src/domains/thoughts/thoughts-page.tsx` | render tests for transformed Telegram photo URLs with preserved dimensions |
| Preview/runtime proof | changed routes under Astro preview | browser + HTTP checks that transformed URLs are emitted and pages still render |

## Failure Modes Registry

| Failure mode | Severity | Why it matters | Mitigation |
| --- | --- | --- | --- |
| Loader only works for Astro-owned templates, not current React views | high | feature lands as config theater, not user-visible improvement | keep the core helper React-friendly and migrate current TSX call-sites directly |
| Fixed-size icons still download oversized originals | medium | waste persists on frequently repeated list surfaces | add an explicit `icon` preset and migrate background-image call-sites |
| Missing width/height causes layout instability on remote images | high | visual regressions on article and thoughts pages | preserve existing dimensions where known, add explicit dimensions or safe fallbacks where not |
| Remote origin not allowed by Cloudflare transforms | high | broken public images in production | document allowed origins and validate them before rollout |
| Volatile Notion or Telegram source URLs destroy cache reuse or break transformed delivery | high | public media becomes flaky even though the page HTML still renders | canonicalize volatile source families behind app-owned media records before broad rollout |
| SVG or unsupported formats regress when forced through the loader | medium | icons or embeds break unexpectedly | add bypass rules and cover them in tests |
| Unknown host slips into the loader path | high | could create SSRF-style abuse or unpredictable origin fetches through the zone | hard allowlist with explicit reject tests |
| Binding-vs-URL ambiguity survives to rollout | high | debugging and ops become guesswork because the runtime path is unclear | choose `/cdn-cgi/image` explicitly and remove or clearly quarantine the unused binding |

## Error and Rescue Registry

| Problem | Rescue path |
| --- | --- |
| A surface cannot adopt the shared React image primitive cleanly | use the shared URL builder directly at that call-site, do not fork the option presets |
| Cloudflare transform fails for a remote origin | temporarily bypass that origin in code, document it, and fix the origin policy before re-enabling |
| A dimensionless image regresses layout | pin an explicit width/height for that surface now, defer metadata refinement to the later image-metadata work |
| A source format should stay untouched | add a bypass rule instead of forcing every format through the same path |
| Canonical ingestion for one volatile source family slips | narrow rollout to the stable-source surfaces first, but keep the volatile-source family behind the new media contract work before declaring the full feature done |

## Not In Scope

- changing the public information architecture
- adding uploaded-image storage workflows
- solving every image-metadata gap in the product
- redesigning article, thoughts, or home layouts while touching their media

## Verification Plan

Implementation verification must include:

1. targeted Vitest coverage for the new loader boundary and touched view components
2. `pnpm --dir web --filter blog2 typecheck`
3. `pnpm --dir web --filter blog2 build`
4. `pnpm --dir web --filter blog2 exec astro preview --host 127.0.0.1 --port <port>`
5. `curl -L` or `curl -I` checks for `/`, `/blog`, a real `/articles/<slug>`, and `/thoughts`
6. browser verification that the changed pages render and emit Cloudflare-transformed image URLs
7. at least one production-like check for an allowed host and one denied-host or bypass-host case

## Rollback Plan

If the image layer proves too brittle:

1. keep the shared loader module
2. revert the migrated view call-sites back to raw URLs
3. keep the docs inventory and failure-mode analysis
4. reland surface-by-surface instead of forcing a full-image migration

This rollback is cheap because the plan adds a thin boundary, not a new storage system or route surface.

## CEO Review

Review source: `codex` only. A second Claude subagent review was not run in this session because delegation was not available under the current execution policy.

User override applied after review:

- the remaining taste decision was resolved in favor of canonical media ingestion instead of thin v1 + bypass

Key findings from the strategy pass:

- the original draft optimized for elegance more than measurable product leverage
- the plan needed explicit success gates tied to transferred bytes, route quality, and offloaded image requests
- the migration order needed to follow high-value public surfaces first instead of treating all image call-sites as equally important
- operational ownership for origin policy and rollback needed to be named as a first-class deliverable

Changes applied from this review:

- added measured success gates
- added traffic-prioritized rollout ordering
- added operational ownership/runbook requirements

## Design Review

Review source: `codex` only.

What was examined:

- surface definitions in the plan
- the current image call-sites in article, home, thoughts, and stack views
- the absence of explicit responsive and fallback contracts in the original draft

Key findings:

- the plan needed a surface-by-surface visual contract instead of generic "hero/card/inline" naming
- fallback states for missing, bypassed, or failed media were under-specified
- responsive behavior and crop rules needed to be explicit enough to prevent silent regressions

Changes applied from this review:

- added the Surface Contract Matrix
- added fallback behavior per surface
- clarified crop / fit expectations and reserved aspect-ratio behavior

## Engineering Review

Review source: `codex` only.

What was examined:

- the runtime mechanism choice in the plan
- the real image call-sites in the current codebase
- `wrangler.jsonc` and the current Cloudflare config surface

Key findings:

- the plan needed to choose one runtime mechanism instead of blurring the existing `images` binding with `/cdn-cgi/image` URL transforms
- the helper needed an explicit host allowlist and deny-by-default stance
- volatile upstream image URLs are a real risk, but full canonical media ingestion is too large for the first slice

Changes applied from this review:

- added the Runtime Mechanism Decision
- added Source Trust and Allowlist rules
- recorded volatile signed-source behavior as an explicit v1 risk with a bypass rescue path

## Cross-Phase Themes

- **Explicit contracts beat inferred behavior.** This showed up in CEO, design, and engineering review.
- **Do the high-value surfaces first.** This showed up in strategy and design review.
- **Do not leave runtime semantics ambiguous.** This showed up in strategy and engineering review.

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | CEO | Add measurable success gates before implementation | mechanical | P1 Choose completeness | A public-performance slice without outcome targets is too easy to declare done on taste alone | "ship without metrics" |
| 2 | CEO | Prioritize rollout by highest-value public surfaces | mechanical | P3 Pragmatic | The same code effort buys more user impact on home, archive, and article hero than on long-tail icons | "migrate every surface in one pass" |
| 3 | CEO | Keep the scope inside an app-owned loader boundary, not a new image proxy route | mechanical | P5 Explicit over clever | The current architecture already supports URL rewriting in views without creating a new server surface | "custom Worker proxy" |
| 4 | Design | Add a surface contract matrix with ratios, crop rules, loading mode, and fallbacks | mechanical | P1 Choose completeness | The original draft did not specify enough visual behavior to avoid regressions | "generic preset names only" |
| 5 | Design | Require reserved boxes or explicit ratios for dimensionless surfaces | mechanical | P1 Choose completeness | "safe fallback" was too vague to prevent CLS | "infer later during implementation" |
| 6 | Eng | Choose `/cdn-cgi/image` URL transforms as the only v1 runtime mechanism | mechanical | P5 Explicit over clever | Mixing the existing binding with URL transforms would make debugging and verification ambiguous | "support both mechanisms in v1" |
| 7 | Eng | Enforce a hard remote-host allowlist with deny-by-default behavior | mechanical | P1 Choose completeness | The loader must not become a generic fetch path for arbitrary origins | "document hosts but allow unknown ones" |
| 8 | Eng | Defer full canonical media ingestion, but keep a bypass path for volatile signed hosts | taste | P3 Pragmatic | The risk is real, but solving canonicalization now expands the slice beyond a one-feature image-loader plan | "expand v1 to full app-owned media ingestion" |
| 9 | User | Expand v1 to include canonical media ingestion for volatile source families | user override | User sovereignty | The user explicitly chose the broader, more durable approach after review surfaced the tradeoff | "thin loader + bypass-only v1" |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/autoplan` | Scope & strategy | 1 | issues_open | Needed metrics, surface prioritization, and operational ownership |
| Codex Review | `codex exec` | Independent 2nd opinion | 3 | issues_open | Surfaced strategic, design, and engineering ambiguities now written back into the plan |
| Eng Review | `/autoplan` | Architecture & tests | 1 | issues_open | Needed explicit runtime mechanism, allowlist, and volatility handling |
| Design Review | `/autoplan` | UI/UX gaps | 1 | issues_open | Needed surface contracts, fallback states, and ratio rules |
| DX Review | — | Developer experience gaps | 0 | skipped | No developer-facing product scope detected |

**VERDICT:** APPROVED WITH OVERRIDE — proceed with the stronger v1 that includes canonical media ingestion for volatile sources, while keeping the explicit surface contract and allowlist requirements.
