# Telegram Public Page Runtime Ingestion Plan

Date: 2026-05-17

## Goal

Replace checked-in Telegram thoughts snapshots and client/session-based ingestion with render-time crawling of the public `tech_bb` Telegram channel using Next revalidation.

## Implementation Steps

1. Remove the old sync path.
   - delete the local `sync:thoughts` entrypoint
   - remove `@mtcute/*` dependencies and client implementation
   - keep the stable `ThoughtListItem` shape used by rendering

2. Add the public-page parser.
   - use `cheerio` for direct DOM parsing
   - parse message id, date, link, rich text, replies, forwards, reactions, direct photos, and link preview data
   - infer photo dimensions from inline `width`, `height`, and `padding-top` where Telegram exposes them

3. Add the full crawler.
   - start at `https://t.me/s/tech_bb`
   - follow `a.js-messages_more[data-before]` / `?before=<id>`
   - dedupe ids and sort newest first
   - stop on exhausted pagination, repeated pagination, fetch failure, or safety cap
   - pass `next.revalidate = 600` to runtime fetches

4. Wire runtime rendering.
   - make `listThoughts()` async and call the crawler during server rendering
   - keep homepage and `ThoughtsPage` consumers on the same domain function
   - remove snapshot imports

5. Render every image.
   - change Overview Feed media from one preview to an array
   - map all Telegram direct photos plus link-preview photos into feed media
   - render multi-image Telegram posts as a responsive grid while preserving the existing single-image layout

6. Verify.
   - parser and crawler unit tests
   - feed and thoughts render tests
   - typecheck, lint, Next build, OpenNext build
   - OpenNext preview HTTP check for `/?source=telegram`
   - browser check for rendered Telegram cards, images, rich text, ordering, and no horizontal overflow

## Done Criteria

- no active source/config reference to `TELEGRAM_SESSION`, `@mtcute/*`, Telegram clients, or `sync:thoughts`
- `/?source=telegram` renders public `tech_bb` content from runtime crawl data
- all parsed images from each Telegram post are represented in the feed
- Telegram cards remain newest-first and preserve rich text
- living docs record the architecture change and verification evidence
