# Roadmap

Where Andersend is headed, in order. This is a direction, not a promise with dates — a
single-developer project moves items around freely. When a phase's scope changes, update this file
and, if the reasoning behind the change is non-obvious, add a note to `context.md` too. For "what's
true right now," see `STATE.md`; for "why we built it this way," see `context.md`.

Non-trivial items below should go through an OpenSpec change (`/opsx:propose`) rather than landing
directly — see `AGENTS.md`.

## Phase 0 — Foundation (done)

- `apps/api` (Hono on Cloudflare Workers): auth, projects, templates, emails, queue-driven send
  pipeline, event audit trail.
- `apps/dashboard` (Analog/Angular, zoneless): full CRUD UI over the API via `@andersseen/sdk`, no
  hardcoded data.
- `apps/web`: static marketing/landing page.
- Shared packages: `contracts`, `database`, `email-core`, `email-templates`, `sdk`.
- Local dev loop: `pnpm dev`, D1 migrations + seed, mock email provider with deterministic failure
  case.
- CI (`.github/workflows/ci.yml`): lint/typecheck/test/build on every PR; `apps/dashboard` and
  `apps/web` deploy to Cloudflare Workers on push to `main`.
- `main` branch protection via GitHub rulesets on both `andersseen/andersend` and
  `andersseen/imageryx` (PR required, 1 approval, stale-review dismissal, conversation resolution,
  required status check, no force-push/deletion, admins included, single emergency bypass actor).
- Agentic-development scaffolding: `AGENTS.md` as the single instructions source (`CLAUDE.md` now
  just points to it), OpenSpec (`openspec/`) for spec-driven changes, `ROADMAP.md`/`STATE.md` for
  direction and live status.

## Phase 1 — Real Cloudflare deployment for `apps/api`

`apps/api` is the one piece not wired up for a real deployment yet (see README "Future Cloudflare
deployment (API)"). In order:

1. `wrangler d1 create andersend-db` — replace the placeholder `database_id` in
   `apps/api/wrangler.jsonc`.
2. `wrangler queues create andersend-emails` (producer/consumer config already targets this name).
3. `wrangler email sending enable andersseen.dev`, then set `EMAIL_PROVIDER=cloudflare` so
   `CloudflareEmailProvider` is selected instead of the mock provider.
4. Move `ANDERSEND_API_KEY` to `wrangler secret put ANDERSEND_API_KEY` (or replace it with a
   database-backed `ApiKeyAuthProvider` — see Phase 2, they can land together).
5. `wrangler deploy` from `apps/api`; point `api.mail.andersseen.dev` at it and update
   `VITE_API_BASE_URL` for the deployed dashboard.
6. Wire an `apps/api` deploy job into CI once the above is real (mirroring `deploy-dashboard`/
   `deploy-web`), gated the same way (`needs: build`, push to `main` only).

## Phase 2 — API key lifecycle

The `api_keys` table, repository functions, and `ApiKeyAuthProvider` interface already exist for
this. Not yet implemented: create/rotate/revoke endpoints and a database-backed provider to replace
`DevApiKeyAuthProvider`. Natural to pair with Phase 1 step 4 (moving off the single dev key anyway).

## Explicitly not planned (revisit only if the project's scope changes)

Per `context.md` / README "Current limitations" — these are deliberate omissions for the
single-developer scope, not gaps to quietly fill in:

- Billing, subscriptions, plans
- Teams, organizations, multi-tenancy, public registration/invites
- Advanced analytics, drag-and-drop email builder

If any of these become real requirements, that's a scope change worth discussing before it becomes
a change proposal — it affects the schema assumptions documented in `context.md`.
