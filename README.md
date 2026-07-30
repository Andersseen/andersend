# Andersend

Andersend is a personal transactional email platform, inspired by Resend, built exclusively for
Andrii's own projects. It provides a typed API, a queue-backed sending pipeline, a polished
dashboard, and an SDK, all running locally today with a clear path to Cloudflare Workers.

This iteration is a **local-first foundation**, not a production SaaS. There is intentionally no
billing, authentication beyond a single API key, multi-tenancy, or public registration — see
[context.md](./context.md) for the full list of deliberate omissions.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo, Node.js 22+, TypeScript (strict mode)
- **Dashboard:** [Analog](https://analogjs.org/) (static Angular 21, zoneless, standalone
  components, signals), Tailwind CSS 4
- **API:** [Hono](https://hono.dev/) on Cloudflare Workers (ES modules), Cloudflare D1, Cloudflare
  Queues, Cloudflare Email Service adapter
- **Validation:** Zod, shared via `@andersseen/contracts`
- **UI ecosystem:** Volt UI (`@voltui/components`), Quartz Headless (`quartz-headless`), Angular
  Movement (`angular-movement`), Lumen Icons (`lumen-icons`)
- **Testing:** Vitest, `@cloudflare/vitest-pool-workers`, Angular Testing Library, Playwright

## Repository structure

```text
apps/
  web/                Analog marketing landing page (static SPA)
  dashboard/          Analog dashboard (static SPA)
  api/                Hono Cloudflare Worker (HTTP API + queue consumer)
packages/
  contracts/          Shared Zod schemas and types
  database/           D1 migrations, seed data, repositories
  email-core/         Provider-independent email logic (rendering, lifecycle, providers)
  email-templates/    Built-in templates (welcome, email-verification, project-notification)
  sdk/                Typed client (`@andersseen/sdk`) used by the dashboard and external projects
  typescript-config/  Shared tsconfig bases
  eslint-config/       Shared eslint configs
e2e/                  Playwright smoke test
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for request/queue flow diagrams and entity details.

## Requirements

- Node.js 22+
- pnpm (managed via Corepack — run `corepack enable` once if you haven't)

## Installation

```bash
git clone <this repo>
cd andersend
pnpm install
```

## Local setup

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/dashboard/.env.example apps/dashboard/.env   # optional, defaults already match

pnpm setup:local   # installs deps, applies D1 migrations, seeds local data
pnpm dev           # runs the API (8787), dashboard (5173), and landing page (4200) together
```

Open http://localhost:5173. The dashboard is pre-populated with a week of seeded emails across the
three built-in templates so every page has something to show immediately. Open
http://localhost:4200 for the marketing landing page that explains the project.

## Commands

| Command                 | Description                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `pnpm dev`              | Run the API, dashboard, and landing page together via Turborepo                                     |
| `pnpm dev:api`          | Run only the API (`:8787`)                                                                          |
| `pnpm dev:dashboard`    | Run only the dashboard (`:5173`)                                                                    |
| `pnpm dev:web`          | Run only the landing page (`:4200`)                                                                 |
| `pnpm build`            | Production build of every app/package                                                               |
| `pnpm lint`             | ESLint across the monorepo                                                                          |
| `pnpm typecheck`        | TypeScript project checks across the monorepo                                                       |
| `pnpm test`             | Unit/integration tests (Vitest) across the monorepo                                                 |
| `pnpm test:e2e`         | Playwright smoke test (starts both dev servers automatically)                                       |
| `pnpm deploy:dashboard` | Build and deploy the dashboard to Cloudflare Workers                                                |
| `pnpm deploy:web`       | Build and deploy the landing page to Cloudflare Workers                                             |
| `pnpm db:migrate:local` | Apply D1 migrations to the local database                                                           |
| `pnpm db:seed:local`    | Reset and reseed local data (also available at runtime via the dev-only `POST /v1/dev/reset` route) |
| `pnpm setup:local`      | `install` + `db:migrate:local` + `db:seed:local`                                                    |

## Application URLs

| App          | URL                          |
| ------------ | ---------------------------- |
| Landing page | http://localhost:4200        |
| Dashboard    | http://localhost:5173        |
| API          | http://localhost:8787        |
| Health check | http://localhost:8787/health |

## Environment variables

| Variable                 | Where                              | Purpose                                                                               |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------- |
| `ANDERSEND_API_KEY`      | `apps/api/.dev.vars`               | Bearer token accepted by `/v1/*` routes locally. Defaults to `and_dev_local`.         |
| `EMAIL_PROVIDER`         | `apps/api/wrangler.jsonc` (`vars`) | `mock` (default) or `cloudflare`.                                                     |
| `ENVIRONMENT`            | `apps/api/wrangler.jsonc` (`vars`) | `local` in this iteration.                                                            |
| `VITE_API_BASE_URL`      | `apps/dashboard/.env`              | Overrides the API origin the dashboard talks to. Defaults to `http://localhost:8787`. |
| `VITE_ANDERSEND_API_KEY` | `apps/dashboard/.env`              | Overrides the dev API key the dashboard sends. Defaults to `and_dev_local`.           |

Secrets are never committed: `.dev.vars` and `.env` are gitignored, and only `.env.example` /
`.dev.vars.example` are tracked.

## Database

D1 migrations live in `packages/database/migrations` and are applied from `apps/api` (where
`wrangler.jsonc` points `migrations_dir` at that folder):

```bash
pnpm db:migrate:local
pnpm db:seed:local
```

Seeding always clears and rebuilds the five tables (`projects`, `api_keys`, `templates`, `emails`,
`email_events`), so it's safe to re-run at any time. It seeds one project (`Andersseen Personal`),
one development API key display row, the three built-in templates, and roughly twenty emails
spread across the last seven days with a realistic mix of `delivered`/`failed` statuses.

## Tests

```bash
pnpm test        # contracts, database, email-core, email-templates, sdk, api, dashboard
pnpm test:e2e    # Playwright: send an email end-to-end through the mock provider
```

- `packages/contracts`, `packages/email-core`, `packages/email-templates`, `packages/sdk`: plain
  Vitest unit tests (validation, rendering, HTML escaping, idempotent processing, provider
  success/failure, SDK request shaping).
- `apps/api`: `@cloudflare/vitest-pool-workers` integration tests running against a real
  (Miniflare-simulated) D1 database — health, auth, send/list/get, idempotency replay, template
  preview, validation errors, and queue consumer processing (success, failure, and
  already-processed idempotent skip).
- `apps/dashboard`: Angular Testing Library — overview statistics rendering, the email status
  badge, send-email form validation, and successful form submission.
- `e2e/`: one Playwright flow — send an email from the dashboard, confirm it appears in the emails
  list, open its details page, and confirm the status reaches `Delivered` with a full event
  timeline (`queued` → `processing` → `delivered`).

## Deployment

Both apps are plain static builds (`dist/client`), but deploy to different Cloudflare products:
the dashboard is a Cloudflare Worker with static assets (`apps/dashboard/wrangler.jsonc`) — no
server-side code, just Cloudflare serving the built files with SPA fallback routing. The landing
page deploys to **Cloudflare Pages** instead (`apps/web/wrangler.jsonc`'s `pages_build_output_dir`)
— a deliberate exception for that one app; see `context.md` for why.

**Locally**, once you've run `wrangler login` once:

```bash
pnpm deploy:dashboard   # builds dist/client, then `wrangler deploy` from apps/dashboard
pnpm deploy:web         # builds dist/client, then `wrangler pages deploy` from apps/web
```

The Pages project only needs creating once, before the first deploy (already done for this repo):

```bash
cd apps/web && npx wrangler pages project create andersend-web --production-branch=main
```

**In CI**, `.github/workflows/ci.yml` deploys both independently (`deploy-dashboard` and
`deploy-web` jobs) on every push to `main`, after the shared `build` job passes. Both jobs use
[`cloudflare/wrangler-action`](https://github.com/cloudflare/wrangler-action) and require two
repository secrets, set under the GitHub repo's Settings → Secrets and variables → Actions:

| Secret                  | Where to get it                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare dashboard → My Profile → API Tokens → a token with **both** "Edit Cloudflare Workers" (dashboard) and "Cloudflare Pages: Edit" (web) permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar of any domain/Workers overview page                                                                                    |

If either secret is missing or invalid, the deploy jobs fail at the `wrangler-action` step —
lint/typecheck/test/build still run and pass independently on every PR.

The API (`apps/api`) is intentionally **not** wired into this — see "Future Cloudflare deployment"
below for what it still needs before it can deploy for real.

## Current limitations

This iteration is intentionally local-only. Not implemented (see `context.md` for the reasoning):

- Billing, subscriptions, teams, organizations, multi-tenancy, public registration
- Full API key lifecycle management (creating/rotating/revoking keys) — the schema and a
  read-only dashboard view exist, but only the single `ANDERSEND_API_KEY` dev key can authenticate
- Real Cloudflare Email Service sending (the adapter is implemented and selectable via
  `EMAIL_PROVIDER=cloudflare`, but requires a real onboarded sending domain that is out of scope
  here)
- Advanced analytics and drag-and-drop email building

## Future Cloudflare deployment (API)

The dashboard and landing page deploy today (see "Deployment" above). The API is the one piece
still not wired up for a real deployment — it's the intended next step once this foundation is
validated:

1. `wrangler d1 create andersend-db` and replace the placeholder `database_id` in
   `apps/api/wrangler.jsonc`.
2. `wrangler queues create andersend-emails` (the producer/consumer config already targets this
   queue name).
3. `wrangler email sending enable andersseen.dev`, then set `EMAIL_PROVIDER=cloudflare` (e.g. via
   an `env.production` block or a dashboard-set var) so `CloudflareEmailProvider` is selected
   instead of the mock provider.
4. Move `ANDERSEND_API_KEY` to `wrangler secret put ANDERSEND_API_KEY` (or migrate to the
   database-backed `api_keys` table via a new `ApiKeyAuthProvider` implementation — the
   authentication abstraction was built for exactly this swap).
5. Deploy with `wrangler deploy` from `apps/api`, then point `api.mail.andersseen.dev` at it and
   update `VITE_API_BASE_URL` for the deployed dashboard.

## Package compatibility notes

- Angular is pinned to `^21.2.0` across the dashboard because Volt UI, Quartz Headless, Angular
  Movement, and Lumen Icons all declare `@angular/core`/`@angular/common` peer ranges of `^21.x`;
  Angular 22 is out on npm but would fall outside those peer ranges.
- `@cloudflare/vitest-pool-workers@0.19.0` ships a new `cloudflareTest()` Vitest plugin (replacing
  the older `defineWorkersConfig` API) and requires Vitest `^4.x`, so the whole monorepo uses
  Vitest 4 for consistency.
- Cloudflare's Email Service now sends via a plain JSON `env.EMAIL.send({...})` call; the legacy
  `EmailMessage`/`mimetext` MIME-construction path is only needed for advanced cases and was not
  used here.
