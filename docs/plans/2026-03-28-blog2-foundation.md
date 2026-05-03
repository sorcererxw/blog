# Blog2 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize `web/apps/blog2` from a latest-stable Next.js + Tailwind + shadcn baseline, then layer in the Cloudflare-compatible runtime baseline, minimal i18n-aware app shell, verification harness, and the operational docs needed to begin feature migration.

**Architecture:** Build `blog2` as a greenfield app inside the existing `web` monorepo, but start from official CLI-generated framework defaults instead of hand-written scaffolding. The first milestone should prove local development, app build, shadcn-ready UI baseline, Cloudflare binding shape, and verification workflow without pulling in legacy blog behavior.

**Tech Stack:** Latest stable Next.js App Router, React, TypeScript, Tailwind CSS, shadcn default preset/style, pnpm workspace, Turbo, Wrangler, Cloudflare KV bindings, Vitest, Testing Library, Playwright/browser verification, existing `eslint-config-custom`

---

### Task 1: Initialize the App from the Official CLI Baseline

**Files:**
- Create: `web/apps/blog2/package.json`
- Create: `web/apps/blog2/tsconfig.json`
- Create: `web/apps/blog2/next-env.d.ts`
- Create: `web/apps/blog2/next.config.mjs`
- Create: `web/apps/blog2/eslint.config.mjs`
- Create: `web/apps/blog2/postcss.config.mjs`
- Create: `web/apps/blog2/components.json`
- Create: `web/apps/blog2/app/layout.tsx`
- Create: `web/apps/blog2/app/page.tsx`
- Create: `web/apps/blog2/app/globals.css`
- Create: `web/apps/blog2/components/ui/button.tsx`
- Create: `web/apps/blog2/lib/utils.ts`
- Create: `web/apps/blog2/wrangler.toml`
- Modify: `web/apps/blog2/docs/task-ledger.md`

- [ ] **Step 1: Initialize `blog2` with the latest stable Next.js baseline**

Run the official initializer inside `web/apps` so the app starts from current framework defaults rather than handwritten files.

The result must be:

- a Next.js app rooted at `web/apps/blog2`
- TypeScript enabled
- App Router enabled
- Tailwind enabled
- no canary dependencies

- [ ] **Step 2: Initialize shadcn with the default preset/style**

Use the project package runner and the shadcn CLI to initialize the app with the default preset/style.

The result must include:

- `components.json`
- shadcn-compatible aliases and CSS variable setup
- the default generated utility and starter UI files required by `shadcn init`
- no custom preset or non-default style assumptions

- [ ] **Step 3: Normalize the generated app into the monorepo conventions**

Adjust the generated files so they fit this repo:

```json
{
  "name": "blog2",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest --passWithNoTests",
    "cf:typegen": "wrangler types"
  }
}
```

Prefer preserving current upstream config shapes where practical:

- keep ESLint 9 flat config instead of forcing legacy `.eslintrc` format
- keep Tailwind 4 baseline conventions instead of reintroducing `tailwind.config.js` unless required later
- only deviate from generated defaults when the repo or Cloudflare runtime truly requires it

- [ ] **Step 4: Layer in the Cloudflare-aware Next config**

Create `web/apps/blog2/next.config.mjs` with:

- `reactStrictMode: true`
- local Cloudflare dev platform setup when `NODE_ENV === "development"`
- image config that is permissive enough for external content during early migration

- [ ] **Step 5: Add worker config and any repo-specific adjustments not covered by the CLI**

Add:

- `wrangler.toml` with placeholder KV binding and a current compatibility baseline

The `wrangler.toml` file should declare the intended bindings without hardcoding production IDs.

If repo lint integration requires a temporary compromise, prefer the smallest possible change that keeps compatibility with the generated ESLint 9 baseline.

- [ ] **Step 6: Verify package detection and generated baseline validity**

Run:

```bash
pnpm --dir web --filter blog2 lint
```

Expected:

- the command resolves the new workspace package
- the generated app shell is present, so lint should now run as a meaningful quality gate

- [ ] **Step 7: Record the initialization decisions in the task ledger**

Update `web/apps/blog2/docs/task-ledger.md` with created files, command results, and any package/config decisions.

- [ ] **Step 8: Commit**

```bash
git add web/apps/blog2/package.json web/apps/blog2/tsconfig.json web/apps/blog2/next-env.d.ts web/apps/blog2/next.config.mjs web/apps/blog2/eslint.config.mjs web/apps/blog2/postcss.config.mjs web/apps/blog2/components.json web/apps/blog2/components/ui/button.tsx web/apps/blog2/lib/utils.ts web/apps/blog2/app web/apps/blog2/wrangler.toml web/apps/blog2/docs/task-ledger.md
git commit -m "feat: initialize blog2 app baseline"
```

### Task 2: Create the Minimal App Shell and Route Surface

**Files:**
- Create: `web/apps/blog2/app/error.tsx`
- Create: `web/apps/blog2/app/not-found.tsx`
- Create: `web/apps/blog2/app/[lang]/layout.tsx`
- Create: `web/apps/blog2/app/[lang]/page.tsx`
- Create: `web/apps/blog2/middleware.ts`
- Create: `web/apps/blog2/src/config/i18n.ts`
- Create: `web/apps/blog2/src/lib/classnames.ts`
- Modify: `web/apps/blog2/docs/task-ledger.md`

- [ ] **Step 1: Write the language config used by middleware and routes**

Create `src/config/i18n.ts` with a small, explicit API such as:

```ts
export const defaultLocale = "en"
export const locales = ["en", "zh"] as const
export type Locale = (typeof locales)[number]
```

- [ ] **Step 2: Adapt the generated root app shell**

Update `app/layout.tsx` and the generated global CSS file with:

- HTML shell
- base typography and background tokens
- no legacy UI dependencies
- a stable slot for future providers

- [ ] **Step 3: Build the locale-aware shell**

Create:

- `app/[lang]/layout.tsx`
- `app/[lang]/page.tsx`
- `middleware.ts`

The first version should:

- redirect or rewrite cleanly into the locale segment
- render a simple foundation page showing active locale and project intent
- keep logic intentionally small

- [ ] **Step 4: Add error and not-found boundaries**

Create:

- `app/error.tsx`
- `app/not-found.tsx`

The UI should be minimal but production-shaped enough for browser verification.

- [ ] **Step 5: Verify the app boots locally**

Run:

```bash
pnpm --dir web --filter blog2 dev
```

Expected:

- Next.js dev server starts cleanly
- no missing-config crash on boot

- [ ] **Step 6: Verify the locale route over HTTP**

With the dev server running, check:

```bash
curl -I http://localhost:3000/
curl -I http://localhost:3000/en
```

Expected:

- `/` returns a redirect or rewrite-friendly response according to the middleware design
- `/en` returns `200 OK`

- [ ] **Step 7: Verify the shell in a browser**

Open the local app and verify:

- the locale page renders
- no blocking runtime errors appear
- the error and not-found routes are reachable if exercised

- [ ] **Step 8: Record outcomes in the ledger**

Update `web/apps/blog2/docs/task-ledger.md` with route behavior and browser results.

- [ ] **Step 9: Commit**

```bash
git add web/apps/blog2/app web/apps/blog2/middleware.ts web/apps/blog2/src/config/i18n.ts web/apps/blog2/src/lib/classnames.ts web/apps/blog2/docs/task-ledger.md
git commit -m "feat: add blog2 app shell"
```

### Task 3: Establish Runtime and Cloudflare Binding Boundaries

**Files:**
- Create: `web/apps/blog2/src/config/env.ts`
- Create: `web/apps/blog2/src/config/runtime.ts`
- Create: `web/apps/blog2/src/types/cloudflare.ts`
- Create: `web/apps/blog2/src/lib/logger.ts`
- Create: `web/apps/blog2/app/api/health/route.ts`
- Modify: `web/apps/blog2/env.d.ts`
- Modify: `web/apps/blog2/wrangler.toml`
- Modify: `web/apps/blog2/docs/task-ledger.md`

- [ ] **Step 1: Define the runtime shape**

Create `src/types/cloudflare.ts` and `src/config/runtime.ts` so the app has one place to describe bindings such as:

```ts
export interface CloudflareEnv {
  BLOG_CACHE: KVNamespace
  NOTION_TOKEN: string
}
```

Do not spread raw `process.env` access across route files.

- [ ] **Step 2: Add environment access helpers**

Create `src/config/env.ts` with a small validation layer for required values. The first version can be a simple assertion-based helper rather than a full schema library.

- [ ] **Step 3: Add a logger utility**

Create `src/lib/logger.ts` with structured logging helpers that can be used in route handlers and future jobs.

- [ ] **Step 4: Add a health route for verification**

Create `app/api/health/route.ts` returning a small JSON payload such as:

```json
{ "ok": true, "service": "blog2" }
```

This route becomes the standard early `curl` verification target.

- [ ] **Step 5: Verify the health route**

With local dev running, check:

```bash
curl http://localhost:3000/api/health
```

Expected:

- `200 OK`
- JSON body includes `ok: true`

- [ ] **Step 6: Record runtime decisions**

Update the task ledger with:

- initial env variable list
- placeholder Cloudflare bindings
- health endpoint verification result

- [ ] **Step 7: Commit**

```bash
git add web/apps/blog2/src/config/env.ts web/apps/blog2/src/config/runtime.ts web/apps/blog2/src/types/cloudflare.ts web/apps/blog2/src/lib/logger.ts web/apps/blog2/app/api/health/route.ts web/apps/blog2/env.d.ts web/apps/blog2/wrangler.toml web/apps/blog2/docs/task-ledger.md
git commit -m "feat: add blog2 runtime boundary"
```

### Task 4: Add the Foundation Test Harness

**Files:**
- Create: `web/apps/blog2/vitest.config.ts`
- Create: `web/apps/blog2/src/test/setup.ts`
- Create: `web/apps/blog2/src/config/env.test.ts`
- Create: `web/apps/blog2/app/api/health/route.test.ts`
- Modify: `web/apps/blog2/package.json`
- Modify: `web/apps/blog2/docs/verification.md`
- Modify: `web/apps/blog2/docs/task-ledger.md`

- [ ] **Step 1: Add the failing test for env access**

Create `src/config/env.test.ts` covering the smallest validation behavior, for example:

```ts
it("throws when a required env var is missing", () => {
  expect(() => getRequiredEnv("NOTION_TOKEN", {} as never)).toThrow()
})
```

- [ ] **Step 2: Add the failing test for the health route**

Create `app/api/health/route.test.ts` asserting the route returns the expected status and JSON payload.

- [ ] **Step 3: Add the minimal Vitest setup**

Create:

- `vitest.config.ts`
- `src/test/setup.ts`

Use jsdom only if needed; otherwise keep the route and config tests in a node-friendly setup.

- [ ] **Step 4: Run the narrow tests to verify they fail for the right reason**

Run:

```bash
pnpm --dir web --filter blog2 test -- src/config/env.test.ts app/api/health/route.test.ts
```

Expected:

- failure before the implementation is complete

- [ ] **Step 5: Implement the minimal code needed to make the tests pass**

Adjust `src/config/env.ts` and `app/api/health/route.ts` only as needed to satisfy the tests.

- [ ] **Step 6: Re-run the tests**

Run:

```bash
pnpm --dir web --filter blog2 test
```

Expected:

- all current `blog2` tests pass

- [ ] **Step 7: Update verification guidance**

Refine `web/apps/blog2/docs/verification.md` with the actual commands that the scaffold now supports.

- [ ] **Step 8: Record the results in the ledger**

Document:

- test commands
- pass/fail outcomes
- any missing coverage left for later milestones

- [ ] **Step 9: Commit**

```bash
git add web/apps/blog2/vitest.config.ts web/apps/blog2/src/test/setup.ts web/apps/blog2/src/config/env.test.ts web/apps/blog2/app/api/health/route.test.ts web/apps/blog2/package.json web/apps/blog2/docs/verification.md web/apps/blog2/docs/task-ledger.md
git commit -m "test: add blog2 foundation harness"
```

### Task 5: Wire the Local Verification Loop

**Files:**
- Modify: `web/apps/blog2/package.json`
- Modify: `web/apps/blog2/docs/verification.md`
- Modify: `web/apps/blog2/docs/task-ledger.md`
- Create: `web/apps/blog2/docs/plans/verification-smoke-checklist.md`

- [ ] **Step 1: Add explicit verification scripts if missing**

Add scripts for the commands the team will actually run, for example:

```json
{
  "scripts": {
    "check": "pnpm lint && pnpm test && pnpm build"
  }
}
```

- [ ] **Step 2: Write the local smoke checklist**

Create `docs/plans/verification-smoke-checklist.md` covering:

- start dev server
- verify `/`
- verify `/en`
- verify `/api/health`
- check browser console

- [ ] **Step 3: Run the full foundation checks**

Run:

```bash
pnpm --dir web --filter blog2 lint
pnpm --dir web --filter blog2 test
pnpm --dir web --filter blog2 build
```

Expected:

- all commands succeed for the foundation slice

- [ ] **Step 4: Run HTTP smoke checks**

With local dev running, check:

```bash
curl -I http://localhost:3000/en
curl http://localhost:3000/api/health
```

Expected:

- locale page is reachable
- health endpoint responds with expected JSON

- [ ] **Step 5: Run browser smoke verification**

Verify in a browser:

- `/en` loads
- no blocking console errors
- the app shell renders the expected foundation content

- [ ] **Step 6: Record the verification baseline**

Update:

- `docs/verification.md`
- `docs/task-ledger.md`

with the real commands and outcomes.

- [ ] **Step 7: Commit**

```bash
git add web/apps/blog2/package.json web/apps/blog2/docs/verification.md web/apps/blog2/docs/task-ledger.md web/apps/blog2/docs/plans/verification-smoke-checklist.md
git commit -m "docs: add blog2 verification baseline"
```

### Task 6: Close Out M1 Planning State

**Files:**
- Modify: `web/apps/blog2/docs/roadmap.md`
- Modify: `web/apps/blog2/docs/task-ledger.md`

- [ ] **Step 1: Update roadmap status after implementation**

When the previous tasks are complete, update `docs/roadmap.md`:

- mark `M0` complete if still pending
- mark `M1` in progress or complete based on actual state
- update active priorities to point to `M2`

- [ ] **Step 2: Write a completion entry in the task ledger**

Add a ledger entry summarizing:

- what foundation work shipped
- what commands verified it
- what remains before public content migration starts

- [ ] **Step 3: Run the final foundation check**

Run:

```bash
pnpm --dir web --filter blog2 check
```

Expected:

- foundation baseline passes in one command

- [ ] **Step 4: Commit**

```bash
git add web/apps/blog2/docs/roadmap.md web/apps/blog2/docs/task-ledger.md
git commit -m "docs: close out blog2 foundation milestone"
```
