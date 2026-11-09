# Homepage Performance Implementation Plan

1. Record the visibility/pagination amendment and baseline.
2. Add domain pagination helpers and route slicing before serialization/JSON-LD.
3. Replace hydration layout gating with visible CSS masonry and retain real filter/page links.
4. Add unit/SSR regression tests and run full tests, lint, typecheck and build.
5. Verify HTTP, browser navigation, Back/Forward, repeated filters, reduced motion and no-JS readability on mobile/desktop. Measure before/after under equivalent conditions when possible.
6. Update roadmap, ledger, verification and BOT-135.
7. Following the user's November 9 publication request, publish a draft PR and validate its actual Cloudflare preview with live data. Production deployment and merge remain outside this step.

## Offline publication preparation follow-up

The implementation is committed at `735f0a8b1ee386da8e8a14769a19a21a7db11647`. The attempted branch push was denied by network policy; a PR and a real Cloudflare preview do not exist yet. Do not retry the denied push, Fonts, registry, or telemetry endpoints without materially new evidence addressing the denial.

1. Independently review the application diff against `c2bc171cdf1a21f5621de1decf1b543b275b603d`, including connected filtering, serialization, SEO, navigation transitions and provider-cache code.
2. Run only relevant checks using installed binaries, without dependency downloads. Record assertion results separately from command failures.
3. Save a ready-to-use draft PR title/body and an exact-commit Cloudflare acceptance procedure in `docs/plans/2026-11-09-home-performance-release.md`.
4. Correct roadmap, ledger and verification publication status. Keep original local build/fixture evidence separate from the blocked fresh build and pending real-preview work.
5. Commit local preparation only. After network access is explicitly restored for the denied operation, publish the branch, create the draft PR, confirm the deployed full SHA and run the acceptance procedure. Do not merge or deploy production as part of this task.
