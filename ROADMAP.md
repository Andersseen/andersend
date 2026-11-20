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

## Phase 1 — Real Cloudflare deployment for `apps/api` (code done, provisioning pending)

Code side landed with the `api-production-deployment` OpenSpec change: `env.production` Wrangler
environment (`EMAIL_PROVIDER=cloudflare`, custom domain `api.mail.andersseen.dev`),
database-backed API keys, `CORS_ORIGINS`, `pnpm deploy:api` / `db:migrate:remote` /
`api-key:create`. Remaining, in order (README "Production deployment (API)"):

1. `wrangler d1 create andersend-db` — paste the id into `env.production` in
   `apps/api/wrangler.jsonc`.
2. `wrangler queues create andersend-emails`.
3. `wrangler email sending enable andersseen.dev`.
4. `pnpm db:migrate:remote`, `pnpm deploy:api`, mint a key with `--remote`.
5. Dogfood: switch FalcoTech's contact form (`src/server/routes/api/contact.post.ts`) from
   Resend to Andersend, keeping Resend as a fallback until it has proven itself.
6. Wire an `apps/api` deploy job into CI (mirroring `deploy-dashboard`/`deploy-web`, `needs: build`,
   push to `main` only).

## Phase 2 — API key lifecycle and dashboard login

Database-backed authentication and a CLI to mint keys exist (Phase 1). Not yet implemented:
create/rotate/revoke endpoints + dashboard UI, and a dashboard login so the deployed dashboard can
talk to the production API without baking a key into its static bundle.

## Later

- Delivery/bounce webhooks so production emails move past `sent`.
- Per-key rate limiting.

## Explicitly not planned (revisit only if the project's scope changes)

Per `context.md` / README "Current limitations" — these are deliberate omissions for the
single-developer scope, not gaps to quietly fill in:

- Billing, subscriptions, plans
- Teams, organizations, multi-tenancy, public registration/invites
- Advanced analytics, drag-and-drop email builder

If any of these become real requirements, that's a scope change worth discussing before it becomes
a change proposal — it affects the schema assumptions documented in `context.md`.
