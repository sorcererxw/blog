# Blog2 Verification Guide

## 2026-05-21 X Quote Post Preview State

Current X quote-post shape:

- X quote posts remain in scope because they are authored by `sorcererxw`; pure replies and retweets are still excluded by the X API request.
- X sync expands quoted tweet, quoted tweet author, and quoted tweet media data during the scheduled sync path.
- Stored X Social Post details may include a one-level `quotedPost` preview with author, username, text, media, and target URL.
- Parent quote-post text strips the trailing quoted `t.co` URL when the quoted target is available.
- Overview Feed renders the parent post text followed by a lightweight quoted-post preview, without using the official Twitter/X embed script.

Current evidence:

- `pnpm test -- src/domains/social/x-sync.test.ts src/integrations/kv/x-social-post-store.test.ts src/domains/feed/overview-feed.test.ts src/components/feed/overview-feed-view.test.tsx`: PASS, Vitest config ran the active suite (`36` files, `123` tests).
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next middleware deprecation warnings.
- `pnpm exec opennextjs-cloudflare build`: PASS, with existing non-fatal OpenNext package-template copy logs; `.open-next/worker.js` was generated.
- Remote X KV cache rebuild: deleted `social:x:index` and `social:x:posts:*`, confirmed the prefix list returned `[]`, then triggered Wrangler `/__scheduled`.
- `curl --max-time 90 -i -X POST 'http://127.0.0.1:3294/__scheduled?cron=0+18+*+*+*'`: PASS, returned `200 OK` and `Ran scheduled event`; worker log reported `retainedCount: 18`, `scannedCount: 18`, and `scannedBoundaryId: "2050332911732503022"`.
- `pnpm exec wrangler kv key get 'social:x:index' --namespace-id 82255de05f7d4b9e8cf0cb43521ee243 --remote`: PASS after KV propagation, returned `lastError: null`, `lastRetainedCount: 18`, `lastScannedCount: 18`, and 18 ordered ids.
- `pnpm exec wrangler kv key get 'social:x:posts:2056921917324722661' --namespace-id 82255de05f7d4b9e8cf0cb43521ee243 --remote`: PASS, returned `kind: "quote"`, parent text without the quoted `t.co`, and `quotedPost` for ZEN / `@supezen`.
- Chrome verification at `http://127.0.0.1:3294/?source=x`: PASS, rendered the target card with parent text and a ZEN / `@supezen` quote preview.

Residual risk:

- The rebuild returned 18 X posts while the previous cache had 19; the older `1335174971300036608` post was not returned by the current owned-post rebuild.

## 2026-05-21 X Media Image State

Current X image delivery shape:

- X media images from `pbs.twimg.com` are public and do not require authentication.
- The root cause of broken X images was the custom Next image loader appending width/quality query params to unsupported upstream X media URLs.
- `pbs.twimg.com` is now in the Cloudflare transform allowlist, so generated image URLs use `/cdn-cgi/image/.../https://pbs.twimg.com/...` instead of `https://pbs.twimg.com/...jpg?width=...`.

Current evidence:

- `curl -I -L --max-time 20 'https://pbs.twimg.com/media/HIv1eC8bYAARyvw.jpg'`: PASS, returned `200 image/jpeg`.
- `curl -I -L --max-time 20 'https://pbs.twimg.com/media/HIv1eC8bYAARyvw.jpg?width=384'`: reproduced `404`.
- `pnpm test -- src/lib/images/image-loader.test.ts src/lib/images/cloudflare.test.ts src/domains/feed/overview-feed.test.ts src/components/feed/overview-feed-view.test.tsx`: PASS, Vitest config ran the active suite (`36` files, `122` tests).
- `pnpm typecheck`: PASS.

## 2026-05-21 X Feed Card Title State

Current X feed rendering shape:

- X Social Posts map to Overview Feed items with `title: ""`.
- Overview Feed rendering skips the heading block for untitled items, so X cards show the post body once instead of repeating it as title and summary.
- Homepage JSON-LD ItemList names use `title || summary` so untitled X feed items still produce non-empty structured-data names.

Current evidence:

- `pnpm test -- src/domains/feed/overview-feed.test.ts src/components/feed/overview-feed-view.test.tsx src/app/seo.test.tsx src/domains/seo/build-structured-data.test.ts`: PASS, Vitest config ran the active suite (`36` files, `120` tests).
- `pnpm typecheck`: PASS.

## 2026-05-21 Feed Card Timestamp Link State

Current feed card link shape:

- Overview Feed items with a non-`none` destination render a focusable card surface with `role="link"` and client-side click / keyboard navigation.
- Card-surface click handling must not treat the card's own `role="link"` as an internal interactive child; otherwise card-body clicks are swallowed before navigation.
- The card surface is not an outer `<a>`, so rich-text URLs inside Feed Module bodies are not nested inside another anchor.
- The item's real crawlable destination anchor is rendered on the timestamp.
- Timestamp destination anchors apply `hover:[&_time]:underline` so the link affordance appears on the inline-flex `<time>` element itself.
- Items with `destination.kind === "none"` still render without card click behavior and without a timestamp destination link.

Current evidence:

- `pnpm test -- src/components/feed/overview-feed-view.test.tsx`: PASS, Vitest config ran the active full suite (`37` files, `121` tests).
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets`, local missing `X_SECRET`, and Next middleware deprecation warnings.
- `pnpm exec next start --hostname 127.0.0.1 -p 3293`: PASS, served the production build locally.
- Chrome verification at `http://127.0.0.1:3293/`: PASS, clicking the FeedContext card body opened a new tab at `https://feedcontext.io`.
- `pnpm exec next start --hostname 127.0.0.1 -p 3292`: PASS, served the production build locally.
- `curl --max-time 90 -s -o /tmp/blog-card-timestamp-links.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3292/ && rg -n 'role="link"|tabindex="0"|href="https://t\.me/s/tech_bb/[0-9]+"|href="/articles/|class="block text-inherit no-underline"|break-all font-semibold text-foreground underline' /tmp/blog-card-timestamp-links.html | head -80`: PASS, returned `200 text/html; charset=utf-8`, rendered focusable card surfaces, timestamp destination links, and rich-text anchors, with no whole-card outer link class.
- Chrome verification at `http://127.0.0.1:3292/`: PASS, rendered the homepage Overview Feed; accessibility tree showed cards as `link Open Telegram item` with nested timestamp links such as `MAY 10, 2026` pointing to `t.me/s/tech_bb/111`.

## 2026-05-21 X Social Source State

Current X Social Source shape:

- X source id is `x`, with filter URL `/?source=x`.
- Homepage rendering reads stored X Social Posts from `BLOG_CACHE`; it does not call X directly.
- X sync enters through the Worker-level `scheduled()` handler and is configured for daily `0 18 * * *` Cloudflare cron.
- X sync fetches owned posts through `@xdevplatform/xdk` `Client.users.getPosts`; `worker.ts` creates the client and passes it directly into `syncXSocialPosts`.
- X sync passes `exclude: ["replies", "retweets"]`, so replies and reposts are filtered by X before local normalization.
- Local manual triggering uses Wrangler scheduled-event testing through `/__scheduled`.
- X KV state uses `social:x:index` plus per-post `social:x:posts:<id>` detail keys.
- Sync scans at most 50 API-returned posts after `scannedBoundaryId`; replies and reposts are excluded by the API request, and local sync stores original and quote posts.

Current evidence:

- `pnpm test -- src/domains/social/x-sync.test.ts src/integrations/kv/x-social-post-store.test.ts`: PASS after simplifying X fetch around a direct XDK client passed into the domain sync module, Vitest config ran the active suite (`36` files, `120` tests).
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next middleware deprecation warnings.
- `pnpm exec opennextjs-cloudflare build`: PASS, with existing package-template copy logs and the same missing local `X_SECRET` warning.
- `pnpm exec opennextjs-cloudflare build`: PASS before remote scheduled verification; OpenNext emitted the existing non-fatal package-template copy logs and wrote `.open-next/worker.js`.
- `pnpm exec wrangler dev --remote --ip 127.0.0.1 --port 3291 --test-scheduled`: PASS, remote preview started with `BLOG_CACHE`, `NOTION_SECRET`, and `X_SECRET` bindings available from `.dev.vars`.
- `curl --max-time 60 -i -X POST 'http://127.0.0.1:3291/__scheduled?cron=0+18+*+*+*'`: PASS, returned `200 OK` and `Ran scheduled event`; worker log reported `X sync completed` with `retainedCount: 19`, `scannedCount: 19`, and `scannedBoundaryId: "1335174971300036608"`.
- `pnpm exec wrangler kv key get 'social:x:index' --namespace-id 82255de05f7d4b9e8cf0cb43521ee243 --remote`: PASS, returned `lastError: null`, `lastRetainedCount: 19`, `lastScannedCount: 19`, `lastSuccessAt: "2026-05-21T04:39:44.063Z"`, and 19 ordered X post ids.
- `pnpm exec wrangler kv key get 'social:x:posts:2057007736442040683' --namespace-id 82255de05f7d4b9e8cf0cb43521ee243 --remote`: PASS, returned the normalized X post detail with `kind: "original"`, media, text, and canonical X URL.
- `curl --max-time 90 -s -o /tmp/blog-x-remote-filter.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3291/?source=x' && rg -n 'x.com/sorcererxw/status|data-selected="true"|No feed items match this filter|Overview feed|href="/\?source=x"' /tmp/blog-x-remote-filter.html | head -80`: PASS, remote preview returned `200 text/html`, selected the X tab, rendered X post cards, and did not render the empty state.
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3291 --test-scheduled`: PASS, local preview served through Wrangler.
- `curl --max-time 90 -s -o /tmp/blog-x-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3291/ && rg -n 'href="/\?source=x"|data-slot="tabs-tab"|Personal Site|Overview feed|X' /tmp/blog-x-home.html | head -80`: PASS, homepage returned `200 text/html` and rendered the X filter tab.
- `curl --max-time 90 -s -o /tmp/blog-x-filter.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3291/?source=x' && rg -n 'href="/\?source=x"|data-selected="true"|No feed items match this filter|Overview feed' /tmp/blog-x-filter.html | head -80`: PASS, X filter returned `200 text/html`, rendered the active X tab, and showed the empty state while local KV had no X posts.
- `curl --max-time 30 -i -X POST 'http://127.0.0.1:3291/__scheduled?cron=0+18+*+*+*' | head -80`: PASS, Wrangler returned `200 OK` and `Ran scheduled event`.
- Chrome verification at `http://127.0.0.1:3291/?source=x`: PASS, rendered the homepage with Profile Hero, Overview Feed filters, selected X tab, and empty-state text.

Residual risk:

- The remote dev scheduled run established the X KV cache successfully; production deployment still needs the same `X_SECRET` configured for the daily cron.

## 2026-05-19 Agent Link Header Discovery State

Current discovery shape:

- `/` emits an RFC 8288 `Link` response header with `api-catalog`, `service-doc`, and `describedby` relations.
- `/.well-known/api-catalog` serves `application/linkset+json` with the public health endpoint as the current API item.
- The API catalog links `/llms.txt` as `service-doc` and `/sitemap.xml` as `describedby`.

Current evidence:

- `curl -fsSL https://isitagentready.com/.well-known/agent-skills/link-headers/SKILL.md`: PASS, reviewed the agent-readiness requirement.
- `pnpm test -- 'src/app/.well-known/api-catalog/route.test.ts'`: PASS, Vitest config ran the active full suite (`34` files, `115` tests).
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `pnpm exec next start --hostname 127.0.0.1 -p 3280`: PASS, served the production build locally.
- `curl --max-time 90 -s -D /tmp/blog-agent-link-home.headers -o /tmp/blog-agent-link-home.html http://127.0.0.1:3280/ && rg -n '^HTTP/|^link:|^cache-control:|^content-type:' /tmp/blog-agent-link-home.headers`: PASS, homepage returned `200` and a `Link` header containing `rel="api-catalog"`, `rel="service-doc"`, and `rel="describedby"`.
- `curl --max-time 90 -s -D /tmp/blog-agent-api-catalog.headers -o /tmp/blog-agent-api-catalog.json http://127.0.0.1:3280/.well-known/api-catalog`: PASS, returned `200`, `application/linkset+json`, and the same agent discovery `Link` relations.
- `curl --max-time 90 -s -I http://127.0.0.1:3280/.well-known/api-catalog`: PASS, returned `200`, `application/linkset+json`, and `rel="api-catalog"` with no response body.

## 2026-05-18 Feed Card Link Priority State

Superseded by `2026-05-21 Feed Card Timestamp Link State`.

Current feed card link shape:

- Any Overview Feed item with a non-`none` destination renders a whole-card outer link.
- Telegram rich-text URLs remain real nested anchors inside that whole-card link.
- Items with `destination.kind === "none"` still render without a card link.

Current evidence:

- `pnpm test -- src/components/feed/overview-feed-view.test.tsx`: PASS, Vitest config ran the active full suite (`33` files, `113` tests).
- `pnpm lint`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `pnpm typecheck`: PASS after `pnpm build`.
- `pnpm exec next start --hostname 127.0.0.1 -p 3279`: PASS, served the production build locally.
- `curl --max-time 90 -s -o /tmp/blog-feed-two-layer-links.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3279/ && rg -n 'class="block text-inherit no-underline" href="https://t\.me/s/tech_bb/[0-9]+"|class="break-all font-semibold text-foreground underline underline-offset-\[0\.12em\]"[^>]+href="https?://' /tmp/blog-feed-two-layer-links.html | head -40`: PASS, returned `200 text/html; charset=utf-8` and showed Telegram whole-card permalinks plus nested rich-text anchors in the rendered HTML.
- `git diff --check`: PASS.
- Browser click verification was not run; HTML-level production verification covered the SEO-visible anchor structure for this slice.

## 2026-05-18 Header Theme Toggle State

Current theme toggle shape:

- The site header renders a HeroUI icon-only `Button` on the right side of the header action area.
- The button uses `Moon` while the current theme is light and `Sun` while the current theme is dark from `lucide-react`.
- The selected theme is persisted to `localStorage` as `blog-theme`.
- The active theme is applied to `document.documentElement` as `.light` / `.dark` and `data-theme="light"` / `data-theme="dark"`.
- `src/app/layout.tsx` includes a small initialization script to restore the stored theme or system color scheme before hydration.

Current evidence:

- `node /Users/sorcererxw/.agents/skills/heroui-react/scripts/get_component_docs.mjs Button Tooltip Switch`: PASS, reviewed HeroUI v3 docs and used the icon-only Button pattern per the final direction.
- `pnpm test -- src/components/shell/site-shell.test.tsx`: PASS, Vitest config ran the active full suite (`33` files, `113` tests).
- `pnpm lint`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `pnpm typecheck`: PASS when rerun after `pnpm build`; an earlier parallel `typecheck` failed because `next build` was concurrently recreating `.next/types`.
- `curl --max-time 90 -s -o /tmp/blog-theme-toggle-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3278/ && rg -n 'Switch to dark theme|Switch to light theme|blog-theme|prefers-color-scheme|data-theme|button--icon-only|lucide-(moon|sun)' /tmp/blog-theme-toggle-home.html | head -80`: PASS, returned `200 text/html; charset=utf-8`; rendered the theme initialization script, HeroUI icon-only button markup, accessible label, and moon icon.
- `curl --max-time 90 -s -o /tmp/blog-theme-toggle-article.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3278/articles/grpc-gateway-comparison && rg -n 'Switch to dark theme|Switch to light theme|blog-theme|prefers-color-scheme|data-theme|button--icon-only|lucide-(moon|sun)|A table must have at least one Column' /tmp/blog-theme-toggle-article.html | head -80`: PASS, returned `200 text/html; charset=utf-8`; rendered the header theme icon button and did not include the prior table runtime error string.
- Browser click verification could not be completed in this session because the Browser tool was not exposed and Node REPL reported `Module not found: playwright`.

## 2026-05-18 HeroUI Table Row Header Requirement

Current rich-content table row-header shape:

- Article detail and home intro table renderers always mark the first rendered column with `isRowHeader`.
- This is required even when Notion only marks column headers and leaves `has_row_header` false.
- Do not remove the fallback unless the HeroUI/React Aria table contract changes.

Current evidence:

- `pnpm test -- src/components/article/article-detail-view.test.tsx src/components/home/intro.test.tsx`: PASS, Vitest config ran the active full suite (`33` files, `113` tests).
- `pnpm lint`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `curl --max-time 90 -s -o /tmp/blog-grpc-table.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3277/articles/grpc-gateway-comparison && rg -n 'role="rowheader"|role="columnheader"|<table|grpc|gRPC|A table must have at least one Column' /tmp/blog-grpc-table.html | head -60`: PASS, returned `200 text/html; charset=utf-8`; rendered RSC payload includes `isRowHeader":true` for `column-0` and the runtime error string is absent.
- Browser verification could not be completed in this session because the Browser tool was not exposed and Node REPL could not import `playwright`.

## 2026-05-18 Homepage Card Horizontal Padding State

Current feed card shape:

- Homepage feed Card base classes include `px-0` so media and body blocks are not inset by HeroUI Card's default horizontal padding.
- Homepage feed body padding is unified to `p-5` / 20px across standard, compact, and feature cards.
- Compact cards may still use tighter `gap-2`, but they must not use `p-4`.
- Feed rich-text links use `break-all` so long URL tokens cannot overflow the card.

Current evidence:

- `pnpm test -- src/components/feed/overview-feed-view.test.tsx`: PASS, Vitest config ran the active full suite (`33` files, `111` tests).
- `pnpm lint`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- Browser verification could not be completed in this session because the Browser tool was not exposed and Node REPL could not import `playwright`.

## 2026-05-18 Homepage Masonry Shadow Clipping State

Current feed masonry shape:

- Homepage masonry cells do not use `content-visibility` or `contain-intrinsic-size`.
- Card shadows must be allowed to paint outside the masonry cell boundary.
- The card surface may still clip internal media for rounded corners; do not treat card-level `overflow-hidden` as the shadow clipping fix.

Current evidence:

- `pnpm test -- src/components/feed/overview-feed-view.test.tsx`: PASS, Vitest config ran the active full suite (`33` files, `111` tests).
- `pnpm lint`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `curl --max-time 90 -s -o /tmp/blog-masonry-shadow.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3275/ && rg -n 'content-visibility|contain-intrinsic-size|masonry-feed_cell|data-feed-layout="fallback-single-column"|data-slot="card"' /tmp/blog-masonry-shadow.html | head -40`: PASS, returned `200 text/html; charset=utf-8`; rendered homepage markup contains masonry/card output and no `content-visibility` or `contain-intrinsic-size`.
- Browser verification could not be completed in this session because the Browser tool was not exposed and Node REPL could not import `playwright`.

## 2026-05-18 HeroUI Migration Verification Contract

Current component migration direction:

- HeroUI v3 is the target shared component implementation.
- The old local shadcn/Base UI components under `src/components/ui` have been removed from the active source tree.
- Each migrated primitive must delete its corresponding `src/components/ui/<component>.tsx` file in the same slice.
- Semantic app wrappers are allowed outside `src/components/ui` only when they represent product meaning, not a primitive mirror.
- `src/app/globals.css` owns HeroUI theme customization variables after `@import "@heroui/styles"`; it no longer imports `shadcn/tailwind.css`.

Minimum evidence per component slice:

- targeted tests for touched surfaces
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `curl` for affected routes when rendered HTML changes
- browser verification for affected visible or interactive UI

Final cleanup evidence:

- `rg -n "shadcn|@base-ui|class-variance-authority|@/components/ui|components/ui|text-muted-foreground|bg-card|border-border|outline-ring|text-primary|--card|--muted-foreground|--primary|--secondary|--popover|--ring|--input|--destructive" src package.json pnpm-lock.yaml eslint.config.mjs`
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm exec opennextjs-cloudflare build`

## 2026-05-18 HeroUI Font Token State

Current font token shape:

- `--font-heading` uses Libre Bodoni.
- `--font-display` uses Courier Prime.
- `--font-code` uses Courier Prime.
- Default interface typography uses `font-display`.
- Active title and heading call sites use `font-heading`; base `h1` through `h6` also apply `font-heading`.
- Code call sites use `font-code`; base `pre` and `code` also apply `font-code`.
- The app does not define active `font-sans`, `font-serif`, or `font-mono` conventions.

Current evidence:

- `pnpm lint`: PASS.
- `pnpm test -- src/components/feed/overview-feed-view.test.tsx src/components/article/article-detail-view.test.tsx src/components/home/intro.test.tsx src/components/shell/site-shell.test.tsx src/domains/feed/feed-layout-engine.test.ts`: PASS, Vitest config ran the active full suite (`33` files, `111` tests).
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `pnpm typecheck`: PASS when rerun after `pnpm build`; an earlier parallel `typecheck` failed because `next build` was concurrently recreating `.next/types`.
- `rg -n "font-sans|font-serif|font-mono|--font-sans|--font-serif|--font-mono|--font-fraunces|--font-display-runtime|--font-code-runtime|Fraunces" src/app src/components src/domains`: PASS, no old active font conventions remain.
- `rg -o -e "--font-display:[^;]+|--font-heading:[^;]+|--font-code:[^;]+|\\.font-display\\{[^}]+\\}|\\.font-heading\\{[^}]+\\}|\\.font-code\\{[^}]+\\}|:where\\(h1,h2,h3,h4,h5,h6\\)\\{[^}]+\\}|:where\\(pre,code\\)\\{[^}]+\\}|font-family:var\\(--font-code\\),monospace" .next/static/css/*.css`: PASS, compiled CSS maps display, heading, and code to the current font tokens.
- `curl --max-time 90 -s -o /tmp/blog-font-conventions-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3276/ && rg -n 'font-heading|font-display|font-code|font-sans|font-serif|font-mono|Fraunces|Outfit|Instrument|Newsreader|Roboto|__variable_' /tmp/blog-font-conventions-home.html | head -80`: PASS, returned `200 text/html; charset=utf-8`; rendered HTML includes `font-display` and two Next Font variable classes, with no old font names or old font utility classes in page markup.

## 2026-05-18 HeroUI Token and Final shadcn Removal State

Current token shape:

- `src/app/globals.css` imports Tailwind and `@heroui/styles`; it does not import `shadcn/tailwind.css`.
- The active app token variables are HeroUI variables such as `--accent`, `--background`, `--border`, `--default`, `--field-*`, `--focus`, `--foreground`, `--muted`, `--separator`, `--surface`, `--success`, and `--warning`.
- `components.json` has been deleted.
- `src/components/ui` has no remaining primitive files.
- `package.json` no longer depends on `shadcn`, `@base-ui/react`, or `class-variance-authority`.
- Active app classes use HeroUI token names such as `text-muted`, `bg-default`, `bg-surface`, `border-separator`, `outline-focus`, and `text-accent`.

Current evidence:

- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm test`: PASS, `33` files and `111` tests.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `pnpm exec opennextjs-cloudflare build`: PASS with exit code 0 and `.open-next/worker.js` generated; OpenNext printed non-fatal `Failed to copy` package-template logs for `hast-util-to-html`, `hast-util-whitespace`, and `property-information`.
- `rg -n "shadcn|@base-ui|class-variance-authority|@/components/ui|components/ui|text-muted-foreground|bg-card|border-border|outline-ring|text-primary|--card|--muted-foreground|--primary|--secondary|--popover|--ring|--input|--destructive" src package.json pnpm-lock.yaml eslint.config.mjs`: PASS, no output.
- `find src/components/ui -maxdepth 1 -type f -print 2>/dev/null | sort; test ! -e components.json && echo components.json-deleted`: PASS, no local UI primitive files remain and `components.json` is deleted.
- `curl --max-time 90 -s -o /tmp/blog-heroui-token-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3273/ && rg -n 'shadcn|text-muted-foreground|border-border|bg-card|text-primary|text-muted|bg-surface|border-separator|--accent|--surface' /tmp/blog-heroui-token-home.html | head -40`: PASS, returned `200 text/html; charset=utf-8` and rendered HeroUI token classes.
- `curl --max-time 90 -s -o /tmp/blog-heroui-token-writing.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3273/?type=writing'`: PASS, returned `200 text/html; charset=utf-8`.
- `curl --max-time 90 -s -o /tmp/blog-heroui-token-health.json -w '%{http_code} %{content_type}\n' http://127.0.0.1:3273/api/health && cat /tmp/blog-heroui-token-health.json`: PASS, returned `200 application/json` and a healthy payload.
- Browser verification could not be completed in this session because the Browser tool was not exposed and Node REPL could not import `playwright`.

## 2026-05-18 HeroUI Card Empty Separator State

Current card/empty/separator shape:

- Active cards no longer import `@/components/ui/card`.
- Empty states no longer import `@/components/ui/empty`; they render through HeroUI card surfaces.
- Active separators no longer import `@/components/ui/separator`.
- `src/components/ui/card.tsx`, `src/components/ui/empty.tsx`, and `src/components/ui/separator.tsx` have been deleted.
- Server-rendered components use `@heroui/styles` `cardVariants` and `separatorVariants` to avoid importing client-only `@heroui/react` into Server Components.

Current evidence:

- `node /Users/sorcererxw/.agents/skills/heroui-react/scripts/get_component_docs.mjs Card Separator`: PASS, reviewed HeroUI `Card` and `Separator`; confirmed HeroUI v3 has no `EmptyState` component.
- `pnpm test -- src/components/feed/overview-feed-view.test.tsx src/components/projects/projects-list.test.tsx src/components/home/intro.test.tsx src/components/article/article-detail-view.test.tsx src/components/thoughts/thoughts-page.test.tsx`: PASS, Vitest config ran the active full suite (`33` files, `111` tests).
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm build`: PASS after using `@heroui/styles` variants for server-rendered card/separator surfaces; build retains existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `rg -n "@/components/ui/(card|empty|separator)|components/ui/(card|empty|separator)|<Empty\\b|EmptyContent|EmptyTitle|EmptyDescription|from \\"@/components/ui/card\\"|from \\"@/components/ui/empty\\"|from \\"@/components/ui/separator\\"" src package.json pnpm-lock.yaml`: PASS, no old Card/Empty/Separator primitive references remain.
- `curl --max-time 90 -s -o /tmp/blog-heroui-card-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3272/ && rg -n 'class="[^\"]*(card|separator)|data-slot="card|data-slot="empty|data-slot="separator|href="/stack"' /tmp/blog-heroui-card-home.html`: PASS, returned `200 text/html; charset=utf-8`; homepage rendered HeroUI card/separator classes and no old empty/separator data slots.
- Browser automation remains blocked in this environment: Node REPL has no Playwright package, and local Chrome/Safari reject JavaScript execution through AppleScript because `Allow JavaScript from Apple Events` is disabled.

## 2026-05-18 Domain UI Boundary State

Current boundary shape:

- `src/domains/*` contains no `.tsx` React component files.
- `src/domains/*` has no imports from `@/components/ui/*`.
- React view composition now lives under `src/components/*`.
- `src/domains/feed/overview-feed-view-model.ts` carries the feed view data shape used by serialization and UI without making domain code import component files.

Current evidence:

- `find src/domains -name '*.tsx' -type f -print`: PASS, no output.
- `rg -n "@/components/ui/" src/domains`: PASS, no output.
- `pnpm test -- src/components/feed/overview-feed-view.test.tsx src/components/projects/projects-list.test.tsx src/components/home/intro.test.tsx src/components/home/profile-hero.test.tsx src/components/article/article-detail-view.test.tsx src/components/article/article-list.test.tsx src/components/thoughts/thoughts-page.test.tsx src/components/shell/site-shell.test.tsx`: PASS, Vitest config ran the active full suite (`33` files, `111` tests).
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.

## 2026-05-18 Stack Page Removal State

Current Stack shape:

- `/stack` is not an app route and is no longer recognized as a public route key.
- Stack domain code, Stack Notion adapter, and Stack KV cache helper have been removed from the active app.
- Provider cache wrappers no longer include a Stack provider path.
- Shell/header/footer no longer accept or compute `includeStack`.

Current evidence:

- `pnpm test -- src/domains/shell/site-shell.test.tsx src/integrations/kv/provider-wrappers.test.ts`: PASS, Vitest config ran the active full suite (`33` files, `111` tests).
- `rg -n "stack|Stack" src --glob '!src/integrations/telegram/public-page.ts'`: PASS, only negative shell test assertions remain.
- `rg -n "@/domains/stack|domains/stack|@/integrations/notion/stack|integrations/notion/stack|stack-cache|withCachedStackSource|NotionStack" src package.json pnpm-lock.yaml`: PASS, no active Stack domain/provider/cache imports remain.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm build`: PASS, route output has no `/stack`; build retains existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `curl --max-time 90 -s -o /tmp/blog-stack-removed.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3271/stack`: PASS, returned `404 text/html; charset=utf-8`.
- `curl --max-time 90 -s -o /tmp/blog-stack-removed-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3271/ && rg -n 'href="/stack"|Stack|stack live nearby' /tmp/blog-stack-removed-home.html`: PASS, returned `200 text/html; charset=utf-8` and found no Stack navigation/copy markers.
- `curl --max-time 90 -s -o /tmp/blog-stack-removed-sitemap.xml -w '%{http_code} %{content_type}\n' http://127.0.0.1:3271/sitemap.xml && rg -n '/stack|<loc>' /tmp/blog-stack-removed-sitemap.xml`: PASS, returned `200 application/xml; charset=utf-8` and listed sitemap URLs without `/stack`.

## 2026-05-18 HeroUI Rich Content Table State

Current rich-content table shape:

- Article detail and home intro Notion table rendering use HeroUI `Table` through `src/components/rich-content/rich-content-table.tsx`.
- The rich-content table wrapper is a client component because HeroUI `Table` imports client-only code; the article/home renderers remain server modules.
- The old local shadcn/Base UI `src/components/ui/table.tsx` file has been deleted.
- There are no remaining source imports of `@/components/ui/table`.

Current evidence:

- `node /Users/sorcererxw/.agents/skills/heroui-react/scripts/get_component_docs.mjs Table`: PASS, reviewed HeroUI `Table` compound API, scroll container, column, row, and cell semantics.
- `pnpm test -- src/domains/article/article-detail-view.test.tsx src/domains/home/intro.test.tsx`: PASS, Vitest config ran the full suite (`35` files, `118` tests); rich-content table tests now assert React Aria `role="columnheader"` and `role="rowheader"` semantics.
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm build`: PASS after moving HeroUI `Table` behind the client rich-content table boundary; build retains existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `rg -n "@/components/ui/table|components/ui/table" src package.json pnpm-lock.yaml`: PASS, no old Table primitive references remain in source or package manifests.
- `curl --max-time 90 -s -o /tmp/blog-heroui-table-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3270/`: PASS, returned `200 text/html; charset=utf-8`; the current live home content did not include a Notion table, so table markup evidence is covered by SSR render tests.
- Browser automation remains blocked in this environment: Node REPL has no Playwright package, and local Chrome/Safari reject JavaScript execution through AppleScript because `Allow JavaScript from Apple Events` is disabled.

## 2026-05-18 HeroUI Feed Tabs State

Current homepage feed filter shape:

- Overview Feed filters use HeroUI `Tabs` imported from `@heroui/react`.
- The rendered filter controls use HeroUI default tab classes such as `tabs`, `tabs__list`, `tabs__tab`, and `tabs__indicator`.
- The tab items still render as `NextLink` anchors with `href` values for `/`, `/?type=writing`, `/?type=projects`, and `/?source=telegram`.
- The old local shadcn/Base UI `src/components/ui/tabs.tsx` file has been deleted.
- There are no remaining source imports of `@/components/ui/tabs`.

Current evidence:

- `node /Users/sorcererxw/.agents/skills/heroui-react/scripts/get_component_docs.mjs Tabs`: PASS, reviewed HeroUI `Tabs` compound API and custom render function guidance.
- `pnpm test -- src/domains/feed/overview-feed-view.test.tsx`: PASS, Vitest config ran the full suite (`35` files, `118` tests).
- `rg -n "@/components/ui/tabs|components/ui/tabs|TabsList|TabsTrigger|TabsContent|tabsListVariants|data-active=\\"true\\"" src package.json pnpm-lock.yaml`: PASS, no old Tabs primitive references remain in source or package manifests.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `curl --max-time 90 -s -o /tmp/blog-heroui-tabs-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3269/ && rg -n 'class="tabs|tabs__list|tabs__tab|tabs__indicator|data-slot="tabs|data-selected="true"|aria-selected="true"|href="/\\?type=writing"|data-active="true"|base-ui-' /tmp/blog-heroui-tabs-home.html`: PASS, returned `200 text/html; charset=utf-8`; rendered HeroUI tabs, retained filter links, selected `All`, and had no `base-ui-` or `data-active="true"` tab markers.
- `curl --max-time 90 -s -o /tmp/blog-heroui-tabs-writing.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3269/?type=writing' && rg -n 'class="tabs|tabs__tab|data-selected="true"|aria-selected="true"|href="/\\?type=writing"|data-active="true"|base-ui-' /tmp/blog-heroui-tabs-writing.html`: PASS, returned `200 text/html; charset=utf-8`; selected `Writing` through HeroUI `data-selected="true"` / `aria-selected="true"`.
- `curl --max-time 90 -s -o /tmp/blog-heroui-tabs-projects.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3269/?type=projects' && rg -n 'class="tabs|tabs__tab|data-selected="true"|aria-selected="true"|href="/\\?type=projects"|data-active="true"|base-ui-' /tmp/blog-heroui-tabs-projects.html`: PASS, returned `200 text/html; charset=utf-8`; selected `Projects` through HeroUI `data-selected="true"` / `aria-selected="true"`.
- Browser automation remains blocked in this environment: Node REPL has no Playwright package, and local Chrome/Safari reject JavaScript execution through AppleScript because `Allow JavaScript from Apple Events` is disabled. HTTP-level rendered markup checks above cover the migrated SSR output and link fallback.

## 2026-05-18 HeroUI Chip Feed Label State

Current homepage feed label shape:

- Overview Feed labels use HeroUI `Chip` imported from `@heroui/react`.
- The rendered feed label uses HeroUI default chip classes such as `chip chip--default chip--secondary` and `data-slot="chip"`.
- The old local shadcn/Base UI `src/components/ui/badge.tsx` file has been deleted.
- There are no remaining source imports of `@/components/ui/badge`.

Current evidence:

- `node /Users/sorcererxw/.agents/skills/heroui-react/scripts/get_component_docs.mjs Badge`: PASS, reviewed HeroUI guidance that `Badge` is for anchored indicators and standalone labels should use `Chip`.
- `node /Users/sorcererxw/.agents/skills/heroui-react/scripts/get_component_docs.mjs Chip`: PASS, reviewed HeroUI `Chip` usage, default variants, and CSS classes.
- `pnpm test -- src/domains/feed/overview-feed-view.test.tsx`: PASS, Vitest config ran the full suite (`35` files, `118` tests).
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `rg -n "@/components/ui/badge|components/ui/badge|<Badge|Badge\\b|badgeVariants|data-slot=\\"badge\\"|data-variant=\\"secondary\\"" src package.json pnpm-lock.yaml`: PASS, no old Badge primitive references remain in source or dependency manifests; article author CSS class names are unrelated and outside the primitive migration.
- `curl --max-time 90 -s -o /tmp/blog-heroui-chip-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3268/ && rg -n 'class="[^\"]*chip|chip__label|Writing|Telegram|data-slot="badge"|@heroui|href="/\\?type=writing"' /tmp/blog-heroui-chip-home.html`: PASS, returned `200 text/html; charset=utf-8` and homepage markup included HeroUI chip output with no `data-slot="badge"`.
- `curl --max-time 90 -s -o /tmp/blog-heroui-chip-writing.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3268/?type=writing' && rg -n 'class="[^\"]*chip|chip__label|Writing|data-slot="badge"|href="/articles/' /tmp/blog-heroui-chip-writing.html`: PASS, returned `200 text/html; charset=utf-8` and writing filter markup included HeroUI chip output with no `data-slot="badge"`.
- Browser automation: attempted with Node REPL Playwright and local Chrome/Safari AppleScript. Playwright was unavailable in the Node REPL environment, and both Chrome and Safari rejected JavaScript execution because Apple Events JavaScript is disabled in browser settings. HTTP-level rendered markup checks above cover the migrated SSR output.

## 2026-05-18 Homepage Feed Card Text Color State

Current homepage card text shape:

- Overview Feed card body copy uses `text-foreground`.
- Overview Feed rich-text quotes use `text-foreground`.
- Overview Feed timestamps use `text-foreground`.
- Feed labels now use HeroUI `Chip`; label component styling is separate from card body text.

Current evidence:

- `pnpm test -- src/domains/feed/overview-feed-view.test.tsx`: PASS, Vitest config ran the full suite (`35` files, `118` tests)
- `pnpm lint`: PASS
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings
- `curl --max-time 90 -s -o /tmp/blog-card-text-color-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3262/ && rg -n 'text-muted-foreground|text-foreground|data-slot="card"' /tmp/blog-card-text-color-home.html`: PASS, feed card summaries and times used `text-foreground`
- Headless Chrome verification at `http://127.0.0.1:3262/`: PASS, first rendered feed-card paragraph and time computed to `--foreground`, hydrated masonry remained active, and there was no horizontal overflow; screenshot saved to `/tmp/blog-card-text-color-home.png`

## 2026-05-18 Homepage Feed Card Border State

Current homepage card frame shape:

- Overview Feed modules render with the shared Card primitive plus explicit `border border-border`.
- The shared shadcn Card primitive remains unchanged; the border restoration is scoped to homepage feed modules.

Current evidence:

- `pnpm test -- src/domains/feed/overview-feed-view.test.tsx`: PASS, Vitest config ran the full suite (`35` files, `118` tests)
- `pnpm lint`: PASS
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings
- `pnpm typecheck`: PASS after rerunning separately from build
- `curl --max-time 90 -s -o /tmp/blog-card-border-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3261/ && rg -n 'border-border|data-slot="card"|data-overview-feed' /tmp/blog-card-border-home.html`: PASS, homepage feed card markup included `border border-border`
- Headless Chrome verification at `http://127.0.0.1:3261/`: PASS, rendered `138` Overview Feed cards, first card computed `1px solid` top border, hydrated masonry remained active, and there was no horizontal overflow; screenshot saved to `/tmp/blog-card-border-home.png`

## 2026-05-18 Browser Tab Title State

Current browser-title shape:

- `/` emits the exact browser tab title `sorcererxw`.
- `/articles/[slug]` emits `{article title} | sorcererxw`.
- shared SEO site metadata uses `sorcererxw` as the canonical site name.

Current evidence:

- `pnpm test -- src/domains/seo/build-seo.test.ts src/domains/seo/build-structured-data.test.ts src/app/seo.test.tsx`: PASS, Vitest config ran the full suite (`35` files, `118` tests)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings
- `curl --max-time 90 -s -o /tmp/blog-title-home.html -w 'home %{http_code} %{content_type}\n' http://127.0.0.1:3257/ && rg -o '<title>[^<]+</title>' /tmp/blog-title-home.html`: PASS, returned `<title>sorcererxw</title>`
- `curl --max-time 90 -s -o /tmp/blog-title-article.html -w 'article %{http_code} %{content_type}\n' http://127.0.0.1:3257/articles/stop-migrate-nextjs-to-astro && rg -o '<title>[^<]+</title>' /tmp/blog-title-article.html`: PASS, returned `<title>放弃从 Next.js 迁移到 Astro.js | sorcererxw</title>`
- Browser verification at `http://127.0.0.1:3257/` and `/articles/stop-migrate-nextjs-to-astro`: PASS, `document.title` matched and recent app console logs had no warnings/errors

## 2026-05-18 Brand Favicon State

Current favicon shape:

- route metadata produced through `src/app/seo.tsx` emits `/favicon.svg` as both `rel="shortcut icon"` and `rel="icon"`
- the header brand image continues to use the same `/favicon.svg` asset

Current evidence:

- `pnpm test -- src/app/seo.test.tsx src/domains/seo/build-seo.test.ts`: PASS, Vitest config ran the full suite (`35` files, `115` tests)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings
- `curl --max-time 90 -s -o /tmp/blog-favicon-home-3250.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3250/ && rg -n 'rel="(icon|shortcut icon)"|href="/favicon.svg"|favicon' /tmp/blog-favicon-home-3250.html`: PASS, homepage head included `/favicon.svg` as both favicon links
- `curl --max-time 20 -s -I http://127.0.0.1:3250/favicon.svg`: PASS, returned `200 OK` with `Content-Type: image/svg+xml`
- Browser verification at `http://127.0.0.1:3250/`: PASS, document head exposed both favicon links, header logo still rendered from `/favicon.svg`, and the homepage rendered normally

## 2026-05-18 Tailwind Token Lint State

Current styling guardrail:

- `eslint.config.mjs` rejects arbitrary Tailwind font size, tracking, leading, padding, margin, gap, rounded, and ring utilities in string and template literal class tokens outside `src/components/ui/`.
- Existing app/domain source classes use named Tailwind tokens for those categories.
- `src/components/ui/` is exempt as the shadcn/base UI layer; its primitive defaults were restored after the exemption was added.
- Other arbitrary Tailwind utilities are still allowed where the current Tailwind convergence spec permits them.

Current evidence:

- `pnpm lint`: PASS.
- `pnpm test`: PASS (`34` files, `114` tests).
- `pnpm typecheck`: PASS after `pnpm build`; the first parallel run raced `.next/types` generation and failed with missing generated route type files.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `curl --max-time 20 -s -o /tmp/blog-rounded-ring-lint-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3219/`: PASS, returned `200 text/html; charset=utf-8`.
- `curl --max-time 20 -s -o /tmp/blog-rounded-ring-lint-writing.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3219/?type=writing'`: PASS, returned `200 text/html; charset=utf-8`.
- `curl --max-time 20 -s -o /tmp/blog-rounded-ring-lint-projects.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3219/?type=projects'`: PASS, returned `200 text/html; charset=utf-8`.
- Browser verification at `http://127.0.0.1:3219/`, `/?type=writing`, and `/?type=projects`: PASS, no horizontal overflow and no console errors; homepage rendered `58` article/card elements, writing rendered `42` article links, and projects rendered without browser errors.

Previous evidence:

- `rg -n "text-\\[[^\\]]+\\]" src eslint.config.mjs`: PASS, no matches before expanding the guard.
- `curl --max-time 20 -s -o /tmp/blog-token-lint-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3218/`: PASS, returned `200 text/html; charset=utf-8`.
- `curl --max-time 20 -s -o /tmp/blog-token-lint-writing.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3218/?type=writing'`: PASS, returned `200 text/html; charset=utf-8`.
- `curl --max-time 20 -s -o /tmp/blog-token-lint-projects.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3218/?type=projects'`: PASS, returned `200 text/html; charset=utf-8`.
- Browser verification at `http://127.0.0.1:3218/`, `/?type=writing`, and `/?type=projects`: PASS, no horizontal overflow and no console errors; homepage rendered `58` article/card elements, writing rendered `42` article links, and projects rendered without browser errors.
- `pnpm test`: PASS (`34` files, `114` tests).
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `pnpm typecheck`: PASS after `pnpm build`; the first parallel run raced `.next/types` generation and failed with missing generated route type files.
- `curl --max-time 20 -s -o /tmp/blog-tailwind-lint-home.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3217/`: PASS, returned `200 text/html; charset=utf-8`.
- `curl --max-time 20 -s -o /tmp/blog-tailwind-lint-writing.html -w '%{http_code} %{content_type}\n' 'http://127.0.0.1:3217/?type=writing'`: PASS, returned `200 text/html; charset=utf-8`.
- Browser verification at `http://127.0.0.1:3217/`: PASS, rendered `58` article/card elements, no horizontal overflow, and no console errors.
- Browser verification at `http://127.0.0.1:3217/?type=writing`: PASS, rendered `42` article detail links, no horizontal overflow, and no console errors.

## 2026-05-18 Provider KV Cache State

Current provider cache shape:

- Public route assembly wraps external providers with `BLOG_CACHE` provider wrappers.
- Notion home, article list, project list, article detail, stack, and Telegram thoughts wrappers use explicit provider cache keys.
- Provider wrappers use a `600` second TTL and revive cached `Date` values from JSON.
- Provider internals remain responsible only for source fetch and normalization; they do not own KV policy.
- Missing `BLOG_CACHE` falls back to direct provider calls.

Current evidence:

- `pnpm test -- src/integrations/kv/provider-cache.test.ts src/integrations/kv/provider-wrappers.test.ts`: PASS, Vitest config ran the full suite (`34` files, `114` tests).
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings.
- `pnpm exec opennextjs-cloudflare build`: PASS, worker saved to `.open-next/worker.js`; existing non-fatal copy logs for `hast-util-to-html`, `hast-util-whitespace`, and `property-information` remain.
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3252`: PASS.
- `curl --max-time 120 -s -o /tmp/blog-provider-cache-home-cold.html -w 'home-cold http=%{http_code} total=%{time_total} starttransfer=%{time_starttransfer} size=%{size_download}\n' http://127.0.0.1:3252/ && curl --max-time 120 -s -o /tmp/blog-provider-cache-home-warm.html -w 'home-warm http=%{http_code} total=%{time_total} starttransfer=%{time_starttransfer} size=%{size_download}\n' http://127.0.0.1:3252/`: PASS, returned `200`; measured `0.466s` then `0.062s` locally.
- `curl --max-time 120 -s -o /tmp/blog-provider-cache-writing.html -w 'writing http=%{http_code} total=%{time_total} starttransfer=%{time_starttransfer} size=%{size_download}\n' 'http://127.0.0.1:3252/?type=writing'`: PASS, returned `200` in `0.464s` locally.
- `curl --max-time 60 -s -o /tmp/blog-provider-cache-sitemap.xml -w 'sitemap http=%{http_code} total=%{time_total} starttransfer=%{time_starttransfer} size=%{size_download}\n' http://127.0.0.1:3252/sitemap.xml`: PASS, returned `200` in `0.326s` locally.
- `curl --max-time 60 -s -o /tmp/blog-provider-cache-article.html -w 'article http=%{http_code} total=%{time_total} starttransfer=%{time_starttransfer} size=%{size_download}\n' http://127.0.0.1:3252/articles/stop-migrate-nextjs-to-astro`: PASS, returned `200` in `2.690s` locally.
- `curl --max-time 60 -s -o /tmp/blog-provider-cache-article-warm.html -w 'article-warm http=%{http_code} total=%{time_total} starttransfer=%{time_starttransfer} size=%{size_download}\n' http://127.0.0.1:3252/articles/stop-migrate-nextjs-to-astro`: PASS, returned `200` in `0.014s` locally.
- Browser verification: not run for this slice because no user-visible UI behavior changed; route behavior was checked with HTTP requests.

## 2026-05-18 Sitewide SEO/GEO State

Current route shape:

- `/` emits `WebSite`, `Person`, `CollectionPage`, and capped `ItemList` JSON-LD for the Personal Site overview.
- `Person` and website publisher structured data include the public GitHub, Jike, and Telegram identity links.
- `/sitemap.xml` remains runtime-generated and lists `/` plus article detail URLs only; article entries include Notion article dates as `<lastmod>`.
- `public/robots.txt` keeps `/api/` disallowed and explicitly names common AI crawlers with the same policy.
- `public/llms.txt` provides a concise AI-readable guide to canonical surfaces and route rules.
- SEO/GEO route checks are recorded as direct HTTP metadata and JSON-LD inspection commands instead of a persistent repo script.

Current evidence:

- `pnpm test -- src/domains/seo/build-structured-data.test.ts src/domains/seo/build-seo.test.ts src/app/sitemap.xml/route.test.ts`: PASS, Vitest config ran the full suite (`32` files, `108` tests)
- `pnpm test -- src/domains/seo/build-structured-data.test.ts src/app/sitemap.xml/route.test.ts`: PASS, Vitest config ran the full suite (`32` files, `108` tests)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings
- `pnpm exec opennextjs-cloudflare build`: PASS, worker saved to `.open-next/worker.js`; existing non-fatal copy logs for `hast-util-to-html`, `hast-util-whitespace`, and `property-information` remain
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3241`: PASS
- `curl --max-time 90 -s -o /tmp/blog-seo-home-3241.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3241/` plus JSON-LD parsing: PASS, returned `200 text/html; charset=utf-8`, JSON-LD types were `WebSite`, `Person`, `CollectionPage`, and `ItemList`, `ItemList` length was `50`, and `sameAs` listed GitHub, Jike, and Telegram.
- `curl --max-time 20 -s -o /tmp/blog-seo-robots-3241.txt -w '%{http_code} %{content_type}\n' http://127.0.0.1:3241/robots.txt && rg -n 'GPTBot|ChatGPT-User|ClaudeBot|anthropic-ai|PerplexityBot|CCBot|Sitemap:' /tmp/blog-seo-robots-3241.txt`: PASS
- `curl --max-time 20 -s -o /tmp/blog-llms-3241.txt -w '%{http_code} %{content_type}\n' http://127.0.0.1:3241/llms.txt && rg -n 'Canonical Surfaces|sitemap.xml|robots.txt|/blog|/api/' /tmp/blog-llms-3241.txt`: PASS
- `curl --max-time 90 -s -o /tmp/blog-sitemap-3241.xml -w '%{http_code} %{content_type}\n' http://127.0.0.1:3241/sitemap.xml && rg -n '<loc>|<lastmod>' /tmp/blog-sitemap-3241.xml`: PASS, returned `200 application/xml; charset=utf-8` with article `<lastmod>` values.
- `! rg -n '/blog|/projects|/thoughts|/topics|\?type=' /tmp/blog-sitemap-3241.xml && echo 'sitemap exclusions PASS'`: PASS
- `curl --max-time 30 -s -o /tmp/blog-boundary-3241.html -w '%{http_code} %{content_type}\n' http://127.0.0.1:3241/blog`: PASS, returned `404 text/html; charset=utf-8` with `noindex` robots and not-found content.
- Direct metadata checks for `/`, `/?type=writing`, `/?type=projects`, `/?source=telegram`, `/blog`, and `/articles/stop-migrate-nextjs-to-astro`: PASS, homepage filter states canonicalized to `/`, `/blog` returned `404` with `noindex`, and the article detail exposed canonical indexable metadata.
- Browser verification at `http://127.0.0.1:3241/`: PASS, rendered homepage and Overview Feed, JSON-LD types matched the HTTP parse, ItemList length was `50`, no horizontal overflow, and no console errors; screenshot saved to `/tmp/blog-sitewide-seo-home.png`.

## 2026-05-17 Sitemap Runtime Build Guard State

Current route shape:

- `/sitemap.xml` is explicitly runtime-generated with `dynamic = "force-dynamic"`.
- The route keeps `revalidate = 600`.
- Cloudflare build environments without `NOTION_SECRET` may warn about the missing required secret but must not fail during `next build`.
- Runtime requests still require valid Notion configuration to list current article URLs.

Current evidence:

- `pnpm test -- src/app/sitemap.xml/route.test.ts`: PASS, Vitest config ran the full suite (`32` files, `108` tests)
- `pnpm build`: PASS, route table marks `/sitemap.xml` as dynamic
- `tmp=.dev.vars.codex-build-backup; mv .dev.vars "$tmp"; pnpm build; rc=$?; mv "$tmp" .dev.vars; exit $rc`: PASS, build succeeded without local `NOTION_SECRET`; Wrangler emitted missing-secret warnings, and `/sitemap.xml` stayed dynamic
- `pnpm exec opennextjs-cloudflare build`: PASS, worker saved to `.open-next/worker.js`; existing non-fatal copy logs for `hast-util-to-html`, `hast-util-whitespace`, and `property-information` remain
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3234`: PASS
- `curl --max-time 30 -s -o /tmp/blog-sitemap-runtime.xml -w '%{http_code} %{content_type}\n' http://127.0.0.1:3234/sitemap.xml && rg -n '<loc>|/blog|/projects|/thoughts|/topics|/en|/zh' /tmp/blog-sitemap-runtime.xml`: PASS, returned `200 application/xml; charset=utf-8` and listed only `/` plus article URLs in the checked output
- `curl --max-time 20 -I http://127.0.0.1:3234/sitemap.xml`: PASS, returned `200 OK`, `Content-Type: application/xml; charset=utf-8`, and `x-opennext: 1`
- Browser verification: not applicable for this XML route/build classification fix

## Overview Feed Layout Verification

Current target shape:

- Content sources provide standard Feed Items and do not provide Module Size, card height, column placement, or masonry estimates.
- The server-rendered Overview Feed uses a single-column fallback in Overview Feed Index order.
- Hydrated tablet and desktop views use the browser-side Feed Layout Engine to calculate Layout Estimates and assign masonry columns.
- The Feed Layout Engine uses Pretext for variable text measurement, media intrinsic ratios or fallback ratios, Presentation Intent, and fixed Feed Module chrome constants.
- Browser resize and filter changes should recalculate layout without relying on DOM height measurement.

Required evidence for layout changes:

- targeted layout unit tests covering width-dependent Layout Estimates, column assignment, and stable item ordering
- DOM or component tests proving the server fallback does not expose source-owned masonry estimates
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `curl` check for `/`
- browser verification for `/` and `/?source=telegram`, including no horizontal overflow, no card overlap, stable filter reflow, stable responsive resize behavior, and no console layout or hydration errors

## 2026-05-17 Telegram Public Page Runtime Ingestion State

Current content shape:

- `listThoughts()` fetches `https://t.me/s/tech_bb` at render time and passes `next.revalidate = 600`.
- The crawler follows public Telegram `before` pagination until exhausted, dedupes message ids, and sorts newest first.
- Telegram parsing uses DOM selectors over `.tgme_widget_message_wrap` and extracts rich text, direct photos, link previews, replies, forwards, and reactions.
- Telegram feed media uses `ResponsiveRemoteImage` with canonical `/media/[id]` URLs for volatile `cdn*.telesco.pe` images. Stable non-canonical image hosts still use the Cloudflare image loader's `/cdn-cgi/image` transform path.
- `sync:thoughts`, checked-in `thoughts.snapshot.json`, Telegram client code, `@mtcute/*`, and `TELEGRAM_SESSION` are not part of the active source/config path.

Current evidence:

- `rg -n "thoughts\\.snapshot|sync:thoughts|syncThoughts|createLiveThoughtLoader|@mtcute|TELEGRAM_SESSION|TelegramClient|mtcute-thoughts" package.json pnpm-lock.yaml src scripts || true`: PASS, no active source/config matches
- `pnpm test`: PASS (`31` files, `103` tests)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS, with existing Wrangler experimental `secrets` and Next `middleware` deprecation warnings
- `pnpm exec opennextjs-cloudflare build`: PASS, worker saved to `.open-next/worker.js`; existing non-fatal copy logs for `hast-util-to-html`, `hast-util-whitespace`, and `property-information` remain
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3225`: PASS
- `curl --max-time 90 -s 'http://127.0.0.1:3225/?source=telegram' ...`: PASS, rendered `87` unique `tech_bb` Telegram ids, first ids were `111, 107, 106, 104, 103`, newest-first check passed, `163` image tags were present, rich text external links were present, and the Telegram filter was present
- `curl --max-time 30 -s -D /tmp/blog-first-image.headers -o /tmp/blog-first-image.bin 'http://127.0.0.1:3225/media/879bc8db94035330?...'`: PASS, returned `200 OK`, `Content-Type: image/jpeg`, `X-Blog2-Canonical-Media: 1`, and a `95,533` byte JPEG
- Headless Chrome verification at `http://127.0.0.1:3225/?source=telegram`: PASS, captured `/tmp/blog-telegram-runtime-fixed.png`, active Telegram tab rendered, `87` unique Telegram cards were present, newest-first check passed, `163` image elements were present, `/media/` image paths were present, and visible Telegram images rendered without the earlier local `/cdn-cgi/image` broken-image issue

## 2026-05-17 Notion Public Read Path State

Current content shape:

- `.dev.vars` supplies local `NOTION_SECRET`.
- `wrangler.jsonc` supplies `NOTION_BLOG_DATABASE_ID` for the public writing feed, `NOTION_PROJECTS_DATABASE_ID` for projects, and `NOTION_INTRO_PAGE_ID` for the homepage intro.
- The homepage owns the public list surface; there is no `/blog` route or `/blog` compatibility redirect.
- Writing entries link to `/articles/[slug]`.
- Notion page covers render on writing feed cards, article detail hero images, Open Graph metadata, and structured data.
- Notion adapters do not return runtime synthetic content; production fails fast on missing required Notion configuration, while non-production can render empty states.
- `.dev.vars.example` uses a placeholder secret value only.

Current evidence:

- `awk -F= '/^(NOTION_SECRET|NOTION_BLOG_DATABASE_ID|NOTION_PROJECTS_DATABASE_ID|NOTION_INTRO_PAGE_ID)=/ { printf "%s=<set>\n", $1 }' .dev.vars`: PASS, local secret file is present without printing values
- `rg -n "NOTION_BLOG_DATABASE_ID|NOTION_PROJECTS_DATABASE_ID|NOTION_INTRO_PAGE_ID" wrangler.jsonc`: PASS, all Notion IDs are configured as Wrangler vars
- `pnpm cf-typegen`: PASS, generated `cloudflare-env.d.ts` includes all Notion ID vars
- `pnpm test -- src/integrations/notion/articles.test.ts src/integrations/notion/article-detail.test.ts src/integrations/notion/home.test.ts src/domains/home/intro.test.tsx src/domains/feed/overview-feed.test.ts src/domains/feed/overview-feed-view.test.tsx src/domains/article/article-detail-view.test.tsx src/domains/shell/site-shell.test.tsx src/domains/seo/build-structured-data.test.ts src/domains/seo/build-seo.test.ts src/middleware.test.ts`: PASS (`31` files, `100` tests)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS after pinning the build script to `next build --webpack`; Turbopack failed earlier on local Google font fetches, while webpack produced a valid build
- `pnpm exec opennextjs-cloudflare build`: PASS, worker saved to `.open-next/worker.js`; existing non-fatal copy logs for `hast-util-to-html`, `hast-util-whitespace`, and `property-information` remain
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3213`: PASS, preview reported `Using secrets defined in .dev.vars` and listed `NOTION_BLOG_DATABASE_ID`, `NOTION_PROJECTS_DATABASE_ID`, `NOTION_INTRO_PAGE_ID`, and hidden `NOTION_SECRET`
- `curl -s http://127.0.0.1:3213/`: PASS, returned the Notion intro and real `source:"notion"` writing items with cover image URLs
- `curl -s http://127.0.0.1:3213/?type=writing`: PASS, returned the Writing filter with real `/articles/...` links and cover images
- `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://127.0.0.1:3213/articles/stop-migrate-nextjs-to-astro`: `200`
- `curl -s http://127.0.0.1:3213/articles/stop-migrate-nextjs-to-astro | rg -n "放弃从 Next\\.js|og:image|Back to writing|/cdn-cgi/image|images.unsplash|<article|<img"`: PASS, detail page includes title, Notion body, detail cover, `og:image`, and return link to `/?type=writing`
- `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://127.0.0.1:3213/blog`: `404`, no redirect URL
- `curl -I http://127.0.0.1:3213/articles/not-exist-slug`: `404 Not Found`
- `curl -s http://127.0.0.1:3213/sitemap.xml | rg -n '<loc>|/blog|/projects|/thoughts|\?type='`: PASS, sitemap lists `/` and real `/articles/...` URLs only
- Browser verification on `http://127.0.0.1:3213/`: PASS, rendered Notion intro, Overview feed, `126` article links, first cover image, and no horizontal overflow
- Browser verification on `http://127.0.0.1:3213/?type=writing`: PASS, Writing filter active, `126` article links, `126` article images, and no horizontal overflow
- Browser verification on `http://127.0.0.1:3213/articles/stop-migrate-nextjs-to-astro`: PASS, rendered article title/body, detail cover via `/cdn-cgi/image/...`, `og:image`, `Back to writing`, and no horizontal overflow
- Browser verification on `http://127.0.0.1:3213/blog`: PASS, stayed on `/blog`, rendered not-found content, exposed `/?type=writing`, and had no horizontal overflow
- Browser screenshots were captured at `/tmp/blog-notion-writing.png`, `/tmp/blog-notion-detail.png`, and `/tmp/blog-notion-404.png`.

## 2026-05-17 Next Font State

Current font shape:

- `src/app/layout.tsx` owns font loading through `next/font/google`.
- `Outfit`, `Instrument Sans`, `Newsreader`, and `Roboto Slab` are exposed as CSS variables on `<html>`.
- `src/app/globals.css` maps Tailwind theme font tokens to those variables and keeps only the local monospace fallback as a handwritten font stack.
- The app should not emit external `fonts.googleapis.com` or `fonts.gstatic.com` stylesheet links.

Current evidence:

- `rg -n "fonts\\.googleapis|fonts\\.gstatic|family=Instrument|family=Newsreader|--font-sans-system:|--font-ui-system:|--font-editorial-system:|Roboto Slab" src/app src/domains -S`: PASS, no active source references to the old font loading scheme remain
- `pnpm test -- src/domains/shell/site-shell.test.tsx src/domains/home/intro.test.tsx`: PASS (`29` files, `96` tests; Vitest config ran the broad suite)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS, with existing local warnings for experimental Wrangler `secrets`, missing local `NOTION_SECRET`, and Next's deprecated `middleware` file convention
- `pnpm start --port 3211` + `curl --max-time 20 -s http://127.0.0.1:3211/ | rg -n "fonts\\.googleapis|fonts\\.gstatic|__className|__variable|_next/static/media|font-sans|sorcererxw|Profile|Overview" -S`: PASS, HTML renders Next Font variable classes and no Google Fonts external links
- `find .next/static/media -maxdepth 1 -type f`: PASS, local `.woff2` font assets were generated
- `rm -rf .next .open-next .wrangler tsconfig.tsbuildinfo && pnpm typecheck`: PASS after cleaning generated build artifacts

## 2026-05-17 Wrangler Env State

Current env shape:

- `wrangler.jsonc` owns runtime variable definitions.
- `APP_ENV` and `PUBLIC_SITE_URL` are defined under `vars`.
- `NOTION_SECRET` is defined as a required Wrangler secret binding.
- `cloudflare-env.d.ts` is generated from `wrangler.jsonc`.
- `src/config/**` is removed; runtime code reads Worker env through `src/lib/cloudflare-env.ts`.

Current evidence:

- `pnpm cf-typegen`: PASS, generated `cloudflare-env.d.ts` from `wrangler.jsonc`; Wrangler warned that `secrets` is experimental
- `rg -n "@/config|src/config|config/runtime|config/server|config/env|getRuntimeConfig|NotionSecret|getRequiredEnv|getOptionalEnv|process\\.env" src package.json wrangler.jsonc cloudflare-env.d.ts -S`: PASS, no current source/config references remain
- `pnpm test -- src/lib/cloudflare-env.ts src/app/api/health/route.test.ts src/integrations/notion/projects.test.ts src/integrations/notion/article-detail.test.ts`: PASS (`29` files, `96` tests; Vitest config ran the broad suite)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS, with expected local warnings for experimental Wrangler `secrets`, missing local `NOTION_SECRET`, and Next's deprecated `middleware` file convention
- `pnpm exec opennextjs-cloudflare build`: PASS, worker saved to `.open-next/worker.js`; same expected local warnings plus existing non-fatal copy logs for `hast-util-to-html`, `hast-util-whitespace`, and `property-information`
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3208`: PASS, preview listed `env.APP_ENV` and `env.PUBLIC_SITE_URL` as environment variables
- `curl --max-time 20 -I http://127.0.0.1:3208/`: `200 OK`, `x-opennext: 1`
- `curl --max-time 20 -i http://127.0.0.1:3208/api/health`: `200 OK`, runtime mode `production`
- `curl --max-time 20 -s http://127.0.0.1:3208/sitemap.xml | rg -n 'https://sorcererxw.com|<loc>'`: PASS, sitemap URLs use the Wrangler `PUBLIC_SITE_URL` value
- `curl --max-time 20 -I http://127.0.0.1:3208/blog`: `308 Permanent Redirect` to `/?type=writing`
- `rm -rf .next .wrangler .open-next tsconfig.tsbuildinfo && test ! -e .next && test ! -e .wrangler && test ! -e .open-next && test ! -e tsconfig.tsbuildinfo`: PASS, generated artifacts removed after verification
- `pnpm typecheck`: PASS after generated artifacts were removed

## 2026-05-17 Custom Worker Entrypoint State

Current route shape:

- `src/worker.ts` is the checked-in Cloudflare Worker entrypoint.
- `src/worker.ts` delegates fetch handling to OpenNext-generated `.open-next/worker.js`.
- `wrangler.jsonc` points `main` at `src/worker.ts`; static assets still come from `.open-next/assets`.

Current evidence:

- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm test`: PASS (`31` files, `100` tests)
- `pnpm build`: PASS
- `pnpm exec opennextjs-cloudflare build`: PASS, worker saved to `.open-next/worker.js`; existing non-fatal copy logs for `hast-util-to-html`, `hast-util-whitespace`, and `property-information` remain
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3205`: PASS, preview served through `src/worker.ts`
- `curl --max-time 20 -I http://127.0.0.1:3205/`: `200 OK`, `x-opennext: 1`
- `curl --max-time 20 -I http://127.0.0.1:3205/blog`: `308 Permanent Redirect` to `/?type=writing`
- `curl --max-time 20 -i http://127.0.0.1:3205/api/health`: `200 OK`
- `curl --max-time 20 -s http://127.0.0.1:3205/robots.txt`: PASS, includes `Sitemap: https://sorcererxw.com/sitemap.xml`
- `rm -rf .next .wrangler .open-next tsconfig.tsbuildinfo && test ! -e .next && test ! -e .wrangler && test ! -e .open-next && test ! -e tsconfig.tsbuildinfo`: PASS, generated artifacts removed after verification
- `pnpm typecheck`: PASS after generated artifacts were removed, proving `src/worker.ts` also typechecks before `.open-next/worker.js` exists

## 2026-05-17 Middleware Redirect State

Current route shape:

- `src/middleware.ts` owns `/blog`, `/projects`, `/thoughts`, `/en/**`, and `/zh/**` compatibility redirects.
- Redirect mapping and destination serialization live directly in `src/middleware.ts`.
- Pure redirect handlers under `src/app/blog`, `src/app/projects`, `src/app/thoughts`, `src/app/en`, and `src/app/zh` are removed.
- `src/lib/legacy-redirects.ts` and `src/lib/legacy-redirects.test.ts` are removed.

Current evidence:

- `pnpm test -- src/middleware.test.ts`: PASS (`31` files, `99` tests; Vitest config ran the full suite)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS, route table no longer lists `/blog`, `/projects`, `/thoughts`, `/en`, or `/zh`; it lists `Proxy (Middleware)`
- `pnpm exec opennextjs-cloudflare build`: PASS, worker saved to `.open-next/worker.js`; existing non-fatal copy logs for `hast-util-to-html`, `hast-util-whitespace`, and `property-information` remain
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3207`: PASS
- `curl --max-time 20 -I http://127.0.0.1:3207/blog`: `308 Permanent Redirect` to `/?type=writing`
- `curl --max-time 20 -I http://127.0.0.1:3207/projects`: `308 Permanent Redirect` to `/?type=projects`
- `curl --max-time 20 -I http://127.0.0.1:3207/thoughts`: `308 Permanent Redirect` to `/?type=social`
- `curl --max-time 20 -I http://127.0.0.1:3207/en`: `308 Permanent Redirect` to `/`
- `curl --max-time 20 -I http://127.0.0.1:3207/zh/articles/modern-astro`: `308 Permanent Redirect` to `/articles/modern-astro`
- `curl --max-time 20 -I http://127.0.0.1:3207/articles/modern-astro`: `200 OK`, `x-opennext: 1`
- `find src/app/blog src/app/projects src/app/thoughts src/app/en src/app/zh -type f 2>/dev/null | sort`: PASS, no redirect route files remain
- `rm -rf .next .wrangler .open-next tsconfig.tsbuildinfo && test ! -e .next && test ! -e .wrangler && test ! -e .open-next && test ! -e tsconfig.tsbuildinfo`: PASS, generated artifacts removed after verification
- `pnpm typecheck`: PASS after generated artifacts were removed
- Note: Next.js `16.2.6` emits a deprecation warning for the `middleware` file convention and recommends `proxy`; this slice keeps `src/middleware.ts` because the requested implementation target was middleware.

## 2026-05-15 Wrangler Binding State

Current binding shape:

- `BLOG_CACHE` remains for canonical media KV caching in `/media/[id]`.
- `ASSETS` remains for OpenNext/Cloudflare static asset serving.
- `NOTION_SECRET` remains as the only generated string secret binding.
- `SESSION` and Telegram Worker secret bindings are removed from current config and generated types.

Current evidence:

- `pnpm cf-typegen`: PASS, generated `cloudflare-env.d.ts` with `BLOG_CACHE`, `ASSETS`, and `NOTION_SECRET`
- `rg -n "SESSION|TELEGRAM_APP_ID|TELEGRAM_APP_SECRET|TELEGRAM_BOT|TELEGRAM_TOKEN|TelegramAppID|TelegramAppSecret|TelegramBot|TelegramToken" wrangler.jsonc .dev.vars.example cloudflare-env.d.ts src docs/specs/2026-05-13-opennext-nextjs-rebuild-design.md docs/plans/2026-05-13-opennext-nextjs-rebuild.md`: PASS, no current config or source references remain
- `pnpm test -- src/lib/legacy-redirects.test.ts 'src/app/media/[id]/route.test.ts' src/config/env.test.ts`: PASS (`31` files, `100` tests; Vitest config ran the full suite)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS
- `pnpm exec opennextjs-cloudflare build`: PASS, worker saved to `.open-next/worker.js`; existing non-fatal copy logs for `hast-util-to-html`, `hast-util-whitespace`, and `property-information` remain
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3204`: PASS, preview listed only `env.BLOG_CACHE` and `env.ASSETS` bindings
- `curl --max-time 20 -I http://127.0.0.1:3204/blog`: `308 Permanent Redirect` to `/?type=writing`
- `curl --max-time 20 -I http://127.0.0.1:3204/projects`: `308 Permanent Redirect` to `/?type=projects`
- `curl --max-time 20 -I http://127.0.0.1:3204/thoughts`: `308 Permanent Redirect` to `/?type=social`
- `curl --max-time 20 -I http://127.0.0.1:3204/zh/articles/modern-astro`: `308 Permanent Redirect` to `/articles/modern-astro`
- `rm -rf .next .wrangler .open-next tsconfig.tsbuildinfo && test ! -e .next && test ! -e .wrangler && test ! -e .open-next && test ! -e tsconfig.tsbuildinfo`: PASS, generated artifacts removed after verification

## 2026-05-15 shadcn Feed UI State

Superseded by the 2026-05-18 HeroUI component migration entries above. This section is retained as historical evidence for the earlier shadcn state.

Current UI primitive shape:

- the Overview Feed filter control uses local shadcn Tabs
- feed module frames use the local shadcn Card component
- feed labels use the local shadcn Badge component
- HeroUI package imports and the HeroUI stylesheet are removed

Current evidence:

- `rg -n "@heroui|from ['\"]@heroui|@import ['\"]@heroui|Surface|Tabs\\.List|Tabs\\.Tab|Badge\\.Label" src package.json pnpm-lock.yaml`: PASS, no source or dependency references remain
- `pnpm install --lockfile-only`: PASS
- `pnpm test -- src/domains/feed/overview-feed-view.test.tsx src/proxy.test.ts src/app/sitemap.xml/route.test.ts`: PASS (`31` files, `99` tests; Vitest config ran the full suite)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS
- `curl -I http://127.0.0.1:3100/`: `200 OK`
- `curl -I http://127.0.0.1:3100/blog`: `308 Permanent Redirect` to `/?type=writing`
- Chrome browser verification at `http://127.0.0.1:3100/?type=writing`: PASS, shadcn tab group rendered, Writing tab selected, feed region showed writing entries only
- `rm -rf .next .wrangler .open-next tsconfig.tsbuildinfo && test ! -e .next && test ! -e .wrangler && test ! -e .open-next && test ! -e tsconfig.tsbuildinfo`: PASS, generated artifacts removed after verification

## 2026-05-15 Static Robots State

Current route shape:

- `public/robots.txt` owns crawler rules.
- `src/app/robots.txt/route.ts` has been removed.

Current evidence:

- `pnpm test -- src/proxy.test.ts src/app/sitemap.xml/route.test.ts src/app/api/health/route.test.ts 'src/app/media/[id]/route.test.ts'`: PASS (`31` files, `99` tests; Vitest config ran the full suite)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS, route table no longer lists `/robots.txt`
- `curl --max-time 15 -i http://127.0.0.1:3218/robots.txt`: `200 OK`, `Content-Type: text/plain; charset=UTF-8`, includes `Sitemap: https://sorcererxw.com/sitemap.xml`

## 2026-05-15 Route-Handler Redirect State

Current route shape:

- thin `src/app/**/route.ts` handlers own `/blog`, `/projects`, `/thoughts`, `/en/**`, and `/zh/**` compatibility redirects.
- `src/app/**` does not contain standalone redirect pages.
- `src/proxy.ts` is removed because Next 16 proxy output is Node middleware and blocks OpenNext Cloudflare builds.
- `/media/[id]` remains a route handler because it owns canonical media validation and cache behavior.
- `/topics/astro-cloudflare-publishing` is removed and should return `404`.

Current evidence:

- `pnpm test -- src/proxy.test.ts src/app/sitemap.xml/route.test.ts src/app/api/health/route.test.ts 'src/app/media/[id]/route.test.ts'`: PASS (`32` files, `100` tests; Vitest config ran the full suite)
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS, route table reports `Proxy (Middleware)` and no longer lists `/blog`, `/projects`, `/thoughts`, `/en`, `/zh`, or `/topics`
- `curl --max-time 15 -I http://127.0.0.1:3217/blog`: `308 Permanent Redirect` to `/?type=writing`
- `curl --max-time 15 -I http://127.0.0.1:3217/projects`: `308 Permanent Redirect` to `/?type=projects`
- `curl --max-time 15 -I http://127.0.0.1:3217/thoughts`: `308 Permanent Redirect` to `/?type=social`
- `curl --max-time 15 -I http://127.0.0.1:3217/en/blog`: `308 Permanent Redirect` to `/?type=writing`
- `curl --max-time 15 -I http://127.0.0.1:3217/zh/articles/modern-astro`: `308 Permanent Redirect` to `/articles/modern-astro`
- `curl --max-time 15 -I http://127.0.0.1:3217/topics/astro-cloudflare-publishing`: `404 Not Found`
- `curl --max-time 15 -s http://127.0.0.1:3217/sitemap.xml | rg -n '<loc>|/blog|/projects|/thoughts|/topics|/en|/zh'`: PASS, sitemap only listed `/` and article URLs in the checked output

## 2026-05-15 Project Cleanup State

Use this evidence for the repository cleanup slice that archived superseded docs, removed local generated state, and pruned unused dependencies.

Current evidence:

- `find docs/specs docs/plans -maxdepth 1 -type f | sort`: PASS, active docs now contain still-applicable specs/plans only
- `find docs/archive -maxdepth 2 -type f | sort`: PASS, archived specs/plans remain available under `docs/archive/`
- `test ! -e src/pages && echo 'src/pages absent'`: PASS, `src/pages` no longer exists after empty retired route directories were removed
- `test ! -e .idea && echo '.idea absent'; test ! -e .open-next && echo '.open-next absent'`: PASS, removed local IDE state and OpenNext generated output
- `rg -n "from ['\"](cmdk|embla-carousel-react|grammy|input-otp|react-day-picker|react-resizable-panels|recharts|sonner|vaul|tailwind-variants)" src scripts package.json components.json`: PASS, no source or script imports for removed dependencies
- `pnpm install --lockfile-only`: PASS
- `pnpm test`: PASS (`33` files, `101` tests)
- `pnpm typecheck`: PASS
- `pnpm build`: PASS
- `pnpm lint`: PASS
- `rm -rf .next .wrangler .open-next tsconfig.tsbuildinfo && test ! -e .next && test ! -e .wrangler && test ! -e .open-next && test ! -e tsconfig.tsbuildinfo && echo 'generated artifacts absent'`: PASS, final generated artifacts were removed after verification

## 2026-05-13 Current OpenNext Next.js State

The current active runtime is Next.js App Router deployed to Cloudflare Workers through `@opennextjs/cloudflare`.

Use these root-level commands for current work:

- `pnpm install`
- `pnpm dev`
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm exec opennextjs-cloudflare build`
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3203`

For HTTP verification after preview starts:

- `curl --max-time 20 -I http://127.0.0.1:3203/`
- `curl --max-time 20 -I http://127.0.0.1:3203/blog`
- `curl --max-time 20 -I http://127.0.0.1:3203/projects`
- `curl --max-time 20 -I http://127.0.0.1:3203/thoughts`
- `curl --max-time 20 -I http://127.0.0.1:3203/articles/modern-astro`
- `curl --max-time 20 -i http://127.0.0.1:3203/api/health`
- `curl --max-time 20 -i http://127.0.0.1:3203/api/cron/thoughts`
- `curl --max-time 20 -s http://127.0.0.1:3203/sitemap.xml | rg -n "<loc>|/blog|/projects|/thoughts|/stack|\\?type="`
- `curl --max-time 20 -s http://127.0.0.1:3203/robots.txt`

Current evidence:

- `pnpm test`: PASS (`33` files, `101` tests)
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- `pnpm build`: PASS
- `rm -rf .wrangler dist .open-next && pnpm exec opennextjs-cloudflare build`: PASS, worker saved to `.open-next/worker.js`; OpenNext logged non-fatal copy errors for `hast-util-to-html`, `hast-util-whitespace`, and `property-information`
- `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port 3203`: PASS
- `/`: `200 OK`, `x-opennext: 1`, `x-powered-by: Next.js`, `cache-control: public, max-age=0, s-maxage=600`
- `/blog`: `308 Permanent Redirect` to `/?type=writing`
- `/projects`: `308 Permanent Redirect` to `/?type=projects`
- `/thoughts`: `308 Permanent Redirect` to `/?type=social`
- `/articles/modern-astro`: `200 OK`, `x-opennext: 1`
- `/articles/not-a-real-slug`: `404 Not Found`
- `/api/health`: `200 OK`
- `/api/cron/thoughts`: `410 Gone`
- sitemap check: PASS, exposes `/`, topic page, and article details only
- Chrome browser verification for `/`: PASS, rendered Profile Hero, Overview Feed filters, masonry cards, and Next asset output without Astro islands

Historical Astro verification below remains useful only for migration context.

## 2026-04-14 Current Astro State

Historical note: at this point the active runtime for `blog2` was Astro + the official Cloudflare adapter.

Most older verification notes below remain historically useful, but they describe earlier Next.js phases. Use the evidence below as the current truth for the migration state.

## 2026-05-04 Standalone Repo Verification

The app now lives in the standalone repository root at `/Users/sorcererxw/repo/sorcererxw/blog`.

Use these root-level commands for current work:

- `pnpm install`
- `pnpm dev`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm preview --host 127.0.0.1 --port 3203`

`pnpm dev` runs through Portless and serves the app at `https://blog.localhost/`.

For HTTP verification after preview starts:

- `curl --max-time 15 -I http://127.0.0.1:3203/`
- `curl --max-time 15 -I http://127.0.0.1:3203/blog`
- `curl --max-time 15 -I http://127.0.0.1:3203/thoughts`
- `curl --max-time 15 -i http://127.0.0.1:3203/api/health`

Historical commands using `pnpm --dir web --filter blog2 ...` apply to the old `tempura` monorepo layout only.

Current evidence:

- `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx src/domains/article/article-list.test.tsx src/domains/article/article-detail-view.test.tsx src/domains/thoughts/thoughts-page.test.tsx src/lib/legacy-locale-redirect.test.ts src/styles/scroll-behavior.test.ts src/pages/api/health.test.ts`: PASS (`62` tests)
- `pnpm --dir web --filter blog2 typecheck`: PASS with only `2` remaining hints
- `pnpm --dir web --filter blog2 build`: PASS after moving article detail to on-demand rendering
- `pnpm --dir web --filter blog2 exec astro preview --host 127.0.0.1 --port 3203`: PASS
- `curl --max-time 15 -I http://127.0.0.1:3203/`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3203/blog`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3203/thoughts`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3203/projects`: `200 OK`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 15 -I http://127.0.0.1:3203/stack`: `200 OK`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 20 -I http://127.0.0.1:3203/articles/stop-migrate-nextjs-to-astro`: `200 OK`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 20 -I http://127.0.0.1:3203/articles/not-a-real-slug`: `404 Not Found`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 15 -i http://127.0.0.1:3203/api/health`: `200 OK`
- `curl --max-time 15 -i http://127.0.0.1:3203/api/cron/thoughts`: `410 Gone`
- `curl --max-time 15 -I http://127.0.0.1:3203/en`: `301 Moved Permanently` to `/`
- `curl --max-time 15 -I http://127.0.0.1:3203/zh/blog`: `301 Moved Permanently` to `/blog`
- `curl --max-time 20 -L -s http://127.0.0.1:3203/articles/stop-migrate-nextjs-to-astro | rg -n "Back to the archive|放弃从 Next.js 迁移到 Astro.js"`: confirms article detail body and archive CTA
- `curl --max-time 20 -L -s http://127.0.0.1:3203/articles/not-a-real-slug | rg -n "Page not found.|Open archive|The requested article is missing"`: confirms the page-level boundary for missing slugs
- `find src/app -maxdepth 3 -type f`: no results, the old Next route tree is retired
- `rg -n "from 'next|from \"next|next/|src/app/|@/app/" src -S`: no results, runtime code no longer depends on Next

Current known risk:

- Notion and Telegram runtime credentials now resolve from `cloudflare:workers` runtime bindings typed by Wrangler-generated `cloudflare-env.d.ts`; deployments must provide the corresponding Worker secrets out of band

## 2026-05-12 Personal Site Overview Verification

The current primary public surface is the Personal Site overview homepage at `/`.

Use these route checks for the overview slice:

- `curl --max-time 15 -I http://127.0.0.1:3203/`
- `curl --max-time 15 -I http://127.0.0.1:3203/blog`
- `curl --max-time 15 -I http://127.0.0.1:3203/projects`
- `curl --max-time 15 -I http://127.0.0.1:3203/thoughts`
- `curl --max-time 15 -s http://127.0.0.1:3203/sitemap.xml | rg -n "<loc>|/blog|/projects|/thoughts|/stack|\\?type="`

Current evidence:

- `pnpm test`: PASS (`33` files, `98` tests)
- `pnpm typecheck`: PASS with `0` errors and the existing `2` unused `target` hints in locale redirect pages
- `pnpm build`: PASS
- `curl --max-time 15 -I http://127.0.0.1:3203/`: `200 OK`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 15 -I http://127.0.0.1:3203/blog`: `301 Moved Permanently` to `/?type=writing`
- `curl --max-time 15 -I http://127.0.0.1:3203/projects`: `301 Moved Permanently` to `/?type=projects`
- `curl --max-time 15 -I http://127.0.0.1:3203/thoughts`: `301 Moved Permanently` to `/?type=social`
- sitemap check: PASS, sitemap exposes `/`, topic, and article detail URLs only
- headless Chrome screenshot for `/`: PASS, confirmed Profile Hero, single Home nav, filter controls, masonry feed, and media previews

## Purpose

This file defines how to verify work in the standalone blog repo.

Every substantial task should use the smallest verification set that can still prove the behavior. When possible, verify at three levels:

- automated tests
- HTTP checks
- browser verification

## Verification Layers

### 1. Automated Tests

Use automated tests for:

- content normalization
- storage abstractions
- domain use cases
- route handlers
- utility logic

Preferred pattern:

- run the narrowest relevant test first
- then run the next broader test scope if the slice touches multiple units

Record:

- exact command
- pass/fail result
- any skipped coverage and why

## 2. HTTP Verification

Use `curl` or equivalent for:

- route handlers
- JSON endpoints
- sitemap
- metadata endpoints
- server-rendered pages when an HTTP-level sanity check is useful

Check for:

- status code
- headers when relevant
- response shape
- obvious content regressions

Record:

- exact command
- response summary
- any important headers or body details

## 3. Browser Verification

Use real browser verification for:

- page rendering
- hydration
- navigation
- interactive UI
- visual regressions
- translated content display
- comments or embeds

Check for:

- page loads without runtime errors
- expected content appears
- navigation and interactive elements work
- no obvious layout breakage
- no browser console errors that block the feature

Record:

- page/route tested
- action performed
- outcome
- important console/runtime issues if any

## Required Minimum by Change Type

### Logic-only change

- targeted automated tests

### Server/API change

- targeted automated tests
- `curl` verification

### UI/page change

- targeted automated tests when applicable
- browser verification

### End-to-end feature slice

- targeted automated tests
- `curl` verification where applicable
- browser verification

## Local Verification Expectations

Once the app scaffold exists, common verification should include:

- install/build sanity
- targeted test commands
- local page load checks
- browser-based validation of the changed route

Do not declare a task complete solely because the code compiles.

## Recording Format

When updating `docs/task-ledger.md`, write verification entries like:

- `pnpm test -- --runInBand src/domains/article/article.test.ts`: PASS
- `curl -I http://localhost:3000/en/blog`: 200 OK
- `browser check /en/blog`: page rendered, no blocking console errors

Use real commands and real outcomes. Avoid vague wording such as "tested locally".

## Failure Handling

If verification fails:

- record the failure
- do not claim success
- either fix the issue or explicitly mark the task as blocked/incomplete

If a verification step cannot be run:

- record exactly why
- state what was verified instead
- leave a follow-up item if the missing verification still matters

## 2026-04-14 Astro Migration Planning Verification

This slice created migration design and planning docs only. No runtime code changed.

Verification for this planning slice should record:

- current-state code inspection commands
- roadmap/spec/task-ledger alignment checks
- official Astro documentation reviewed for Next.js migration, Cloudflare adapter behavior, and rendering modes

Do not claim implementation verification yet. The Astro migration needs a separate runtime verification pass once code changes begin.

Captured baseline evidence for the current Next.js app:

- escalated `pnpm --dir /Users/sorcererxw/repo/sorcererxw/tempura/web --filter blog2 build`: PASS in `46s`
- direct `pnpm --dir /Users/sorcererxw/repo/sorcererxw/tempura/web --filter blog2 exec next dev --hostname 127.0.0.1 --port 3102`: server ready in `343ms`
- `pnpm --dir /Users/sorcererxw/repo/sorcererxw/tempura/web --filter blog2 dev -- --hostname 127.0.0.1 --port 3102`: FAIL, Next interpreted `--hostname` as a project directory
- `curl --max-time 15 -I http://127.0.0.1:3102/`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3102/blog`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3102/articles/stop-migrate-nextjs-to-astro`: `200 OK`, `x-nextjs-prerender: 1`
- `curl --max-time 15 -I http://127.0.0.1:3102/projects`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3102/stack`: `200 OK`
- `curl --max-time 15 -I http://127.0.0.1:3102/thoughts`: `200 OK`
- `curl --max-time 15 -i http://127.0.0.1:3102/api/health`: `200 OK`
- `curl --max-time 15 -i http://127.0.0.1:3102/api/cron/thoughts`: `410 Gone`
- `curl --max-time 15 -s http://127.0.0.1:3102/ | rg -n "<title>|<meta name=\"description\""`: confirms home title and Notion-derived description are currently route-owned metadata
- `bb-browser open http://127.0.0.1:3102/stack; sleep 2; bb-browser eval "document.body.innerText.slice(0,400)"`: confirms the browser-visible stack page currently shows the shell nav plus `Stack`, `Platform`, and `Category`
- `bb-browser open http://127.0.0.1:3102/thoughts; sleep 2; bb-browser eval "document.body.innerText.slice(0,500)"`: confirms the browser-visible thoughts page currently renders live snapshot-backed content, not just an empty state

## 2026-04-15 Cloudflare Image Delivery Planning Verification

This slice created image-delivery design and planning docs only. No runtime code changed.

Verification for this planning slice should record:

- current-state image-surface inventory commands
- roadmap/spec/plan/task-ledger alignment checks
- official Cloudflare image-transformation documentation and Astro Cloudflare documentation reviewed for the chosen runtime path

Do not claim implementation verification yet. The image-delivery plan needs a separate runtime pass once code changes start.

Recommended implementation evidence set for this slice:

- `pnpm --dir web --filter blog2 test -- <touched image helper tests> <touched component tests>`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`

## 2026-04-15 Search-Native SEO Planning Verification

This slice created SEO design and planning docs only. No runtime code changed.

Verification for this planning slice should record:

- current-state route and layout inspection commands
- roadmap/spec/plan/task-ledger alignment checks
- external reference review for search-result snippets, article structured data, and schema/image expectations
- plan-review findings that changed scope or sequencing

Do not claim runtime verification yet. The SEO slice needs a separate implementation pass once route code changes begin.

Recommended implementation evidence set for this slice:

- `pnpm --dir web --filter blog2 test -- <touched seo builder tests> <touched route tests>`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl --max-time 20 -s <route> | rg -n "<title>|<meta|application/ld\\+json|canonical"`
- `curl --max-time 20 -s <sitemap-route>`
- `curl --max-time 20 -s <robots-route>`
- browser verification for one article page and the query-entry page
- inspect route metadata directly with `curl` and record the output summary in `docs/task-ledger.md`

## 2026-04-15 Search-Native SEO Implementation Verification

This slice changed route rendering, HTML head output, collection-page copy, and public discovery routes.

Minimum evidence for this implementation slice:

- targeted tests for SEO builders and route handlers
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl` checks for:
  - `/blog`
  - one known article detail route
  - `/topics/astro-cloudflare-publishing`
  - `/robots.txt`
  - `/sitemap.xml`
- browser verification for:
  - `/blog`
  - `/topics/astro-cloudflare-publishing`
- inspect route metadata directly with `curl` against the local preview server and record title, description, canonical, robots, and JSON-LD outcomes
- `pnpm --dir web --filter blog2 exec astro preview --host 127.0.0.1 --port <port>`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/ | rg -n "/cdn-cgi/image/"`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/blog | rg -n "/cdn-cgi/image/"`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/articles/<real-slug> | rg -n "/cdn-cgi/image/"`
- browser verification for `/`, `/blog`, `/articles/<real-slug>`, and `/thoughts` confirming transformed URLs, stable layout, and no blocking runtime errors

## 2026-04-15 Cloudflare Image Delivery Implementation Verification

Use this evidence set for the first working image-delivery slice:

- `pnpm --dir web --filter blog2 test -- src/domains/media/canonical-image.test.ts src/lib/images/cloudflare.test.ts 'src/pages/media/[id].test.ts' src/domains/article/article-list.test.tsx src/domains/article/article-detail-view.test.tsx src/domains/home/intro.test.tsx src/domains/thoughts/thoughts-page.test.tsx`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `pnpm --dir web --filter blog2 run preview -- --host 127.0.0.1 --port <port>`
- `curl --max-time 20 -I http://127.0.0.1:<port>/blog`
- `curl --max-time 20 -I http://127.0.0.1:<port>/articles/<real-slug>`
- `curl --max-time 20 -I http://127.0.0.1:<port>/thoughts`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/blog | rg -n "/cdn-cgi/image/|/media/"`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/articles/<real-slug> | rg -n "/cdn-cgi/image/|/media/"`
- `curl --max-time 20 -L -s http://127.0.0.1:<port>/thoughts | rg -n "/cdn-cgi/image/|/media/"`
- `curl --max-time 20 -i 'http://127.0.0.1:<port>/media/<id>?u=<encoded-source>' | head -n 20`
- browser verification that page markup emits transformed URLs and that canonical `/media/[id]` routes are reachable

Important local-preview limitation:

- local `astro preview` for `@astrojs/cloudflare` does **not** emulate Cloudflare's `/cdn-cgi/image` endpoint
- as a result, local browser checks can confirm that the page emits the transformed URLs, but image decode through those URLs may still show `naturalWidth = 0`
- treat deployed-worker verification as the final proof for transformed-image rendering, while using local preview to validate page markup, route behavior, and canonical media fallback

Important local-build limitation:

- Miniflare-backed local `astro build` can fail with `SQLITE_BUSY_RECOVERY` if multiple Cloudflare-aware checks run concurrently in the same workspace
- when that happens, rerun `build` in isolation before treating it as a code regression

## 2026-04-14 Astro Platform Rebase Verification

Use this evidence set for the first working Astro route-layer cutover:

- `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx src/domains/article/article-list.test.tsx src/domains/article/article-detail-view.test.tsx src/lib/legacy-locale-redirect.test.ts`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `pnpm --dir web --filter blog2 exec astro preview --host 127.0.0.1 --port 3203`
- `curl --max-time 15 -I http://127.0.0.1:3203/`
- `curl --max-time 15 -I http://127.0.0.1:3203/blog`
- `curl --max-time 15 -I http://127.0.0.1:3203/articles/stop-migrate-nextjs-to-astro`
- `curl --max-time 15 -I http://127.0.0.1:3203/projects`
- `curl --max-time 15 -I http://127.0.0.1:3203/stack`
- `curl --max-time 15 -I http://127.0.0.1:3203/thoughts`
- `curl --max-time 15 -i http://127.0.0.1:3203/api/health`
- `curl --max-time 15 -i http://127.0.0.1:3203/api/cron/thoughts`
- `curl --max-time 15 -I http://127.0.0.1:3203/en`
- `curl --max-time 15 -I http://127.0.0.1:3203/zh/blog`
- `bb-browser open http://127.0.0.1:3203/; sleep 2; bb-browser eval "document.body.innerText.slice(0,300)"`
- `bb-browser open http://127.0.0.1:3203/thoughts/; sleep 2; bb-browser eval "document.body.innerText.includes('No thoughts published yet.') || document.body.innerText.includes('Replying to') || document.body.innerText.includes('Forwarded from')"`

Current evidence:

- targeted shell/article/redirect tests: PASS (`63` tests total in the current Vitest run)
- `astro check`: PASS with hints only after excluding test files from the Astro typecheck scope
- `astro build`: PASS with the Cloudflare adapter after switching Shiki code highlighting to an explicit JavaScript regex engine
- `astro preview`: PASS on `http://127.0.0.1:3203`
- `/`: `200 OK`
- `/projects`: `200 OK` with `cache-control: public, max-age=0, s-maxage=600`
- `/stack`: `200 OK` with `cache-control: public, max-age=0, s-maxage=600`
- `/api/health`: `200 OK`
- `/api/cron/thoughts`: `410 Gone`
- `/en`: `301 Moved Permanently` to `/`
- `/zh/blog`: `301 Moved Permanently` to `/blog`
- browser-visible home page in Astro preview shows the shell and current home content
- browser-visible thoughts page in Astro preview renders real snapshot-backed content
- `rg -n "from 'next|from \"next|next/|src/app/|@/app/" src -S`: no remaining runtime references to Next or `src/app/**`
- `find src/app -maxdepth 3 -type f`: no remaining files, the old app runtime tree has been retired
- initial Astro preview runs returned `307 Temporary Redirect` responses to trailing-slash URLs, but this was fixed by switching Astro to `build.format: "file"` with `trailingSlash: "never"`
- current verification now shows `/blog`, `/thoughts`, and article detail routes return `200 OK` without the old redirect

Post-retirement follow-up evidence:

- `pnpm --dir web install --no-frozen-lockfile`: PASS after removing `next`, `next-themes`, and `next-env.d.ts`
- `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx src/domains/article/article-list.test.tsx src/domains/article/article-detail-view.test.tsx src/domains/thoughts/thoughts-page.test.tsx src/lib/legacy-locale-redirect.test.ts src/styles/scroll-behavior.test.ts src/pages/api/health.test.ts`: PASS (`62` tests)
- `pnpm --dir web --filter blog2 typecheck`: PASS with hints only after removing the old app route tree
- one retry of `pnpm --dir web --filter blog2 build`: FAIL due upstream Notion timeouts (`RequestTimeoutError`) and one `Network connection lost` event while article detail pages were still fully prerendered
- after switching `src/pages/articles/[slug].astro` to on-demand rendering with `Cache-Control: public, max-age=0, s-maxage=600`, `pnpm --dir web --filter blog2 build`: PASS in `9.94s`
- after removing the temporary `next` runtime dependency, `pnpm --dir web --filter blog2 build`: PASS again with article detail still on-demand
- `pnpm --dir web --filter blog2 exec astro preview --host 127.0.0.1 --port 3203`: PASS
- `curl --max-time 20 -I http://127.0.0.1:3203/articles/stop-migrate-nextjs-to-astro`: `200 OK`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 20 -I http://127.0.0.1:3203/articles/not-a-real-slug`: `404 Not Found`, `cache-control: public, max-age=0, s-maxage=600`
- `curl --max-time 20 -L -s http://127.0.0.1:3203/articles/stop-migrate-nextjs-to-astro | rg -n "Back to the archive|放弃从 Next.js 迁移到 Astro.js"`: confirms article detail body and archive CTA render in Astro preview
- `curl --max-time 20 -L -s http://127.0.0.1:3203/articles/not-a-real-slug | rg -n "Page not found.|Open archive|The requested article is missing"`: confirms missing article slugs render the page-level boundary

## Blog2 Foundation Harness

Use these commands for the current foundation slice:

- `pnpm --dir web --filter blog2 test -- src/config/env.test.ts app/api/health/route.test.ts`
- `pnpm --dir web --filter blog2 test`
- `pnpm --dir web --filter blog2 lint`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `curl -i http://127.0.0.1:3001/api/health`

Browser verification is not required for this slice because the task adds test infrastructure and a server health route, not a rendered UI change. If a future task changes page rendering, browser verification becomes mandatory again.

## Current Public Slice Verification Notes

The current worktree includes several rendered public slices. Use the actual evidence that exists for each slice:

- `article listing`: `pnpm --dir web --filter blog2 test -- src/domains/article/list-articles.test.ts`, `pnpm --dir web --filter blog2 lint`, `pnpm --dir web --filter blog2 typecheck`, `pnpm --dir web --filter blog2 build`, `curl -I http://localhost:3001/en/blog`
- `thoughts`: `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts src/domains/thoughts/list-thoughts.test.ts`, `pnpm --dir web --filter blog2 typecheck`, browser verification for `http://localhost:3001/thoughts`
- `thoughts direct Telegram`: `pnpm --dir web --filter blog2 test -- src/domains/thoughts/list-thoughts.test.ts src/integrations/telegram/thoughts.test.ts`, `pnpm --dir web --filter blog2 typecheck`, `pnpm --dir web --filter blog2 build`, `pnpm --dir web --filter blog2 exec opennextjs-cloudflare build`, `curl -I http://localhost:3001/thoughts`
- `homepage intro`: `pnpm --dir web --filter blog2 test -- src/domains/home/intro.test.tsx`, `pnpm --dir web --filter blog2 lint`, `pnpm --dir web --filter blog2 typecheck`, `curl -I http://localhost:3001/en`
- `shared shell`: `pnpm --dir web --filter blog2 test -- src/domains/shell/site-shell.test.tsx`, `pnpm --dir web --filter blog2 exec eslint 'app/[lang]/layout.tsx' src/domains/shell/site-header.tsx src/domains/shell/site-footer.tsx src/domains/shell/site-links.ts src/domains/shell/site-shell.test.tsx`, `pnpm --dir web --filter blog2 typecheck`, `pnpm --dir web --filter blog2 build`, `curl -I http://localhost:3001/en`

Browser MCP note:

- browser navigation has been repeatedly blocked by the local Chrome profile lock at `/Users/bytedance/Library/Caches/ms-playwright/mcp-chrome`
- when browser MCP is blocked, the fallback evidence used so far has been `curl`, `nextjs_call get_errors`, and `nextjs_call get_page_metadata` where applicable
- do not claim browser success unless a browser session actually completed without the profile-lock error

For future rendered-page slices, prefer recording all three layers when available:

- narrow automated tests
- `curl`/HTTP evidence
- browser verification or an explicit profile-lock blocker note

## 2026-03-31 Direct Telegram Thoughts Verification

Use this evidence set for the current thoughts migration away from cron/KV snapshots:

- `pnpm --dir web --filter blog2 test -- src/domains/thoughts/list-thoughts.test.ts src/integrations/telegram/thoughts.test.ts`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `pnpm --dir web --filter blog2 exec opennextjs-cloudflare build`
- `pnpm --dir web --filter blog2 dev`
- `curl -I http://localhost:3001/thoughts`
- `curl -s http://localhost:3001/thoughts | rg -n "No thoughts published yet|Open in Telegram|tech_bb"`

Current evidence:

- targeted thoughts/direct-Telegram tests: PASS
- `typecheck`: PASS
- `build`: PASS, but Wrangler/workerd still warns that `TelegramThoughtsCoordinatorObject` is not exported from the worker during local validation
- `opennextjs-cloudflare build`: PASS
- local `/thoughts` route: `200 OK`
- local `/thoughts` HTML: renders the explicit empty state when live Telegram content is unavailable

Interpretation:

- the page now behaves like a direct-read surface from the app's perspective
- the public fallback changed from synthetic content to empty state as intended
- no Durable Object wiring remains in the worker configuration; the remaining verification risk is Telegram runtime behavior itself

## 2026-04-06 Thoughts Snapshot Verification

Use this evidence set for the current snapshot-based thoughts migration:

- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/domains/thoughts/list-thoughts.test.ts src/domains/thoughts/sync-thoughts.test.ts src/integrations/telegram/thoughts.test.ts`
- `pnpm --dir web --filter blog2 build`
- `pnpm --dir web --filter blog2 sync:thoughts`
- `curl -I http://localhost:3000/thoughts`
- `curl -s http://localhost:3000/thoughts | rg -n "No thoughts published yet|Forwarded from|Preview title|reply child|photo parent"`
- Next.js MCP `get_errors`
- `bb-browser open http://localhost:3005/thoughts`
- `bb-browser snapshot -i -c -d 4`
- `bb-browser errors`
- `bb-browser console`
- `bb-browser eval "document.body.innerText"`

Current evidence:

- targeted snapshot thoughts tests: PASS (`60` tests total in the current Vitest run, including the new snapshot loader, static page, and sync command tests)
- `build`: PASS; `/thoughts` is emitted as `○ /thoughts`
- `sync:thoughts`: FAILS fast with a clear env requirement message when `TELEGRAM_APP_ID`, `TELEGRAM_APP_SECRET`, and `TELEGRAM_TOKEN` are unset
- `curl -I http://localhost:3000/thoughts`: `200 OK`
- `curl -s http://localhost:3000/thoughts | rg -n "No thoughts published yet"`: confirmed the page renders the checked-in empty snapshot state
- Next.js MCP `get_errors`: `{"configErrors":[],"sessionErrors":[]}`
- `bb-browser snapshot -i -c -d 4`: page opened successfully on `http://localhost:3005/thoughts`
- `bb-browser errors`: no JS errors
- `bb-browser console`: only React DevTools + HMR connection messages
- `bb-browser eval "document.body.innerText"`: confirmed the browser-visible body includes `No thoughts published yet.`

Interpretation:

- `/thoughts` now renders from a checked-in snapshot instead of runtime Telegram or KV reads
- the public route is static and build-backed
- the local sync command is wired into the package scripts and fails clearly when credentials are missing
- browser verification confirms the empty snapshot state renders cleanly with no runtime JS errors

## 2026-03-31 Thoughts Page Alignment Verification

Use this evidence set for the route-owned Telegram presentation alignment:

- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts`
- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts src/domains/thoughts/list-thoughts.test.ts`
- `pnpm --dir web --filter blog2 typecheck`
- `rg -n "thoughts-feed|ThoughtsFeed" web/apps/blog2/src -S`
- browser verification for `http://localhost:3001/thoughts`

Current evidence:

- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts`: PASS after adding route-level regression coverage for old-blog-aligned cards and null Telegram history handling
- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts`: PASS after adding regression coverage for photo media, visible Telegram jump links, and local reply-link continuity
- `pnpm --dir web --filter blog2 test -- src/app/thoughts/page.test.ts src/integrations/telegram/thoughts.test.ts src/domains/thoughts/list-thoughts.test.ts`: PASS
- `pnpm --dir web --filter blog2 typecheck`: PASS
- `rg -n "thoughts-feed|ThoughtsFeed" web/apps/blog2/src -S`: no matches after deleting the old `thoughts-feed` layer
- Next.js browser automation on `http://localhost:3001/thoughts`: PASS for page load and DOM inspection; the page exposed `261` Telegram links and rendered live thoughts content in the session
- Next.js browser DOM inspection after the follow-up interaction/media fix: `hasOpenInTelegram: true`, `telegramLinks: 522`, `localReplyLinks: 36`
- `curl --max-time 10 -I http://127.0.0.1:3001/thoughts`: timed out in this session, so direct HTTP verification remains anomalous even though browser automation reached the route

Interpretation:

- `/thoughts` now owns Telegram card rendering directly and no longer depends on the deleted `thoughts-feed` component
- the route renders live Telegram-linked message cards rather than the old simplified text-only layout
- the main remaining verification gap is the inconsistent local `curl` reachability to the running dev server

## 2026-03-29 Blog Archive Ledger Slice

Use this evidence set for the current `/blog` archive redesign:

- `pnpm --dir web --filter blog2 test -- src/domains/article/article-list.test.tsx`
- `pnpm --dir web --filter blog2 typecheck`
- `curl --max-time 15 -I http://localhost:3000/en/blog` once the local Next workspace-resolution issue is fixed
- browser verification for `/en/blog` on desktop and mobile once the local Next workspace-resolution issue is fixed

Current blocker note:

- `next dev` currently starts but route compilation falls into a bad module-resolution state that tries to resolve `tailwindcss` from `web/apps`, which prevents reliable HTTP and browser verification in this worktree

## 2026-03-29 Old Blog Structure Migration Verification

Use this evidence set for the current public-UI migration that copies `web/apps/blog` structure into `blog2`:

- `pnpm --dir web --filter blog2 test`
- `pnpm --dir web --filter blog2 typecheck`
- `pnpm --dir web --filter blog2 build`
- `pnpm --dir web --filter blog2 dev`
- route checks for `/en`, `/en/blog`, `/en/thoughts`, `/en/projects`, `/en/stack`

Current evidence:

- `pnpm --dir web --filter blog2 test`: PASS (`16` files, `44` tests)
- `pnpm --dir web --filter blog2 typecheck`: PASS
- `pnpm --dir web --filter blog2 build`: FAIL after multiple unrelated UI primitive issues surfaced outside the migrated page domains. Current blocking failures moved from stale local `lucide-react.d.ts`, to React 19 primitive typing, and then to `src/components/ui/drawer.tsx`
- `pnpm --dir web --filter blog2 dev`: starts on `http://localhost:3001`, but route compilation is blocked by `Can't resolve 'tailwindcss' in '/Users/bytedance/repo/github.com/sorcererxw/tempura/web/apps'`
- `curl -i http://localhost:3001/en`, `/en/blog`, `/en/thoughts`, `/en/projects`: all hang while the dev server is in the broken module-resolution state

Interpretation:

- the migrated public page tests are green
- app-level verification is still incomplete because the current worktree has unrelated primitive/runtime debt that prevents a clean `build` and route rendering

## 2026-03-29 Shadcn Convergence Verification

Use this evidence set for the business-domain shadcn convergence slice that touched `stack`, `projects`, `thoughts`, `home intro`, and `article detail`:

- `pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx src/domains/projects/projects-list.test.tsx`
- `pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx`
- `pnpm --dir web --filter blog2 test -- src/domains/home/intro.test.tsx src/domains/article/article-detail-view.test.tsx`
- `pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx src/domains/projects/projects-list.test.tsx src/domains/thoughts/thoughts-feed.test.tsx src/domains/home/intro.test.tsx src/domains/article/article-detail-view.test.tsx`

Current evidence:

- `pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx src/domains/projects/projects-list.test.tsx`: PASS during the stack/projects convergence phase
- `pnpm --dir web --filter blog2 test -- src/domains/thoughts/thoughts-feed.test.tsx`: PASS after the final `thoughts-feed` fixes
- `pnpm --dir web --filter blog2 test -- src/domains/home/intro.test.tsx src/domains/article/article-detail-view.test.tsx`: PASS after the final intro/article fixes
- `pnpm --dir web --filter blog2 test -- src/domains/stack/stack-list.test.tsx src/domains/projects/projects-list.test.tsx src/domains/thoughts/thoughts-feed.test.tsx src/domains/home/intro.test.tsx src/domains/article/article-detail-view.test.tsx`: PASS (`16` files, `49` tests)

Reviewer evidence:

- `thoughts-feed`: final reviewer pass with no findings after quote-rendering and explicit-link fixes
- `intro`: final reviewer pass with no findings after replacing `Alert` semantics with `Card` presentation for static callouts
- `article-detail-view`: final reviewer pass with no findings after bookmark/separator convergence

Current blocker note:

- browser and HTTP verification for these routes is still blocked by the existing local `next dev` module-resolution issue already documented in this file; do not claim rendered-route verification until that blocker is resolved
