# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Andersend is a personal transactional email platform (Resend-like), built for a single developer's
own projects — no billing, multi-tenancy, or public signup in this iteration. It's a pnpm/Turborepo
monorepo: a Hono API on Cloudflare Workers, an Analog (Angular) dashboard, an Analog marketing
landing page, and shared packages for contracts/database/email logic/SDK.

**Read `README.md`, `ARCHITECTURE.md`, and `context.md` before making non-trivial changes.**
`ARCHITECTURE.md` has the request/queue flow diagrams and entity/status-lifecycle details;
`context.md` records *why* things are built the way they are (deliberate omissions, rejected
alternatives) — check it before "fixing" something that looks incomplete, since it may be
intentionally out of scope for this iteration.

## Commands

Run from the repo root unless noted. Turborepo fans these out to every workspace package; add
`--filter=@andersseen/<name>` to target one (e.g. `--filter=@andersseen/api`).

```bash
pnpm dev                 # API (8787) + dashboard (5173) + landing page (4200) together
pnpm dev:api             # API only
pnpm dev:dashboard       # dashboard only
pnpm dev:web             # landing page only

pnpm build               # production build of every app/package
pnpm lint                # ESLint across the monorepo
pnpm typecheck           # tsc --noEmit across the monorepo
pnpm test                # Vitest across every package/app (contracts, database, email-core,
                          # email-templates, sdk, api, dashboard)
pnpm test:e2e            # Playwright smoke test (auto-starts API + dashboard dev servers)

pnpm setup:local         # install + db:migrate:local + db:seed:local (first-time / reset setup)
pnpm db:migrate:local    # apply D1 migrations locally
pnpm db:seed:local       # wipe + reseed local D1 data (also POST /v1/dev/reset at runtime)

pnpm deploy:dashboard    # build + wrangler deploy for apps/dashboard
pnpm deploy:web          # build + wrangler deploy for apps/web (apps/api has no deploy yet)

pnpm format              # prettier --write across ts/tsx/md/json
```

**Single test file** — Vitest workspaces don't take a root-level path filter, so `cd` into the
package first:

```bash
cd apps/api && pnpm test -- emails.test          # or any substring of the file name
cd packages/email-core && pnpm test -- template-renderer
```

`apps/api` tests run under `@cloudflare/vitest-pool-workers` against a Miniflare-simulated D1
instance (migrations applied via `apps/api/test/apply-migrations.ts`), so they're integration
tests, not pure unit tests — expect them to be slower and to need the workspace's `wrangler.jsonc`.

Node.js 22+ and pnpm via Corepack (`corepack enable`) are required. Package manager is pinned:
`pnpm@9.15.0`.

## Architecture

### Dependency direction

`apps/*` depend on `packages/*`; packages never depend on apps. Within packages, `database`
depends on `email-core` + `email-templates` *only* for its seed generator
(`packages/database/src/seed.ts`) — the repository/mapper code the API uses at request time has no
such dependency.

```text
apps/
  api/          Hono Cloudflare Worker — exports both `fetch` and `queue` from one script
  dashboard/    Analog (Angular 21, zoneless, signals) static SPA — talks only to the API via the SDK
  web/          Analog static marketing page — no API calls, no SDK dependency
packages/
  contracts/         Zod schemas + inferred types — single source of truth for every API shape
  database/           D1 migrations, repositories (typed query functions), mappers, seed data
  email-core/         Provider interface, template rendering, status lifecycle, processing service
  email-templates/    Built-in template content (welcome, email-verification, project-notification)
  sdk/                Typed fetch client wrapping the HTTP API, built on `contracts`
  typescript-config/  Shared tsconfig bases (library / worker / angular)
  eslint-config/      Shared eslint flat configs (base / worker / angular)
```

### Request flow (`apps/api`)

1. `fetch` handler (`apps/api/src/index.ts` → `app.ts`) runs global middleware in order: request
   ID, structured JSON logging, CORS, then registers the global error handler.
2. `/health` is public; everything under `/v1/*` goes through `authMiddleware`
   (`apps/api/src/middleware/auth.ts`), which resolves a Bearer token to a project via an
   `ApiKeyAuthProvider` and sets `projectId` on the context.
3. Route handlers (`apps/api/src/routes/*.ts`) validate input with Zod (a `validate()` wrapper
   around `@hono/zod-validator` that normalizes failures into the shared `ApiError` envelope), then
   call `packages/database` repository functions directly — **no raw SQL and no business logic in
   route handlers**.
4. `POST /v1/emails` additionally resolves a template, renders it via `email-core`'s
   `renderTemplate`, inserts the email as `queued`, and sends an `EmailJob` to the Cloudflare Queue.
5. Every response is validated against the shared `contracts` schemas on both ends (API and
   dashboard/SDK), so a shape drift fails loudly instead of silently.

### Queue processing

The consumer (`apps/api/src/queue.ts`) is a thin adapter — it validates the message, builds an
`EmailProcessingStore` and an `EmailProvider`, then delegates all lifecycle logic to `email-core`'s
`processEmailJob`. That function loads the email and no-ops if its status isn't `queued`, which is
what makes redelivery/duplicate processing safe. Terminal outcomes (`delivered`, `failed`) always
ack; only unexpected exceptions call `message.retry()`. Local Cloudflare Queues run in-process via
Miniflare (bundled with Wrangler), so `wrangler dev` runs producer and consumer together with no
extra setup.

Email status lifecycle (`packages/contracts/src/email-status.ts`, enforced by
`canTransitionEmailStatus`):

```text
queued → processing → sent → delivered
                    ↘ failed        ↘ failed
```

### Provider and auth abstractions

Both are swapped purely via environment/config — never touch route or queue code to change them:

- `EmailProvider` (`packages/email-core/src/provider.ts`): `MockEmailProvider` (default) fails
  deterministically when `fail@example.com` appears in `to`/`cc`/`bcc` (used by tests/seed data to
  exercise the failure path); `CloudflareEmailProvider` calls the `env.EMAIL.send()` binding.
  Selected by `apps/api/src/lib/provider-factory.ts` from `EMAIL_PROVIDER`.
- `ApiKeyAuthProvider` (`apps/api/src/lib/auth-provider.ts`): `DevApiKeyAuthProvider` is the only
  implementation — compares the Bearer token to `env.ANDERSEND_API_KEY` and resolves the single
  seeded project. The `api_keys` table/repository already exist for a future DB-backed provider.

### Dashboard

The dashboard never talks to D1 or builds SQL — it only calls `@andersseen/sdk`
(`apps/dashboard/src/app/core/api-client.service.ts` is the single instantiation point), which
validates every request/response against `@andersseen/contracts`. No hardcoded arrays stand in for
API data anywhere. The one exception: the template editor imports `renderTemplate` from
`email-core` directly for a live, unsaved-edit preview (the server can only preview what's stored).

UI ecosystem responsibility split — keep this consistent when adding UI:

- **Volt UI** (`@voltui/components`) — every discrete styled control (buttons, cards, inputs,
  selects, badges, tabs, dialogs/drawers, tables, pagination, form fields).
- **Quartz Headless** (`quartz-headless`) — orchestration Volt doesn't own: toast queue
  (rendered through Volt's `<volt-toast>`), advanced tooltips, overlay positioning.
- **Angular Movement** (`angular-movement`) — entrance/stagger animations, disabled globally under
  `prefers-reduced-motion: reduce`.
- **Lumen Icons** (`lumen-icons`) — the only icon source in the dashboard.

Angular is pinned to `^21.2.0` (not 22.x) because Volt UI/Quartz/Angular Movement/Lumen Icons all
declare `^21.x` peer ranges — don't bump Angular without checking those peers first.

### Database

D1 migrations live in `packages/database/migrations` but are applied *from* `apps/api` (its
`wrangler.jsonc` points `migrations_dir` there). Five tables, all scoped by `project_id`:
`projects`, `api_keys` (stores only `prefix` + SHA-256 `key_hash`, never plaintext), `templates`,
`emails` (JSON-string array/object fields, (de)serialized in `packages/database/src/mappers.ts`),
`email_events` (append-only audit trail per email).

## Conventions worth knowing

- TypeScript strict mode everywhere; shared tsconfig bases in `packages/typescript-config`.
- ESLint flat configs shared via `packages/eslint-config` (`base`/`worker`/`angular` variants) —
  don't hand-roll a new eslint config per package.
- `deploy` scripts are plain `wrangler deploy` (build happens via Turborepo's `dependsOn: ["build"]`
  for the `deploy` task) — invoke via `turbo run deploy` or `pnpm run deploy`, not bare
  `pnpm --filter <pkg> deploy`, since that hits pnpm's own built-in `deploy` subcommand instead of
  the workspace script.
- Template interpolation is a deliberately simple `{{variableName}}` regex substitution with
  per-variable HTML escaping (`packages/email-core/src/template-renderer.ts`) — not a general
  template engine; don't extend it into one.
- Secrets are gitignored; only `.env.example` / `.dev.vars.example` are tracked. Copy them per the
  README before running anything locally.
- `apps/api` is intentionally not wired into CI deploys yet (needs a real D1 database, queue, and
  onboarded Email Service domain) — don't add a deploy job for it without checking `context.md` and
  README's "Future Cloudflare deployment" section first.
