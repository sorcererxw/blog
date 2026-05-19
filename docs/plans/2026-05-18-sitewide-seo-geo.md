# Sitewide SEO/GEO Plan

## Status

Done locally, pending deploy verification.

## Goal

Land a narrow whole-site SEO/GEO hygiene slice for the current Next.js Personal Site without restoring removed archive pages or adding a broad topic system.

## Slice 1: Discovery and Crawler Policy

Files:

- `public/robots.txt`
- `public/llms.txt`
- `src/app/sitemap.xml/route.ts`
- `src/app/sitemap.xml/route.test.ts`

Work:

1. make AI crawler access explicit in `robots.txt`
2. add a short static `llms.txt`
3. preserve sitemap scope as `/` plus article detail URLs only
4. add sitemap `lastmod` values from article dates where available

Verification:

- targeted sitemap test
- `curl` checks for `/robots.txt`, `/llms.txt`, and `/sitemap.xml`

## Slice 2: Homepage Structured Data

Files:

- `src/app/page.tsx`
- `src/domains/seo/build-structured-data.ts`
- `src/domains/seo/build-structured-data.test.ts`
- `src/domains/seo/site.ts`

Work:

1. add `sameAs` identity links to Person structured data
2. add homepage `CollectionPage` and `ItemList` structured data from the Overview Feed Index
3. keep route code responsible for SEO assembly and keep components SEO-passive

Verification:

- targeted SEO structured-data tests
- HTTP head/body checks for JSON-LD on `/`
- browser verification for `/`

## Slice 3: SEO Verification Refresh

Files:

- `docs/verification.md`
- `docs/task-ledger.md`

Work:

1. remove the temporary `seo:preview` package script and `scripts/seo-preview.mjs`
2. keep the active route checks as explicit HTTP metadata and JSON-LD commands in verification docs
3. inspect the current homepage, supported filter URLs, `/blog` boundary behavior, and one discovered article through direct HTTP checks

Verification:

- direct HTTP metadata checks for `/`, homepage filter states, `/blog`, and one article detail URL

## Documentation

Update before completion:

- `docs/roadmap.md`
- `docs/verification.md`
- `docs/task-ledger.md`

## Slice 4: Agent Link Header Discovery

Files:

- `next.config.ts`
- `src/domains/seo/agent-discovery.ts`
- `src/app/.well-known/api-catalog/route.ts`
- `src/app/.well-known/api-catalog/route.test.ts`

Work:

1. add an RFC 8288 homepage `Link` response header with `api-catalog`, `service-doc`, and `describedby` relations
2. add `/.well-known/api-catalog` as a small RFC 9727 `application/linkset+json` catalog
3. keep the catalog scoped to existing public resources instead of inventing a broader API surface

Verification:

- route test for the API catalog GET/HEAD behavior
- `curl` checks for homepage `Link` response headers
- `curl` checks for API catalog content type, `Link` headers, and JSON body
