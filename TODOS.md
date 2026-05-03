# TODOs

## Rotate and externalize blog2 secrets

What:
- remove committed Notion and Telegram secrets from `web/apps/blog2/src/config/server.ts`

Why:
- the repo still contains plaintext secrets even though thoughts runtime no longer needs them

Pros:
- reduces secret exposure risk
- aligns the local sync command with explicit environment-based credentials

Cons:
- requires coordinated local and deployment env setup
- may touch code outside the thoughts slice

Context:
- thoughts runtime no longer depends on Telegram secrets, but the repo still carries committed values
- the local sync command now expects `TELEGRAM_APP_ID`, `TELEGRAM_APP_SECRET`, and `TELEGRAM_TOKEN`

Depends on / blocked by:
- none

## Add sync drift guard for thoughts snapshot

What:
- add a `--check` mode or CI guard that validates the checked-in thoughts snapshot is current and stable

Why:
- manual sync can drift, and the failure mode is a stale or unexpectedly reshaped public snapshot

Pros:
- catches nondeterministic ordering and accidental snapshot drift before deploy
- turns the sync command into a safer content pipeline

Cons:
- adds one more maintenance point to the local content workflow
- needs a clear policy for when snapshot changes are expected

Context:
- the current refactor intentionally uses a manual `sync:thoughts` flow
- the repo now relies on `src/domains/thoughts/thoughts.snapshot.json` as the public source of truth for `/thoughts`

Depends on / blocked by:
- depends on the new snapshot contract staying stable
