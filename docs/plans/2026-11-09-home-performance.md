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

## Publication resumed and preview build repair

The user confirmed the network restriction was lifted. The original push succeeded, and draft PR https://github.com/sorcererxw/blog/pull/57 targets `main` with candidate `aabe11714cbd2956b4bfbfbc35b4561e841e8fb3`. Cloudflare's exact-SHA build failed in the Google font loader, before any preview version was uploaded.

1. Vendor the same Latin font families/weights with licenses, provenance and hashes; change only their loader to `next/font/local`.
2. Run installed tests, lint, typecheck and a production/OpenNext build. Do not use mocked font responses or suppress build errors.
3. Initially keep the shared configuration unchanged after the rejected save, and use standalone/OpenNext local packaging plus preview-only version upload. After exact build logs and official documentation established the non-production command scope, one save retry was accepted: version command is now `pnpm run upload`, with production branch/build/deploy fields unchanged. Confirm the next automatic build and version upload; record the production deployment before/after. Do not run `deploy` or `versions deploy`.
4. Commit and push the repair, confirm the new exact SHA and successful Cloudflare version upload, then run HTTP/browser acceptance on the actual preview URL. Update PR description and living docs with results and limitations.

## Real-preview image repair

Preview version `f2b5d71e-0ab9-4f37-b5c5-73501b29ef3b` maps to source `a85d3aa6deaf874b5c433c618ff8db71b2c92d84`. HTTP pagination and SEO pass on real content, but stable image transforms are 404 under workers.dev and 200 under the existing public image zone.

1. Share a small fixed Cloudflare image origin between both image URL builders; leave bypass/canonical-media behavior intact.
2. Add a regression assertion for workers.dev URL resolution, run image/feed tests, lint, typecheck and the standalone/OpenNext build.
3. Push the repair and upload another preview-only version with exact-SHA metadata. Recheck decoded media, responsive rendering, links, no-JS and history; record earlier failing and final evidence separately.

## Verification checkpoint

Application source `907004c1f0458eb658c16eb7ae836e770b4146ba` passed full tests, lint, typecheck, standalone Next/OpenNext build and real preview acceptance at https://198ff516-blog.xw.workers.dev/. Both earlier preview failures (build-time Google font loader and workers.dev-relative transforms) are repaired. The detailed evidence and remaining comparable laboratory measurements are in `docs/verification.md`. A documentation-only successor will trigger the corrected automatic preview pipeline; its exact SHA, resulting version and smoke checks must be recorded in PR #57 before handoff.
