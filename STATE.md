# State

Snapshot of where the project actually is right now — update this at the end of a session that
changes it. This is the "what's true today" doc; `ROADMAP.md` is "where we're headed" and
`context.md` is "why we built it this way." Don't let this file go stale — a wrong STATE.md is worse
than none, since the next session will trust it.

**Last updated:** 2026-11-20

## Current phase

**Phase 0 (Foundation) is complete. Phase 1 (real deployment of `apps/api`): code done on branch
`feat/api-deployment` (OpenSpec change `api-production-deployment`), Cloudflare provisioning not
started.** See `ROADMAP.md` Phase 1 for the remaining steps.

## What's live

- `apps/api`: built and tested, **not deployed yet**. Has a `production` Wrangler environment,
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

- `feat/api-deployment`: the `api-production-deployment` OpenSpec change (proposal, specs, design,
  tasks under `openspec/changes/`) and its implementation. To archive once merged and deployed.

## Next up

1. Provision Cloudflare (D1, queue, `andersseen.dev` Email Sending), `pnpm db:migrate:remote`,
   `pnpm deploy:api`, mint a key for FalcoTech.
2. Switch FalcoTech's contact form from Resend to Andersend (keep Resend as fallback).

## Known gaps to keep in mind

- `env.production`'s `database_id` is still the placeholder — `pnpm deploy:api` fails until step 1.
- Production emails stop at `sent` (no delivery webhooks).
- Key revocation is a manual SQL `UPDATE`; no create/rotate/revoke endpoints or UI yet.
