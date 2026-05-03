# Blog2 Cloudflare Image Delivery Design Spec

## Summary

Add an app-owned Cloudflare-backed image delivery layer to `web/apps/blog2` so the public site stops shipping raw third-party image URLs directly from Notion, Telegram, and demo content.

The goal is not "use Astro image APIs everywhere."

The goal is:

- shrink transferred bytes on the public blog
- serve responsive image variants from the existing Cloudflare zone
- keep the current Astro + React mixed view layer intact
- avoid turning image loading into framework-specific churn

## Why This Exists

`blog2` is now an Astro app deployed on Cloudflare, but its rendered images still mostly bypass the platform:

- article covers use raw remote URLs
- article detail hero and inline content images use raw remote URLs
- bookmark thumbnails use raw remote URLs
- thoughts photos use raw Telegram CDN URLs
- some icon-sized remote images are painted as CSS backgrounds

That means the current public app is leaving an obvious platform win on the table.

Cloudflare's image transformation URL format is specifically designed for this case: change the image URL in markup, let the zone serve transformed variants, and keep the rest of the app boring.

## Scope

### In Scope

- introduce a single app-owned image URL builder for remote images
- define stable presets for hero, content, card, thumbnail, and icon image usage
- adopt the loader across the current public surfaces that already render remote images
- keep existing React domain views reusable from Astro
- document the remote-origin and verification requirements

### Out of Scope

- uploading assets into the Cloudflare Images storage product
- rewriting all React views into `.astro` just to use `astro:assets`
- changing Notion content models to carry a new media schema
- reintroducing the old protobuf/image-info surface
- solving long-term image metadata refresh as part of this slice

## Current-State Inventory

The public runtime currently renders remote images in these places:

- `src/domains/article/article-list.tsx`: article card covers and URL icons
- `src/domains/article/article-detail-view.tsx`: article hero, inline image blocks, bookmark thumbnails, URL icons
- `src/domains/home/intro.tsx`: Notion-driven home page image blocks
- `src/domains/thoughts/thoughts-page.tsx`: Telegram photo cards
- `src/domains/stack/stack-list.tsx`: fixed-size URL icons as CSS backgrounds

The app already has a Cloudflare Images binding declared in `wrangler.jsonc`, but the current render path does not route these image requests through an app-owned transformation strategy.

For this slice, that existing binding is not the chosen delivery mechanism.

## Chosen Direction

Use Cloudflare image transformation URLs as the app's image loader strategy.

The app will build image URLs in this shape:

`/cdn-cgi/image/<OPTIONS>/<SOURCE_URL>`

This is the right first version because:

- it works with normal `<img>` markup and CSS background images
- it does not force Astro-only components into React-heavy domains
- it keeps transformation logic explicit and app-owned
- it matches the current Cloudflare hosting model without adding a new proxy route

This slice explicitly does **not** treat the existing `images` binding as interchangeable with `/cdn-cgi/image` transforms.

## Rejected Directions

### Rewrite image call-sites to Astro `<Image />` first

Rejected for the first slice.

Astro's Cloudflare adapter can use Cloudflare-backed image services, but most current image rendering lives inside shared React views, not Astro-owned templates. Forcing a framework rewrite just to gain a loader is the wrong trade.

### Add a custom Worker proxy route for every image

Rejected.

This adds a new routing surface, new failure modes, and new cache behavior when Cloudflare already supports URL-driven transformations directly at the zone edge.

### Keep raw URLs and only optimize future pages

Rejected.

That preserves the existing waste on the highest-traffic surfaces and turns the image layer into permanent drift.

## Architecture

### Core Boundary

Introduce a small image-delivery module that owns:

- transformation presets
- bypass rules
- Cloudflare option formatting
- `srcset` width generation where needed

The rest of the app should ask for a transformed URL or a transformed image descriptor. It should not hand-roll `/cdn-cgi/image/...` strings in components.

### Suggested Shape

```text
src/
  lib/
    images/
      cloudflare.ts
      presets.ts
  components/
    media/
      responsive-remote-image.tsx
```

The exact filenames can move slightly if the existing component structure suggests a better home, but the boundary should stay:

- low-level URL builder in `lib`
- React-friendly rendering helper in `components`
- no Cloudflare option strings scattered across domain components

### Preset Model

The first version should use a small preset vocabulary:

- `hero`
- `article-card`
- `content-image`
- `bookmark-thumb`
- `thought-photo`
- `icon`

Each preset should define the minimum useful options, for example:

- width ceilings
- quality
- fit mode
- format auto-negotiation

Do not start with every Cloudflare knob.

This layer should stay obvious enough that a new contributor can see how a given image is supposed to behave in under 30 seconds.

### Bypass Rules

The loader must intentionally bypass cases where transformation is wrong or unnecessary.

At minimum:

- local same-origin assets such as `/favicon.svg`
- emoji icons
- SVGs that should stay as SVGs
- missing or malformed URLs

The plan may also choose to bypass formats that are not worth transforming in the first slice if tests or browser checks show regressions.

### Remote Origin Reality

Current image sources already span multiple external origins:

- Unsplash demo covers
- Telegram CDN photo URLs
- Notion-driven remote images and file URLs

Cloudflare remote-image transformations require the zone to allow the relevant source origins. This must be treated as part of the feature, not an afterthought hidden in dashboard state.

The documentation for this slice must name the currently required origins and call out that new image sources need to be added intentionally.

The implementation must ship with a deny-by-default host policy for remote image transforms.

### Dimension Strategy

The app already has mixed image metadata quality:

- thought photos usually include width and height
- article detail image blocks can include width and height
- article covers and bookmark thumbnails often do not carry stable dimensions in app models

This slice should not block on solving metadata for every surface.

Instead:

- use existing dimensions where they already exist
- preserve current width/height props when available
- add `sizes` and `srcset` where the rendered layout is known
- defer deeper metadata backfill to the existing image-metadata roadmap work

## Visual Contract

This slice must not treat "optimized image" as a purely technical concern.

Each migrated surface needs an explicit contract for:

- aspect-ratio behavior when dimensions are missing
- crop versus contain behavior
- eager versus lazy loading
- what the user sees when media is missing, bypassed, or broken

The first implementation plan should carry this at the surface level, not as a generic promise.

## Product Rules

### What Must Change for Users

- large public images should load through Cloudflare-transformed URLs instead of raw third-party URLs
- responsive surfaces should stop always downloading the largest variant
- high-visibility media surfaces should keep their current layout and not regress visually

### What Must Not Change for Users

- route structure
- content semantics
- article body order
- current shell and navigation
- the ability to render third-party remote media

## Verification Contract

This feature changes rendered media behavior, so completion requires:

1. targeted automated tests for the URL builder and the touched render surfaces
2. `build` and `preview` verification
3. HTTP inspection of the changed pages
4. browser verification that the affected pages still render correctly and that image requests are hitting transformed Cloudflare URLs

## Success Criteria

This slice is successful when:

- `blog2` has one explicit remote-image loading strategy
- the highest-traffic image surfaces use it
- the implementation does not depend on rewriting the mixed Astro + React view layer
- docs record the required Cloudflare source-origin assumptions and verification steps
- the feature shows measurable public-route value, not just cleaner internals
