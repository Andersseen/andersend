/**
 * `Env["ENVIRONMENT"]` is typed as whatever literal is currently in
 * `wrangler.jsonc`'s `vars` (today, `"local"`), even though a deployed
 * environment sets it to `"production"` at runtime. Widened to `string` here
 * so that comparison isn't flagged as always-false.
 */
export function isProduction(env: Env): boolean {
  const environment: string = env.ENVIRONMENT;
  return environment === "production";
}
