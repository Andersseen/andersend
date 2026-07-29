import { buildSeedStatements } from "@andersseen/database/seed";
import { spawnSync } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

function escapeSqlValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function toLiteralStatement(sql: string, params: unknown[]): string {
  let result = sql;
  params.forEach((param, index) => {
    const placeholder = new RegExp(`\\?${index + 1}\\b`, "g");
    result = result.replace(placeholder, escapeSqlValue(param));
  });
  return `${result};`;
}

async function main() {
  const statements = await buildSeedStatements();
  const sql = statements.map((statement) => toLiteralStatement(statement.sql, statement.params)).join("\n");

  const dir = await mkdtemp(path.join(tmpdir(), "andersend-seed-"));
  const file = path.join(dir, "seed.sql");
  await writeFile(file, sql, "utf8");

  const apiDir = path.resolve(import.meta.dirname, "..");
  const result = spawnSync("wrangler", ["d1", "execute", "andersend-db", "--local", "--file", file], {
    stdio: "inherit",
    cwd: apiDir,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log(`Seeded ${statements.length} statements into the local D1 database.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
