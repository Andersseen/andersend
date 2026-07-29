import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import path from "node:path";
import { defineConfig } from "vitest/config";

// Vite's config loader resolves workspace package imports through plain Node
// ESM (no bundler in between), which can't follow this repo's extensionless
// internal relative imports — so this is a literal, not an
// `import { DEV_API_KEY_PLAINTEXT } from "@andersseen/database"`. Must match
// `packages/database/src/constants.ts`.
const DEV_API_KEY_PLAINTEXT = "and_dev_local";

export default defineConfig(async () => {
  const migrationsPath = path.join(__dirname, "../../packages/database/migrations");
  const migrations = await readD1Migrations(migrationsPath);

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            // Local dev key, injected here rather than via committed `vars` —
            // real deployments source it from `.dev.vars` / a Worker secret.
            ANDERSEND_API_KEY: DEV_API_KEY_PLAINTEXT,
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
    },
  };
});
