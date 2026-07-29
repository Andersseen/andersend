import { extractEmailAddress } from "@andersseen/contracts";
import { EmailProviderError } from "../errors";
import type { EmailProvider, EmailProviderResult, RenderedEmail } from "../provider";

/**
 * Deterministic failure address for exercising the failed-delivery path
 * without any external dependency: send to `fail@example.com` (in `to`,
 * `cc`, or `bcc`) and the mock provider rejects the send.
 */
export const MOCK_PROVIDER_FAILURE_ADDRESS = "fail@example.com";

export class MockEmailProvider implements EmailProvider {
  async send(message: RenderedEmail): Promise<EmailProviderResult> {
    const allRecipients = [...message.to, ...message.cc, ...message.bcc];
    const shouldFail = allRecipients.some(
      (address) => extractEmailAddress(address) === MOCK_PROVIDER_FAILURE_ADDRESS,
    );

    if (shouldFail) {
      throw new EmailProviderError(
        "mock_delivery_failed",
        `Simulated delivery failure for ${MOCK_PROVIDER_FAILURE_ADDRESS}`,
      );
    }

    return { providerMessageId: `mock_${crypto.randomUUID()}` };
  }
}
