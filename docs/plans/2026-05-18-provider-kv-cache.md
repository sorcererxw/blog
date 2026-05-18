# Provider KV Cache Plan

Date: 2026-05-18

## Goal

Wrap every external public content provider with a thin KV cache at route assembly time, without moving cache policy into provider internals.

## Steps

1. Add a generic provider KV cache helper.
   - support no-op, memory, and KV-backed implementations
   - preserve `Date` values across JSON storage
   - use `expirationTtl = 600`

2. Add provider wrapper functions.
   - wrap Notion home, article list, project list, and article detail source interfaces
   - wrap the Telegram thoughts provider function
   - keep cache keys explicit and provider-specific

3. Wire public route assembly.
   - homepage uses wrapped providers for home, article list, projects, and thoughts
   - article detail uses the wrapped article detail provider
   - sitemap uses the wrapped article list provider

4. Verify.
   - targeted unit tests for provider cache hit/miss behavior and `Date` revival
   - targeted route/provider tests where existing fixtures make sense
   - typecheck, lint, and build
   - HTTP timing check against local OpenNext preview

## Done Criteria

- provider internals remain free of KV cache policy
- public route assembly uses provider wrappers around all external providers it calls
- cache keys and TTL are documented and tested
- task ledger records verification and any remaining performance risk
