/**
 * Mints an API key and stores only its prefix + SHA-256 hash in D1.
 *
 *   pnpm --filter @andersseen/api api-key:create --name falcotech            # local D1
 *   pnpm --filter @andersseen/api api-key:create --name falcotech --remote   # production D1
 *
 * Options:
 *   --name <name>          Label shown in the dashboard (required), e.g. the consuming project.
 *   --project-slug <slug>  Project to attach the key to (default: andersseen-personal).
 *   --project-name <name>  Name used if the project has to be created (default: derived from slug).
 *   --remote               Write to the production database (`--env production --remote`).
 *
 * The project row is created when missing, so a freshly migrated production
 * database needs nothing else before its first send. The plaintext key is
 * printed once and never written anywhere.
 */
import {
  DEV_PROJECT_ID,
  DEV_PROJECT_SLUG,
  createId,
  generateApiKey,
  hashApiKey,
} from "@andersseen/database";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

async function main() {
  // `pnpm run api-key:create -- --name x` forwards the `--`, which parseArgs
  // would treat as "everything after this is positional" and drop the options.
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const { values } = parseArgs({
    args,
    options: {
      name: { type: "string" },
      "project-slug": { type: "string", default: DEV_PROJECT_SLUG },
      "project-name": { type: "string" },
      remote: { type: "boolean", default: false },
    },
  });

  const name = values.name?.trim();
  if (!name) {
    console.error("Missing --name <name> (e.g. --name falcotech).");
    process.exit(1);
  }

  const projectSlug = values["project-slug"];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug)) {
    console.error(
      `Invalid --project-slug ${JSON.stringify(projectSlug)} (lowercase, digits, dashes).`,
    );
    process.exit(1);
  }
  const projectName = values["project-name"]?.trim() || titleCase(projectSlug);
  // Keep the well-known id for the default project so local and remote data line up.
  const newProjectId =
    projectSlug === DEV_PROJECT_SLUG ? DEV_PROJECT_ID : createId("proj");

  const { key, prefix } = generateApiKey();
  const now = new Date().toISOString();

  const sql = [
    `INSERT OR IGNORE INTO projects (id, name, slug, created_at, updated_at) VALUES (${sqlString(newProjectId)}, ${sqlString(projectName)}, ${sqlString(projectSlug)}, ${sqlString(now)}, ${sqlString(now)});`,
    `INSERT INTO api_keys (id, project_id, name, prefix, key_hash, last_used_at, created_at, revoked_at) SELECT ${sqlString(createId("key"))}, id, ${sqlString(name)}, ${sqlString(prefix)}, ${sqlString(await hashApiKey(key))}, NULL, ${sqlString(now)}, NULL FROM projects WHERE slug = ${sqlString(projectSlug)};`,
  ].join("\n");

  const dir = await mkdtemp(path.join(tmpdir(), "andersend-key-"));
  const file = path.join(dir, "create-api-key.sql");
  await writeFile(file, sql, "utf8");

  const target = values.remote
    ? ["--env", "production", "--remote"]
    : ["--local"];
  const apiDir = path.resolve(import.meta.dirname, "..");
  const result = spawnSync(
    "wrangler",
    ["d1", "execute", "andersend-db", ...target, "--file", file],
    { stdio: ["inherit", "ignore", "inherit"], cwd: apiDir },
  );
  await rm(dir, { recursive: true, force: true });

  if (result.status !== 0) {
    console.error("wrangler d1 execute failed; no key was created.");
    process.exit(result.status ?? 1);
  }

  console.log(
    [
      "",
      `API key "${name}" created for project "${projectSlug}" (${values.remote ? "production" : "local"} database).`,
      "Copy it now — it is not stored and cannot be shown again:",
      "",
      `  ${key}`,
      "",
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
