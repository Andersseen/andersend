# State

Snapshot of where the project actually is right now — update this at the end of a session that
changes it. This is the "what's true today" doc; `ROADMAP.md` is "where we're headed" and
`context.md` is "why we built it this way." Don't let this file go stale — a wrong STATE.md is worse
than none, since the next session will trust it.

**Last updated:** 2026-11-20

## Current phase

**Phase 1: `apps/api` is deployed** (`andersend-api-production` on `https://api.mail.andersseen.dev`,
D1 `andersend-db` in WEUR, queue `andersend-emails`, migrations 0001–0006 applied, one key
`falcotech` minted). **Cloudflare Email Sending for `andersseen.dev` is not enabled yet**, so real
sends will fail until it is. See `ROADMAP.md` Phase 1.

## What's live

- `apps/api`: deployed manually (`pnpm deploy:api`) to `api.mail.andersseen.dev`. Has a `production` Wrangler environment,
  database-backed API keys (`and_<id8>_<secret>`, minted with `pnpm api-key:create`), and
  configurable CORS. Locally it still uses the mock provider. No CI deploy job.
- `apps/dashboard` and `apps/web`: built and CI-deployed to Cloudflare on every push to `main`
  (`deploy-dashboard` / `deploy-web` jobs in `.github/workflows/ci.yml`). The deployed dashboard is
  not pointed at a production API (it would need a login first; see `context.md`).
- `main` branch protection: GitHub rulesets on `Andersseen/andersend` and `Andersseen/imageryx`
  (PR required, 1 approval, required status check `Lint, typecheck, test, build`, no
  force-push/deletion, single bypass actor `Andersseen`).
- Agentic-dev scaffolding: `AGENTS.md`, OpenSpec 1.7.0 (run via
  `pnpm dlx @fission-ai/openspec@1.7.0` — not installed as a dependency), `ROADMAP.md`, this file.

## In flight / not yet committed

- OpenSpec change `api-production-deployment` (merged in PR #4) — archive once a real send works.

## Next up

1. `wrangler email sending enable andersseen.dev`, then a real test send to an own inbox.
2. Switch FalcoTech's contact form from Resend to Andersend (keep Resend as fallback); set
   `ANDERSEND_API_KEY` in Vercel.
3. CI deploy job for `apps/api`.

## Known gaps to keep in mind

- Production emails stop at `sent` (no delivery webhooks).
- Key revocation is a manual SQL `UPDATE`; no create/rotate/revoke endpoints or UI yet.
