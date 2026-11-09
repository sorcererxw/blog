# Replace Homepage Pages with Continuous Loading

1. Record the user's replacement requirement and mark the earlier pagination contract historical. Keep PR #57 in draft while the change is in progress.
2. Extract shared server feed assembly, replace page slicing with cursor batches and add `GET /api/feed` plus native HTML continuation.
3. Replace Previous/Next UI with automatic append and a real Load more fallback. Keep one request in flight; abort/reset on filters/unmount, reject stale responses and allow retry/reload recovery.
4. Replace pagination tests with meaningful cursor/route/SSR regression tests. Run installed tests, lint, typecheck and standalone Next/OpenNext build.
5. Push the updated branch, wait for exact-SHA automatic Cloudflare preview, then verify HTTP traversal and the real continuous-loading flows on desktop/mobile/no-JS. Preserve production deployment IDs.
6. Update roadmap, task ledger, verification and PR title/body around the final continuous-loading behavior, explicitly separating superseded pagination evidence and pending laboratory measurements.

## Completion and release handoff

Steps 1–6 are complete for application source `028bfacf5e3e65a9845434c60ca99e01c1f1f0d5`. Installed tests passed (39 files / 143 tests), followed by lint/typecheck and Next standalone/OpenNext build. Automatic Cloudflare build `255ecd95-260d-4b7d-8c93-18931b8c9bd1` passed and uploaded version `7bec91b5-0331-4ee2-9ea2-84ffe969e754` at https://7bec91b5-blog.xw.workers.dev/. The 45-request live-data HTTP matrix and real continuous-loading browser acceptance passed; details and limitations are in the task ledger and verification guide. Production deployment/version remained unchanged.

PR https://github.com/sorcererxw/blog/pull/57 remains draft. Its description holds the exact current-HEAD check/immutable preview and final HTTP smoke for documentation-only successors, avoiding a self-referential commit in this document. Confirm application, build/config and dependency files have no diff from the verified source before carrying forward its full functional QA. Keep the current automatic branch alias in the PR for convenient review. Do not merge or deploy production as part of this preview task.

The interaction now uses continuous scrolling with a native Load more fallback; the old page-number/last-page matrix is superseded by full cursor traversal, terminal-batch and invalid-cursor checks. A future comparable performance run must use the same real dataset, warm/cold cache policy, viewport/network/CPU settings and tool version for base and candidate, retain multiple raw runs and report medians. Laboratory results do not establish real-user CWV. No comparative LCP/TBT/CLS measurement was run in this slice.
