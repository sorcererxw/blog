# Homepage Performance Implementation Plan

1. Record the visibility/pagination amendment and baseline.
2. Add domain pagination helpers and route slicing before serialization/JSON-LD.
3. Replace hydration layout gating with visible CSS masonry and retain real filter/page links.
4. Add unit/SSR regression tests and run full tests, lint, typecheck and build.
5. Verify HTTP, browser navigation, Back/Forward, repeated filters, reduced motion and no-JS readability on mobile/desktop. Measure before/after under equivalent conditions when possible.
6. Update roadmap, ledger, verification and BOT-135.
7. Following the user's November 9 publication request, publish a draft PR and validate its actual Cloudflare preview with live data. Production deployment and merge remain outside this step.
