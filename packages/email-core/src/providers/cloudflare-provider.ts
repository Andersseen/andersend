import { EmailProviderError } from "../errors";
import type { EmailProvider, EmailProviderResult, RenderedEmail } from "../provider";

const DISPLAY_NAME_PATTERN = /^([^<>]+)<([^\s<>]+)>$/;

/**
 * Parses `Name <email@example.com>` into the shape Cloudflare's `send_email`
 * binding expects. Uses the ambient `EmailAddress`/`SendEmail` types from
 * `@cloudflare/workers-types` directly (Cloudflare's own guidance: "Always
 * use these generated types — do not define them manually"), rather than a
 * hand-rolled shadow interface.
 */
function parseFromAddress(address: string): string | EmailAddress {
  const match = DISPLAY_NAME_PATTERN.exec(address.trim());
  if (!match) return address.trim();
  const [, name, email] = match;
  return { name: (name ?? "").trim(), email: (email ?? "").trim() };
}

/**
 * Adapter for Cloudflare's Email Sending binding. Not exercised in local
 * development (see `MockEmailProvider`); selecting it locally requires a
 * real onboarded sending domain, which this project intentionally does not
 * configure. See README.md for production activation steps.
 */
export class CloudflareEmailProvider implements EmailProvider {
  constructor(private readonly binding: SendEmail) {}

  async send(message: RenderedEmail): Promise<EmailProviderResult> {
    try {
      const response = await this.binding.send({
        to: message.to,
        from: parseFromAddress(message.from),
        cc: message.cc.length > 0 ? message.cc : undefined,
        bcc: message.bcc.length > 0 ? message.bcc : undefined,
        replyTo: message.replyTo ?? undefined,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      return { providerMessageId: response.messageId };
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: unknown }).code)
          : "cloudflare_send_failed";
      const errorMessage =
        error instanceof Error ? error.message : "Cloudflare Email Service send failed";
      throw new EmailProviderError(code, errorMessage);
    }
  }
}
