# Blog2 Direct Telegram Thoughts Design

Superseded by: `web/apps/blog2/docs/specs/2026-04-06-blog2-thoughts-snapshot-design.md`

## Summary

Change the `blog2` thoughts page from a cron-populated KV snapshot flow to a request-time Telegram read flow.

The new flow reads Telegram channel history directly during the `/thoughts` page request, using MTProto bot authentication with `app_id`, `app_hash`, and `bot_token`.

## Why Change

The current thoughts page does not connect to Telegram during page requests.

- `web/apps/blog2/src/app/thoughts/page.tsx` reads a cache-backed source
- `web/apps/blog2/src/integrations/telegram/thoughts.ts` fell back to demo data when no KV snapshot existed
- `web/apps/blog2/src/app/api/cron/thoughts/route.ts` was the only live Telegram read path

This means the page can appear disconnected from Telegram even though the rendering code itself is functioning as designed.

The desired product behavior is different:

- the page should try to read Telegram directly on every request
- the page must not depend on cron freshness for correctness
- if Telegram access fails, the page should return an empty feed instead of demo content

## Scope

### In Scope

- direct Telegram reads for the public thoughts page
- bot-authenticated MTProto access using the existing Telegram credentials model
- empty-state fallback when Telegram reads fail
- documentation and verification updates for the new flow

### Out of Scope

- user-session authentication
- Durable Objects or other persistent connection coordinators
- admin or manual session bootstrap UIs
- background refresh jobs
- KV-backed primary reads for thoughts
- redesigning the thoughts card UI

## Product Behavior

### Successful Request

When a request reaches `/thoughts`:

1. the page asks a Telegram integration for current channel messages
2. the integration authenticates with the existing bot credentials
3. it fetches channel history and returns normalized thought records
4. the page renders those records newest first

### Failure Behavior

If Telegram initialization, authentication, or history reads fail:

- the server logs the failure
- the page renders an explicit empty thoughts state
- the page does not fall back to demo data
- the page does not depend on a cron-populated KV snapshot

## Architecture

### Route Layer

`web/apps/blog2/src/app/thoughts/page.tsx`

Responsibilities:

- resolve the direct Telegram thought source
- call the domain use case
- render the thoughts feed

Non-responsibilities:

- direct cache correctness
- cron coordination
- demo fallback decisions

### Domain Layer

`web/apps/blog2/src/domains/thoughts/list-thoughts.ts`

Responsibilities:

- accept a thought source that returns Telegram-shaped records
- normalize records into `ThoughtListItem`
- sort newest first
- treat source failures as an empty list for public rendering

The domain layer should stop treating KV as the primary correctness path for thoughts.

### Integration Layer

Telegram integration responsibilities:

- establish a live MTProto read path using `@mtcute/web`
- normalize message history into app-native thought records
- expose a simple loader shape to the page

## Authentication Model

Use bot authentication only.

- `TelegramAppID`
- `TelegramAppSecret`
- `TelegramToken`

This design assumes the bot is already present in the target channel and has permission to read the required history.

This design does not introduce a user login flow or user session storage.

## Storage Strategy

Cloudflare KV may remain in the codebase for other features, but it is no longer the primary read source for thoughts page correctness.

This slice does not introduce a new persistent storage layer for Telegram session reuse.

## Runtime Assumptions

- `@mtcute/web` remains the Telegram MTProto client for `blog2`
- request-time Telegram auth and channel reads are acceptable for this public slice even though they are slower than snapshot reads

## Risks

### Telegram Permission Risk

Bot authentication can succeed while channel-history access still fails if Telegram-side permissions are insufficient.

This design can improve app behavior, but it cannot bypass Telegram platform restrictions.

### Latency Risk

Request-time reads will be slower than KV snapshot reads because every request can trigger a fresh Telegram connection and history fetch.

That is acceptable for this slice because correctness and directness are prioritized over the old cron-based architecture.

## Verification Strategy

Required evidence for this change:

- targeted tests for domain fallback behavior and direct Telegram source behavior
- build verification for the simplified worker configuration
- HTTP verification for `/thoughts`
- browser verification for `/thoughts` when local browser automation is available
