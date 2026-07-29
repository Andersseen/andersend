// `wrangler types` only reflects `vars` declared in wrangler.jsonc; secrets
// supplied via `.dev.vars` (locally) or `wrangler secret` (deployed) are not
// visible to it, so this augments the generated `Env` interface by hand. Two
// declarations are needed: the top-level global `Env` (used throughout
// `src/`) and `Cloudflare.Env` (what `env` from `cloudflare:workers` is typed
// against in tests) are separate interfaces in `worker-configuration.d.ts`.
interface Env {
  ANDERSEND_API_KEY: string;
}

declare namespace Cloudflare {
  interface Env {
    ANDERSEND_API_KEY: string;
  }
}
