import { buildSeedStatements } from "@andersseen/database/seed";
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

// Setup files run outside per-test-file storage isolation and may run more
// than once; `applyD1Migrations` only applies migrations that have not
// already been applied, so calling it here unconditionally is safe.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// `buildSeedStatements()` always clears its tables before inserting, so
// re-running it here on every test file is also safe and gives every test a
// consistent, realistic starting dataset (one project, the dev API key, the
// three built-in templates, and a week of sample emails).
const seedStatements = await buildSeedStatements();
await env.DB.batch(seedStatements.map((statement) => env.DB.prepare(statement.sql).bind(...statement.params)));
