# Personal Site Overview PRD

## Problem Statement

The current site is still shaped like a standalone public blog, with separate archive-style surfaces for writing, projects, thoughts, and stack. That structure no longer matches the desired product. The desired product is a Personal Site: one public homepage that introduces the author and then presents a unified Overview Feed containing Blog Entries, Projects, and Social Posts.

From the user's perspective, the problem is that the current site over-emphasizes "blog" as the product container. It makes writing, projects, and social updates feel like separate products instead of one authored identity. The homepage should become the primary personal overview, not a gateway into separate archives.

## Solution

Rebuild the public product around one primary homepage. The homepage begins with a Notion-backed Profile Hero, then renders a unified masonry Overview Feed from an app-owned Overview Feed Index.

The Overview Feed combines Blog Entries, Projects, and Social Posts through one Feed Module presentation system. Different Content Sources may use different ingestion paths, but they normalize into one Feed Item model before rendering. The site keeps Astro and Cloudflare as the runtime direction, preserves article detail pages as Content Details, and converts old archive routes into Compatibility Routes that redirect to homepage Filter Queries.

## User Stories

1. As a visitor, I want the first page I see to introduce the author, so that I understand whose site I am browsing.
2. As a visitor, I want the homepage to show writing, projects, and social posts together, so that I can understand the author from one overview.
3. As a visitor, I want the Overview Feed to feel unified, so that the site feels like one personal presence instead of several disconnected archives.
4. As a visitor, I want Blog Entries in the feed, so that I can discover long-form writing without opening a separate blog archive first.
5. As a visitor, I want Projects in the feed, so that I can discover public work and experiments alongside writing.
6. As a visitor, I want Social Posts in the feed, so that I can see short-form public updates without leaving the site immediately.
7. As a visitor, I want Feed Items ordered by Displayed Time, so that the feed reads naturally from newest to older content.
8. As a visitor, I want untimed Feed Items to appear after timed content, so that items without dates do not disrupt the chronological flow.
9. As a visitor, I want the Profile Hero to render the author's full Notion Profile Page content, so that the author can maintain the introduction in one place.
10. As a visitor, I want long Profile Hero content to be expandable on the same page, so that I can read more without losing access to the feed.
11. As a visitor, I want the Profile Hero to avoid pushing the feed too far down by default, so that the homepage still works as an overview.
12. As a visitor, I want filters for writing, projects, and social content, so that I can narrow the Overview Feed without switching pages.
13. As a visitor, I want Social Post filters by Social Source when available, so that I can focus on a source such as Telegram.
14. As a visitor, I want filter URLs to be shareable, so that I can share a filtered homepage state.
15. As a visitor using an old `/blog` link, I want to land on the writing filter, so that old links still take me to relevant content.
16. As a visitor using an old `/projects` link, I want to land on the projects filter, so that old project links remain useful.
17. As a visitor using an old `/thoughts` link, I want to land on the social filter, so that old thoughts links remain useful.
18. As a visitor, I want article detail links to continue working, so that long-form Blog Entries still have readable full pages.
19. As a visitor, I want Projects with External Targets to open their primary destination, so that I can reach the actual project quickly.
20. As a visitor, I want Projects with extra notes to expose those notes as secondary context, so that project explanations remain available without making every project a CMS page.
21. As a visitor, I want Social Posts to link to their original platform posts, so that I can inspect the canonical source.
22. As a visitor, I want unavailable external Social Posts to degrade gracefully, so that the feed does not pretend to own unavailable external content.
23. As a visitor on a media-heavy feed, I want media previews to load responsibly, so that the one-page feed remains usable.
24. As a search engine crawler, I want the sitemap to expose the new Personal Site structure, so that discovery reflects the active product.
25. As a search engine crawler, I do not want legacy archive routes or filter query URLs in the sitemap, so that indexing does not preserve outdated site structure.
26. As the author, I want to control special visual emphasis through Presentation Intent, so that important Feed Items can become feature modules without source-owned layout logic.
27. As the author, I want feature presentation to be manual-only, so that the feed does not over-promote items accidentally.
28. As a future maintainer, I want Module Size and Layout Estimates to be presentation-owned, so that Content Sources cannot create competing size calculations.
29. As a visitor, I want the server-rendered feed to remain readable before hydration, so that the feed does not depend on browser-only text measurement.
30. As the author, I want Displayed Time overrides separate from Source Published Time, so that I can control feed order without losing upstream publication metadata.
31. As the author, I want the first Social Source to use the existing Telegram snapshot, so that the first implementation ships without waiting on Twitter/X ingestion.
32. As a future maintainer, I want Twitter/X reserved in the model but not implemented in v1, so that later ingestion can be added without blocking the first slice.
33. As a future maintainer, I want the Overview Feed to read one app-owned index, so that homepage requests do not live-merge every Content Source.
34. As a future maintainer, I want failed source refreshes to preserve the last successful Overview Feed Index, so that one source failure does not break the homepage.
35. As a future maintainer, I want Feed Modules to share one presentation system, so that item types and Social Sources do not create parallel component families.
36. As a future maintainer, I want Stack Inventory to remain hidden from the primary structure, so that it does not become a fourth feed type by accident.

## Implementation Decisions

- Build around the domain language in `CONTEXT.md`: Personal Site, Profile Hero, Profile Page, Profile Content, Hero Expansion, Overview Feed, Overview Feed Index, Feed Item, Feed Module, Module Size, Feed Filter, Filter Query, Blog Entry, Project, Social Post, Social Source, Content Detail, External Target, and Feed Media Preview.
- Keep Astro and Cloudflare as the runtime direction. This PRD changes product structure, not the approved framework direction.
- Introduce a deep Feed Index module that exposes a small interface for building and reading normalized Feed Items. This module should encapsulate source mapping, sorting, Presentation Intent preservation, Displayed Time fallback, and last-successful-index behavior.
- Introduce a normalized Feed Item shape with item type, source metadata, Displayed Time, Source Published Time, optional Presentation Intent, destination, summary, media preview, and enough identity fields for stable rendering and filtering.
- Keep Content Source ingestion paths separate from presentation. Blog Entry, Project, and Telegram Social Post data can come from different adapters, but all must normalize into the same Feed Item model.
- Implement sorting with Displayed Time first, Source Published Time second, and untimed items at the bottom.
- Keep Displayed Time separate from Source Published Time. Displayed Time controls feed order. Source Published Time preserves upstream publication metadata.
- Do not allow Content Sources to provide Module Size, card height, column placement, or masonry estimates.
- Use a browser-side Feed Layout Engine to map Feed Items into presentation-owned Module Size and Layout Estimates after hydration.
- Render the server Overview Feed as a single-column fallback in Overview Feed Index order.
- Introduce a Profile Hero module backed by a single fixed Notion Profile Page. Do not introduce a profile database or active-record selection rule.
- Render full Profile Content from the Profile Page. Do not restrict the Profile Hero to a small whitelist of fields.
- Support same-page Hero Expansion for long Profile Content. Prefer native HTML/CSS behavior before introducing client-side hydration.
- Render the Overview Feed as one server-rendered response. Do not add v1 pagination or infinite scroll.
- Implement Feed Filters as server-rendered Filter Queries on `/`. Initial supported type filters are writing, projects, and social. Source filters should include Telegram once the Telegram Social Source is mapped.
- Keep filter controls as normal links or forms unless a concrete UX requirement later justifies a React island.
- Convert old archive routes into Compatibility Routes. `/blog` redirects to `/?type=writing`, `/projects` redirects to `/?type=projects`, and `/thoughts` redirects to `/?type=social`.
- Keep article details available as Content Details. Long-form Blog Entries can continue linking to article detail pages.
- Keep Stack Inventory hidden from the primary Personal Site structure and out of the Feed Item type set.
- Use the existing Telegram snapshot as the v1 Social Source. Reserve Twitter/X in the model, but do not implement Twitter/X ingestion in the first overview slice.
- Treat Social Posts as summaries of external canonical posts. Do not add standalone Social Post detail pages in v1.
- Treat Projects with External Targets as primarily outbound. If a Project has both an External Target and a Content Detail, the Content Detail is secondary context.
- Limit Feed Module media to Feed Media Previews. Do not embed full external media players in the feed.
- Reuse the existing image delivery and canonical media path where possible. Default feed media to lazy loading, with eager loading only for a small number of above-the-fold modules.
- Update sitemap discovery so it exposes `/` and Content Detail URLs, not legacy archive routes or filter query URLs.

## Testing Decisions

- Tests should assert external behavior and domain contracts, not component internals or incidental markup.
- Add focused unit tests for the Feed Index module. Good tests cover source mapping, item identity, type/source filters, sorting by Displayed Time, fallback to Source Published Time, untimed item placement, Presentation Intent preservation, and last-successful-index behavior.
- Add tests for Blog Entry to Feed Item normalization using the existing article list behavior as prior art.
- Add tests for Project to Feed Item normalization, including External Target priority, missing Displayed Time, and non-clickable projects.
- Add tests for Telegram snapshot to Social Post normalization using the existing thoughts/Telegram tests as prior art.
- Add tests for Feed Filter parsing and application. Good tests cover `type=writing`, `type=projects`, `type=social`, `source=telegram`, unsupported values, and combined filter behavior.
- Add component or static-render tests for Feed Module rendering. Good tests cover server fallback layout, presentation-owned compact, standard, and feature modules; destination behavior; media preview fallback; and source badges without creating source-specific component branches.
- Add tests for Profile Hero normalization and rendering. Good tests cover fixed Profile Page loading, full Profile Content rendering, default constrained rendering semantics, and native Hero Expansion availability.
- Add HTTP-level tests or `curl` verification for Compatibility Routes. Good checks confirm permanent redirect status and Location headers for `/blog`, `/projects`, and `/thoughts`.
- Add sitemap tests confirming `/` and article Content Details are included while `/blog`, `/projects`, `/thoughts`, and filter query URLs are excluded.
- Run the current repo verification stack for implementation slices: targeted tests first, then full tests or typecheck/build when shared modules or route behavior changes.
- Run browser verification for the final UI slice. Good browser checks confirm Profile Hero rendering, Hero Expansion, masonry feed layout, filter navigation, media loading, and absence of blocking console errors.

## Out of Scope

- Implementing Twitter/X ingestion in the first overview slice.
- Creating standalone Social Post detail pages.
- Turning Notion into a complete CMS for every external Social Post.
- Introducing D1 or another new storage system for the first overview implementation.
- Making Stack Inventory a public first-class section or Feed Item type.
- Preserving `/blog`, `/projects`, or `/thoughts` as primary archive pages.
- Adding infinite scroll or pagination to the v1 Overview Feed.
- Rebuilding article detail rendering beyond what is necessary to keep Content Details available.
- Reopening the Astro + Cloudflare runtime decision.

## Further Notes

- The existing Personal Site design spec and implementation plan are the source docs for this PRD.
- The implementation should proceed in vertical slices: Feed Domain Model, Profile Hero Source, Unified Overview Feed UI, then Compatibility Routes and sitemap updates.
- The strongest deep module opportunity is the Feed Index module because it can keep source-specific ingestion, sorting, filtering, defaults, and fallback behavior behind a stable testable interface.
- Existing article, project, thoughts, media, sitemap, and route tests provide useful prior art for the new tests.
- Issue tracker setup was inferred from the GitHub remote. The `ready-for-agent` label was created for this PRD issue.
