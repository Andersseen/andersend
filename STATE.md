# State

Snapshot of where the project actually is right now — update this at the end of a session that
changes it. This is the "what's true today" doc; `ROADMAP.md` is "where we're headed" and
`context.md` is "why we built it this way." Don't let this file go stale — a wrong STATE.md is worse
than none, since the next session will trust it.

**Last updated:** 2026-07-30

## Current phase

**Phase 0 (Foundation) is complete; Phase 1 (real Cloudflare deployment for `apps/api`) has not
started.** See `ROADMAP.md` for what Phase 1 involves.

## What's live

- `apps/api`: fully built, tested (Miniflare/D1 integration tests), **not deployed** — runs
  locally only (mock email provider, dev API key). No CI deploy job for it yet.
- `apps/dashboard` and `apps/web`: built and CI-deployed to Cloudflare Workers on every push to
  `main` (`deploy-dashboard` / `deploy-web` jobs in `.github/workflows/ci.yml`). The
  `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` repo secrets are set (confirmed via
  `gh secret list`) — check the latest `main` run's `deploy-*` job conclusions if you need to know
  whether the most recent deploy actually succeeded.
- `main` branch protection: GitHub rulesets applied via `gh api` to both
  `Andersseen/andersend` and `Andersseen/imageryx` — PR required, 1 approval, dismiss-stale-reviews,
  conversation resolution required, required status check (`Lint, typecheck, test, build`, the real
  CI job name on both repos), branch-must-be-up-to-date, no force-push/deletion, applies to admins,
  single bypass actor (`Andersseen`, `bypass_mode: always`) for emergencies.
- Agentic-dev scaffolding (this change, branch `chore/agentic-dev-setup`): `AGENTS.md` added as the
  single instructions source; `CLAUDE.md` trimmed to a pointer at it; OpenSpec (`@fission-ai/openspec`
  v1.7.0) initialized for Claude Code (`openspec/config.yaml`, `.claude/skills/openspec-*`,
  `.claude/commands/opsx/*`) with no specs/changes yet — `openspec/specs/` and `openspec/changes/`
  populate as real changes get proposed; `ROADMAP.md` and this file added.

## In flight / not yet committed

- The branch above (`chore/agentic-dev-setup`) has not been committed or opened as a PR yet — it's
  sitting as working-tree changes pending review.

## Next up

Phase 1 from `ROADMAP.md`: provision the real D1 database, queue, and Email Service domain, then
deploy `apps/api` for real. Nothing in that phase has started.

## Known gaps to keep in mind

- No API key lifecycle management yet (`ROADMAP.md` Phase 2) — only the single dev key works.
- `apps/api` CI wiring deliberately excludes a deploy job until Phase 1 lands (see `context.md`).
