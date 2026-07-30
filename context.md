# Context

Project decisions and assumptions recorded for future reference. See `ARCHITECTURE.md` for how
these decisions fit together and `README.md` for how to run everything.

## Product framing

- Andersend is **personal-only** for now — one project (`Andersseen Personal`), one API key, one
  developer. No billing, subscriptions, teams, organizations, multi-tenancy, or public
  registration in this iteration. The schema (`project_id` on every table, the `api_keys` table)
  is deliberately shaped so these can be added later without a data migration, but none of the
  surrounding product surface (invites, plans, roles) exists yet.
- No advanced analytics, no drag-and-drop email builder. The dashboard is a developer tool, not a
  customer-facing product.
- A marketing landing page (`apps/web`) was added later, once the platform itself was in a state
  worth showing to other people — it explains what Andersend is and why it's scoped the way it is,
  but stays purely static (no auth, no calls to `apps/api`) since there is nothing to sell or sign
  up for.

## Monorepo and tooling

- pnpm workspaces + Turborepo, as already set up in this repository; the default `create-turbo`
  Next.js demo apps (`apps/web`, `apps/docs`) and the `packages/ui` React stub were removed to make
  room for the real structure. `apps/web` was later reintroduced as the real Analog landing page
  (see "Landing page" below) — same slot, unrelated content.
- Node.js 22+, TypeScript strict mode throughout.
- Package versions were resolved against the npm registry at build time rather than assumed from
  training data (see "Package compatibility notes" in README.md) — in particular, Angular is
  pinned to `^21.2.0` (not the newer 22.x line) because Volt UI, Quartz Headless, Angular Movement,
  and Lumen Icons all declare `^21.x` peer ranges.

## Dashboard

- **Analog**, not a hand-rolled Vite+Angular setup — it's the framework named in the brief and
  gives file-based routing (`src/app/pages/**/*.page.ts`) for free.
- **Static** dashboard (`analog({ ssr: false })`), not SSR — there's no server-rendering benefit
  for an internal tool that only ever talks to a local/authenticated API; it also means the deploy
  (see "Deployment" below) is a plain static site with no server runtime to operate.
- **Zoneless** change detection (`provideZonelessChangeDetection()`), no `zone.js` in the app
  bundle — signals are the state model throughout (`signal`/`computed`/`effect`), consistent with
  "use signals for local and shared UI state." `zone.js` is still a *test-only* devDependency
  because `@analogjs/vitest-angular`'s `TestBed` integration currently peer-depends on it; it is
  never imported by application code.
- **Volt UI is "copy-and-own,"** but is consumed here as a normal npm dependency
  (`@voltui/components`) rather than copied into the repo, since the published package already
  ships compiled Angular components plus a self-registering Tailwind `@source` directive
  (`themes/core.css`) — there was no need for a local adapter or copy step.
- The **API keys** and **Settings** dashboard pages call a couple of small API routes
  (`GET /v1/api-keys`, and an extra `provider` field on `GET /health`) that weren't explicitly
  listed in the brief's route list, added because "the dashboard must use the real local API, not
  hardcoded arrays" outweighed strictly limiting the route surface to the enumerated list. Both
  reuse existing repository functions and Zod schemas — no new persistence logic.

## Landing page

- **Analog too** (`analog({ ssr: false })`), but without `@analogjs/router` — it's a single static
  page, not a multi-route app, so file-based routing would be an abstraction with nothing to route
  between. Anchor links (`#features`, `#how-it-works`, `#stack`, `#scope`) do the navigation.
  `main.server.ts` / `app.config.server.ts` are still present, matching the dashboard, purely for
  Analog's build-time prerendering pass to `dist/client/index.html`.
- **No `ApiClientService` and no `@andersseen/sdk` dependency** — the page is static marketing
  copy, not a data-driven view, so it never calls `apps/api`.
- Runs on port 4200 (Angular CLI's conventional default) specifically so it doesn't collide with
  the dashboard (5173) or the API (8787) when all three run together under `pnpm dev`.
- Reuses `quartz-headless`'s `TooltipDirective` on the tech-stack badges — the same primitive the
  dashboard's API keys page already uses for "Copy to clipboard" — so the stack list this page
  advertises is also the stack actually running underneath it.

## Deployment

- **Workers with static assets (`assets` in `wrangler.jsonc`), not Cloudflare Pages**, for both
  `apps/dashboard` and `apps/web`. Cloudflare's own docs now frame Pages as the legacy path (there's
  a dedicated "migrate from Pages" guide) and static-assets Workers get the same feature set as the
  API Worker already in this repo (`wrangler deploy`, `wrangler tail`, one dashboard, one deploy
  story) — no reason to run two different Cloudflare products for three apps.
- **No `main` script in either app's `wrangler.jsonc`** — an assets-only Worker (just `directory`
  + `not_found_handling`) is a first-class supported config; writing a
  `return env.ASSETS.fetch(request)` passthrough Worker would be pure boilerplate for two apps that
  have no server-side logic at all.
- `not_found_handling: "single-page-application"` on both — the dashboard needs it for deep links
  into Analog's file-based routes (`/emails/123`); the landing page doesn't strictly need it (one
  route, anchor links only) but it's harmless and keeps the two configs identical if `apps/web`
  ever grows a second route.
- **`deploy` is a Turborepo task** (`dependsOn: ["build"]`, `cache: false`) rather than a raw shell
  chain in the root scripts, so `pnpm deploy:dashboard` / `pnpm deploy:web` get turbo's build
  caching for free (skips the rebuild if `dist/client` is already current) instead of always
  rebuilding.
- **The per-app `deploy` script is deliberately just `wrangler deploy`**, not
  `vite build && wrangler deploy` — `deploy` collides with pnpm's own built-in `pnpm deploy`
  subcommand (workspace package extraction, unrelated to Cloudflare), so anything invoking it needs
  to go through `turbo run deploy` or `pnpm run deploy` (explicit `run`) rather than bare
  `pnpm --filter <pkg> deploy`, which would hit pnpm's built-in instead of the script.
- **CI deploys `apps/dashboard` and `apps/web` as two independent jobs** (`deploy-dashboard`,
  `deploy-web` in `.github/workflows/ci.yml`), both gated on `needs: build` and
  `github.ref == 'refs/heads/main'` (never on PRs), using
  [`cloudflare/wrangler-action@v4`](https://github.com/cloudflare/wrangler-action). Kept as two
  jobs instead of one combined job so either app can fail/redeploy independently and so the Actions
  UI shows per-app status. Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo
  secrets that are **not** set yet — the jobs will fail at the `wrangler-action` step until someone
  adds them (see README "Deployment" section).
- **`apps/api` was deliberately left out of this CI wiring** — unlike the two static apps, deploying
  it for real needs a provisioned D1 database, a created queue, and an onboarded Email Service
  sending domain, none of which exist yet (see "Future Cloudflare deployment (API)" in README.md).
  Wiring a deploy job for it now would just fail every time or deploy something without a working
  database.

## API

- One Cloudflare Worker (`apps/api`) exports both `fetch` and `queue` — this is what the brief
  calls "one Worker handles HTTP and queue events initially."
- Cloudflare's Email Service moved to a simpler JSON `env.EMAIL.send({...})` API sometime after
  most training data was captured; `CloudflareEmailProvider` uses that current API, not the legacy
  MIME/`mimetext` construction path, which is why `mimetext` is not a dependency anywhere in this
  repo.
- `@cloudflare/vitest-pool-workers@0.19.0` (current npm `latest`) ships a different API
  (`cloudflareTest()` Vitest plugin, `cloudflare:workers`/`cloudflare:test` imports) than older
  `defineWorkersConfig`-based examples online — the test setup here matches the currently-published
  package, verified against Cloudflare's own fixture repository rather than assumed.
- Local Cloudflare Queues are simulated by Miniflare (bundled with Wrangler 4) with no extra setup,
  so the "documented local fallback" the brief allows for was not needed — queue processing logic
  still lives in `packages/email-core` (not duplicated) so it would be trivial to add one later if
  a future Wrangler version ever required it.

## Email sending

- **Mock provider by default** everywhere local (`EMAIL_PROVIDER=mock`): resolves synchronously,
  never contacts anything external, and deterministically fails when `fail@example.com` appears in
  `to`/`cc`/`bcc` — this is what both the seed data and the test suites use to exercise the failed
  path.
- **Cloudflare provider adapter is prepared but not required** — implemented, typed, and wired into
  `wrangler.jsonc` (`send_email` binding), but selecting it locally would require a real
  Cloudflare account and an onboarded sending domain, which is explicitly out of scope for this
  iteration.
- Template interpolation is a small, deliberately unsophisticated `{{variableName}}` regex
  substitution (`packages/email-core/src/template-renderer.ts`) with per-variable HTML escaping —
  not a general-purpose template engine, by design ("do not introduce an unrestricted template
  execution engine").

## Authentication

- A single dev API key (`ANDERSEND_API_KEY=and_dev_local`) authenticates every `/v1/*` request via
  `DevApiKeyAuthProvider`. The `api_keys` table, its repository functions, and the
  `ApiKeyAuthProvider` interface all exist so a database-backed provider can replace this without
  touching route handlers — but that replacement is not implemented, per the brief ("API key
  management does not need to be fully implemented in this iteration").

## What's next (not built)

Billing, auth beyond the one dev key, teams/organizations, multi-tenancy, real Cloudflare
deployment, and full API key lifecycle management (create/rotate/revoke) are all explicitly out of
scope for this iteration — see README.md's "Current limitations" and "Future Cloudflare deployment"
sections for what changes when any of these are picked up.
