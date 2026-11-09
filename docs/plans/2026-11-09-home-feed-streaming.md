# Replace Homepage Pages with Continuous Loading

1. Record the user's replacement requirement and mark the earlier pagination contract historical. Keep PR #57 in draft while the change is in progress.
2. Extract shared server feed assembly, replace page slicing with cursor batches and add `GET /api/feed` plus native HTML continuation.
3. Replace Previous/Next UI with automatic append and a real Load more fallback. Keep one request in flight; abort/reset on filters/unmount, reject stale responses and allow retry/reload recovery.
4. Replace pagination tests with meaningful cursor/route/SSR regression tests. Run installed tests, lint, typecheck and standalone Next/OpenNext build.
5. Push the updated branch, wait for exact-SHA automatic Cloudflare preview, then verify HTTP traversal and the real continuous-loading flows on desktop/mobile/no-JS. Preserve production deployment IDs.
6. Update roadmap, task ledger, verification and PR title/body around the final continuous-loading behavior, explicitly separating superseded pagination evidence and pending laboratory measurements.
