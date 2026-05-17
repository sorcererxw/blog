# Telegram Public Page Runtime Ingestion Design

Date: 2026-05-17

## Purpose

Render the public `tech_bb` Telegram channel in the Personal Site Overview Feed without a Telegram client, session, bot token, hosted RSSHub feed, or checked-in thoughts snapshot.

## Scope

Included:

- crawl public messages exposed by `https://t.me/s/tech_bb`
- follow Telegram public-page pagination through `a.js-messages_more[data-before]` / `?before=<id>`
- dedupe by message id and sort newest first
- preserve rich text segments for Overview Feed rendering
- expose all parseable direct photos plus link-preview photos to the feed renderer
- use Next fetch revalidation to avoid a full network crawl on every request

Excluded:

- private, deleted, missing, or unavailable Telegram messages
- MTProto, Telegram Bot API, `TELEGRAM_SESSION`, `@mtcute/*`, and hosted RSSHub feeds
- video/file/sticker ingestion beyond simple preview images Telegram exposes as public page images
- local `sync:thoughts` snapshot refresh workflows

## Data Flow

`/` server rendering calls `listThoughts()`.

`listThoughts()` calls the Telegram public-page crawler with `channelUsername = "tech_bb"` and a ten minute revalidation window. The crawler fetches the first public page, parses the visible messages, follows older-page pagination until exhausted or a safety stop is reached, then returns normalized Telegram records.

The domain layer converts records into `ThoughtListItem` values, then `thoughtToFeedItem()` converts them into Overview Feed items. Feed item media is an array so Telegram posts can display every parsed image instead of only the first image.

## Parser Contract

The parser is DOM-based and follows the public HTML shape used by Telegram channel pages:

- message wrapper: `.tgme_widget_message_wrap`
- message id: `.js-widget_message[data-post]`
- date/link: `.tgme_widget_message_date time` and parent link
- text: `.tgme_widget_message_text.js-message_text`
- direct photos: `.tgme_widget_message_photo_wrap`
- link previews: `.tgme_widget_message_link_preview`
- reply metadata: `.tgme_widget_message_reply`
- forwarded source: `.tgme_widget_message_forwarded_from_name`
- reactions: `.tgme_reaction`

Rich text is preserved as app-native segments for links, bold, italic, underline, strike, monospace, hashtags, quotes, and line breaks.

## Performance

Runtime crawling uses `fetch(..., { next: { revalidate: 600 } })`. The first request after cache expiry may crawl the public pagination chain; subsequent requests should reuse Next/OpenNext cache behavior for the revalidation window.

The crawler also has defensive stop conditions:

- no next link
- repeated URL
- repeated `before` token
- empty page
- fetch failure
- max page cap

## User-Facing Contract

- `/?source=telegram` shows the public `tech_bb` posts exposed by `t.me/s`.
- Items are ordered newest first.
- Text formatting remains visible in feed cards.
- All parseable images for a post are rendered through the existing `ResponsiveRemoteImage`, `/media/[id]`, and `/cdn-cgi/image` image path.

## Risks

- Telegram can change public HTML class names.
- `t.me/s` may not expose every historical/private/deleted message.
- Full public pagination can be slow on a cold cache if the channel history grows substantially.
