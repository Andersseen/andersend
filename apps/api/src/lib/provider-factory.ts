import { MockEmailProvider, type EmailProvider } from "@andersseen/email-core";
import { CloudflareEmailProvider } from "@andersseen/email-core/cloudflare";

/**
 * `Env["EMAIL_PROVIDER"]` is typed as the literal `"mock"` by `wrangler types`
 * (it reflects the single value currently in `wrangler.jsonc`'s `vars`), even
 * though a deployed environment can set it to `"cloudflare"` at runtime. This
 * widens it back to `string` at the one place that matters.
 */
export function readEmailProvider(env: Env): string {
  return env.EMAIL_PROVIDER;
}

export function createEmailProvider(env: Env): EmailProvider {
  if (readEmailProvider(env) === "cloudflare") {
    if (!env.EMAIL) {
      throw new Error("EMAIL_PROVIDER=cloudflare requires the EMAIL send_email binding to be configured");
    }
    return new CloudflareEmailProvider(env.EMAIL);
  }
  return new MockEmailProvider();
}

/** Mock mode marks emails `delivered` directly; a real provider only confirms acceptance (`sent`) pending an async delivery webhook. */
export function successStatusFor(env: Env): "sent" | "delivered" {
  return readEmailProvider(env) === "cloudflare" ? "sent" : "delivered";
}
