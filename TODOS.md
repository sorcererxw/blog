# TODOs

## Remove historical Telegram secret references from archived docs

What:
- audit archived migration notes for obsolete Telegram secret references and mark them historical where needed

Why:
- the current runtime crawler does not need Telegram credentials, but older notes may still describe the removed client/sync model

Pros:
- reduces secret exposure risk
- keeps future agents from reviving the old client-based ingestion path

Cons:
- archived docs are historical, so edits must avoid rewriting provenance

Context:
- current code has no `TELEGRAM_SESSION`, Telegram client, Bot API, MTProto, or `@mtcute/*` dependency

Depends on / blocked by:
- none

## Monitor Telegram public page crawler cold-start cost

What:
- add lightweight observability or a cap policy if `tech_bb` public pagination grows enough to make cold-cache rendering slow

Why:
- full crawl now happens at render time behind Next revalidation

Pros:
- makes revalidation behavior visible before it becomes a user-facing latency issue
- keeps the no-client/no-snapshot architecture intact

Cons:
- may require deployment metrics rather than local-only verification

Context:
- `listThoughts()` crawls `https://t.me/s/tech_bb` and follows public `before` pagination with `next.revalidate = 600`

Depends on / blocked by:
- depends on production traffic and channel growth
