# Sitewide SEO/GEO Design

## Summary

Improve the current Personal Site SEO and GEO surfaces without changing the product shape.

The target is not a new content taxonomy or a restored archive system. The site remains:

- `/` as the primary Personal Site surface
- `/articles/[slug]` as durable proof pages
- `/projects` and `/thoughts` as compatibility redirects to homepage filters
- `/blog` as absent from the product surface

This slice tightens machine-readable discovery for search crawlers and AI answer engines around the routes that already exist.

## Goals

- keep canonical metadata route-owned through the existing SEO domain
- expose the homepage Overview Feed as structured `CollectionPage` / `ItemList` data
- keep article detail pages as `TechArticle` proof pages
- make crawler policy explicit for common AI crawlers while preserving `/api/` as non-crawlable
- add a concise `llms.txt` site guide for AI-oriented discovery
- keep SEO verification in the living docs instead of adding persistent one-off scripts

## Non-Goals

- adding public archive pages
- adding a topic hub or generated keyword taxonomy
- rewriting Notion article content
- adding analytics, rank tracking, or paid SEO API integrations
- changing storage or Notion schemas

## Route Discovery Contract

Indexable discovery surfaces:

- `/`
- `/articles/[slug]`
- `/sitemap.xml`
- `/robots.txt`
- `/llms.txt`

Filter URLs such as `/?type=writing`, `/?type=projects`, and `/?source=telegram` may be linked from human and AI guidance surfaces, but they canonicalize to `/` and stay out of the sitemap.

Compatibility routes:

- `/projects` redirects to `/?type=projects`
- `/thoughts` redirects to `/?type=social`
- `/blog` remains absent and should not be listed in discovery files

## Structured Data Contract

Homepage structured data should include:

- `WebSite`
- `Person`
- `CollectionPage`
- `ItemList`

The homepage `ItemList` should use the already-normalized Overview Feed Index. Internal destinations become absolute site URLs; external destinations stay absolute upstream URLs. Items without destinations are omitted from the list.

Article detail structured data remains:

- `TechArticle`
- `BreadcrumbList`

The route layer continues to assemble SEO inputs. Components render content; they do not infer SEO intent.

## AI Crawler Policy

`robots.txt` should keep the default crawl policy simple:

- allow public pages
- disallow `/api/`
- point at the canonical sitemap

It may also list common AI crawlers explicitly to make the policy unambiguous:

- `GPTBot`
- `ChatGPT-User`
- `ClaudeBot`
- `anthropic-ai`
- `PerplexityBot`
- `CCBot`

The explicit sections use the same `/api/` exclusion as the wildcard policy.

## `llms.txt` Contract

`public/llms.txt` is a concise, static site guide for AI agents and answer engines.

It should:

- identify the site as sorcererxw's Personal Site
- name the primary content surfaces
- link the sitemap and robots policy
- describe the canonical route rules
- stay short enough to be read before deeper crawling

## Verification

Required evidence:

- targeted SEO builder and sitemap tests
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- local HTTP checks for `/`, `/robots.txt`, `/llms.txt`, and `/sitemap.xml`
- direct metadata and JSON-LD inspection for `/`, homepage filter URLs, `/blog`, and one article detail URL
- browser verification for `/` because homepage structured data changes share the rendered route
