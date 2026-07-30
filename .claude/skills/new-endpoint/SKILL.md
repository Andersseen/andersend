---
name: new-endpoint
description: Scaffold a new API resource end-to-end across contracts, database, the Hono API, and the SDK, following this repo's existing pattern. Use when adding a new route/resource to apps/api (not for adding one field to an existing resource).
disable-model-invocation: true
---

Scaffold a new resource end-to-end for: $ARGUMENTS

This repo has one fixed pattern for a resource end-to-end (see `ARCHITECTURE.md` "HTTP request
flow" and "Dashboard / API separation"). Every new resource touches these layers, in this order,
never skipping one:

1. **`packages/contracts/src/<resource>.ts`** — Zod schema(s) + inferred types. Follow
   `packages/contracts/src/api-keys.ts` or `templates.ts` as the template: one schema per entity,
   `z.infer<>` for the type, separate `create<X>InputSchema` / `update<X>InputSchema` for
   mutation bodies, and a `<x>ListResponseSchema` wrapping `{ data: z.array(...) }`. Export it from
   `packages/contracts/src/index.ts`.

2. **`packages/database/src/rows.ts`** — add the raw D1 row interface (snake_case columns, JSON
   fields typed as `string`/`string | null`).

3. **A D1 migration** in `packages/database/migrations/000N_<verb>_<table>.sql` — next sequential
   number after the highest existing file, always scoped by `project_id` with a
   `REFERENCES projects(id)` foreign key (see any existing migration for the shape) and an index on
   `project_id` if the table will be queried by it.

4. **`packages/database/src/mappers.ts`** — a `map<X>Row(row: <X>Row): <X>` function converting
   snake_case → camelCase and JSON-parsing any array/object columns (reuse `parseJsonArray` /
   `parseJsonRecord`, already in that file).

5. **`packages/database/src/repositories/<resource>.ts`** — plain async functions taking
   `(db: D1Database, projectId: string, ...)` and returning mapped types, using
   `db.prepare(...).bind(...).all()/.first()/.run()` with numbered placeholders (`?1`, `?2`, ...).
   No business logic here, just queries. Export from `packages/database/src/index.ts`.

6. **`apps/api/src/routes/<resource>.ts`** — a `Hono<AppEnv>()` sub-app. For any route with a body,
   wrap it with `validate("json", <schema>)` from `../lib/validation` and read
   `c.req.valid("json")`; look up `c.get("projectId")` for scoping; throw
   `new AppError("not_found", "...")` (from `../lib/errors`) for missing resources rather than
   returning a bare 404. **Never write raw SQL or business logic in the route handler** — it only
   calls repository functions and shapes the response. Register the route in `apps/api/src/app.ts`
   (`app.route("/v1/<resource>", <resource>Route)`, after `app.use("/v1/*", authMiddleware)`).

7. **`packages/sdk/src/<resource>.ts`** — a `create<X>Resource(http: HttpClient)` factory returning
   an interface of methods, each calling `http.request(path, { method, body? }, responseSchema)` and
   validating against the `contracts` schema from step 1. Register it in
   `packages/sdk/src/client.ts`'s `AndersendClient` interface and `createAndersendClient()`.

8. If the dashboard needs it: call the new SDK method through the existing
   `ApiClientService` (`apps/dashboard/src/app/core/api-client.service.ts`) — never add a new HTTP
   client instance, and never hardcode data that should come from the API.

After scaffolding, add a Vitest test at whichever layers have logic worth testing (repository
mapping, route validation edge cases) — check sibling `*.test.ts` files in the touched packages for
the existing style — and run `pnpm typecheck && pnpm lint && pnpm test` before considering the
resource done.
