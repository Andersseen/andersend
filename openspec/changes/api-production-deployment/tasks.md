## 1. Key format helpers (packages/database)

- [x] 1.1 Add `generateApiKey()` and `parseApiKeyPrefix()` (format `and_<id8>_<secret>`) with unit tests
- [x] 1.2 Export `hashApiKey` and the new helpers from the package index

## 2. Database-backed authentication (apps/api)

- [x] 2.1 Implement `DatabaseApiKeyAuthProvider` (prefix lookup, constant-time hash compare, reject `and_dev_` in production)
- [x] 2.2 Compose it with `DevApiKeyAuthProvider` (dev fallback only outside production) in the auth middleware; record `last_used_at` via `waitUntil`
- [x] 2.3 Integration tests: stored key works and is scoped, wrong secret / revoked key → 401, `last_used_at` set

## 3. Production configuration (apps/api)

- [x] 3.1 Read CORS origins from `CORS_ORIGINS` (default `http://localhost:5173`) with a test
- [x] 3.2 Add `env.production` to `wrangler.jsonc` (vars, D1, queue, send_email, custom domain) and regenerate types
- [x] 3.3 Add `scripts/create-api-key.ts` + `api-key:create`, `deploy`, `db:migrate:remote` scripts; root `deploy:api` / `db:migrate:remote`

## 4. Docs

- [x] 4.1 README: production runbook (provisioning, migrate, deploy, mint key, calling from another project)
- [x] 4.2 Update `STATE.md`, `ROADMAP.md`, `context.md`, `AGENTS.md` commands

## 5. Verify

- [x] 5.1 `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass
- [x] 5.2 Mint a key locally and send an email through `wrangler dev` with it
