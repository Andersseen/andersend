## Context

The `api_keys` table (`prefix`, `key_hash`, `revoked_at`, `last_used_at`), the
`getActiveApiKeyByPrefix`/`touchApiKeyLastUsed` repository functions and the
`ApiKeyAuthProvider` interface already exist; only `DevApiKeyAuthProvider` is wired. The seed
already stores the dev key `and_dev_local` as prefix `and_dev_` + hash. `CloudflareEmailProvider`
and the `send_email` binding are implemented but never exercised for real. See proposal.md for
motivation.

## Goals / Non-Goals

**Goals:** a first manual production deploy that FalcoTech's server can call with its own key;
no change to route handlers, contracts or the SDK.

**Non-Goals:** key management endpoints/UI, multiple projects in the dashboard, CI deploy for the
API, bounce/delivery webhooks (emails stay at `sent`).

## Decisions

- **Key format `and_<id8>_<secret>`, prefix = everything up to and including the second `_`.**
  This makes the existing dev key (`and_dev_local` → `and_dev_`) a valid instance of the same
  format, so one lookup path covers both. `id8` is 8 random lowercase alphanumerics (unique
  enough for a single developer; the mint script refuses a prefix that already exists — see
  risks), the secret is 32 random bytes base64url. Alternative: a separate
  public key id column — rejected, needs a migration for no gain.
- **Unsalted SHA-256 is fine here.** Keys are 256-bit random, so salting/slow hashing adds nothing
  against brute force; it matches what the seed already stores. Hash comparison is
  constant-time to avoid leaking prefix matches through timing.
- **Composite provider instead of replacing the dev one.** `DatabaseApiKeyAuthProvider` runs
  first; `DevApiKeyAuthProvider` is consulted only when `ENVIRONMENT !== "production"`. Keeps
  local setups without a seeded key working and keeps the test suite unchanged. Production
  additionally refuses the `and_dev_` prefix so an accidentally seeded remote DB is not an open
  door.
- **`last_used_at` via `executionCtx.waitUntil`** so the write never adds latency to the request.
- **Mint keys with a Node script, not an HTTP endpoint.** The very first production key has to be
  created without an existing key anyway; the script mirrors `scripts/seed-local.ts` (build SQL →
  temp file → `wrangler d1 execute [--local|--remote]`). `INSERT OR IGNORE` creates the project
  row when missing so a fresh production DB needs nothing else before the first send.
- **`env.production` in `wrangler.jsonc`** rather than editing top-level vars: local dev and tests
  keep `mock`/`local` untouched, and `wrangler deploy --env production` is explicit. Wrangler
  environments do not inherit bindings, so D1/queue/send_email are repeated there. The worker name
  becomes `andersend-api-production`; the queue is shared by name.
- **`CORS_ORIGINS` as a comma-separated var** read per request (Hono's `cors` accepts a function
  for `origin`). Server-to-server callers like FalcoTech don't need CORS at all.

## Risks / Trade-offs

- [Placeholder `database_id` in `env.production`] → `wrangler deploy --env production` fails
  until the real id from `wrangler d1 create` is pasted in; documented as step 1 of the runbook.
- [Cloudflare Email Sending plan limits: sending to arbitrary recipients may require Workers
  Paid] → FalcoTech only sends to its own inbox; verify plan requirements during provisioning.
- [Prefix collision between two minted keys] → 36^8 space for a handful of keys; the auth lookup
  uses `.first()`, so the script checks the prefix is unused before inserting.
- [Emails never move past `sent`] → acceptable until delivery webhooks exist; dashboard shows
  `sent` as success.

## Migration Plan

1. Merge this change (no runtime effect on local dev).
2. One-time provisioning: `wrangler d1 create andersend-db` (paste id), `wrangler queues create
andersend-emails`, `wrangler email sending enable andersseen.dev`.
3. `pnpm db:migrate:remote`, `pnpm deploy:api`, then mint a key with `--remote` for FalcoTech.
4. Rollback: the consumer switches back to Resend; the Worker can be left deployed or deleted.
