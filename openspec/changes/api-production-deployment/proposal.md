## Why

`apps/api` only runs locally: it authenticates with a single hard-coded dev key, uses the mock
email provider, and has no production Wrangler config. That blocks dogfooding Andersend from the
author's own projects — the first target is FalcoTech's contact form, which today sends through
Resend. This change makes the API deployable and safely callable from another project's server.

## What Changes

- Database-backed API key authentication: Bearer tokens are matched against the existing
  `api_keys` table (prefix lookup + SHA-256 hash, revoked keys rejected, `last_used_at` updated).
  The `ANDERSEND_API_KEY` env fallback keeps working locally but is ignored in production, and
  the seeded `and_dev_` key is refused in production.
- A CLI (`pnpm --filter @andersseen/api api-key:create`) that mints a key, creates the project row
  if it does not exist yet, writes only the hash to D1 (local or remote), and prints the plaintext
  key once.
- A `production` Wrangler environment for `apps/api`: `ENVIRONMENT=production`,
  `EMAIL_PROVIDER=cloudflare`, real D1/queue/`send_email` bindings, and a custom domain route.
- CORS allowed origins configurable through a `CORS_ORIGINS` var instead of a hard-coded
  `http://localhost:5173`, so the deployed dashboard can call the API.
- Deploy and remote-migration scripts (`deploy:api`, `db:migrate:remote`) plus a README
  runbook for the one-time Cloudflare provisioning.

Non-goals: create/rotate/revoke HTTP endpoints and dashboard UI for keys (rest of Phase 2), a CI
deploy job for the API (added once a first manual deploy works), delivery webhooks, rate limiting.

## Capabilities

### New Capabilities

- `api-key-authentication`: how `/v1/*` requests are authenticated with per-key secrets stored as
  hashes, and how keys are minted.
- `api-production-deployment`: what changes in API behaviour when it runs in the production
  environment (real provider, dev-only routes hidden, configurable CORS).

### Modified Capabilities

None — `openspec/specs/` is empty; existing behaviour has not been back-filled.

## Impact

- `apps/api`: auth provider + middleware, `app.ts` CORS, `wrangler.jsonc` (new `env.production`),
  `env.d.ts`/generated types, new `scripts/create-api-key.ts`, package scripts.
- `packages/database`: API key format helpers (generate / parse prefix) and exporting
  `hashApiKey`.
- Root `package.json` scripts, `README.md`, `STATE.md`, `ROADMAP.md`, `context.md`.
- No database migration: the `api_keys` table already has every column needed.
