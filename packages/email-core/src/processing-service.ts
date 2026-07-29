import type { EmailStatus } from "@andersseen/contracts";
import { EmailProviderError } from "./errors";
import type { EmailProvider } from "./provider";

export interface EmailJob {
  emailId: string;
  projectId: string;
}

export interface EmailRecordForProcessing {
  id: string;
  status: EmailStatus;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo: string | null;
  subject: string;
  html: string | null;
  text: string | null;
}

/**
 * Persistence port the processing service depends on. `apps/api` implements
 * this against `@andersseen/database`, keeping email-core provider- and
 * storage-independent.
 */
export interface EmailProcessingStore {
  getEmail(emailId: string): Promise<EmailRecordForProcessing | null>;
  markProcessing(emailId: string): Promise<void>;
  markSucceeded(
    emailId: string,
    result: { status: "sent" | "delivered"; providerMessageId: string },
  ): Promise<void>;
  markFailed(emailId: string, error: { code: string; message: string }): Promise<void>;
  recordEvent(
    emailId: string,
    type: EmailStatus,
    payload?: Record<string, unknown>,
  ): Promise<void>;
}

export interface ProcessEmailJobOptions {
  provider: EmailProvider;
  store: EmailProcessingStore;
  /** `delivered` for the mock provider (spec: mock mode marks emails delivered directly), `sent` for real providers pending an async delivery webhook. */
  successStatus: "sent" | "delivered";
}

export type ProcessEmailJobOutcome =
  | { outcome: "skipped_missing" }
  | { outcome: "skipped_already_processed"; status: EmailStatus }
  | { outcome: "succeeded"; status: "sent" | "delivered"; providerMessageId: string }
  | { outcome: "failed"; code: string; message: string };

/**
 * Loads the email, applies the provider, and records status transitions +
 * events. Safe to call multiple times for the same job: anything not in
 * `queued` status is left untouched, so redelivered queue messages are a
 * no-op rather than a duplicate send.
 */
export async function processEmailJob(
  job: EmailJob,
  options: ProcessEmailJobOptions,
): Promise<ProcessEmailJobOutcome> {
  const email = await options.store.getEmail(job.emailId);
  if (!email) {
    return { outcome: "skipped_missing" };
  }
  if (email.status !== "queued") {
    return { outcome: "skipped_already_processed", status: email.status };
  }

  await options.store.markProcessing(email.id);
  await options.store.recordEvent(email.id, "processing");

  try {
    const result = await options.provider.send({
      from: email.from,
      to: email.to,
      cc: email.cc,
      bcc: email.bcc,
      replyTo: email.replyTo,
      subject: email.subject,
      html: email.html ?? "",
      text: email.text ?? "",
    });

    await options.store.markSucceeded(email.id, {
      status: options.successStatus,
      providerMessageId: result.providerMessageId,
    });
    await options.store.recordEvent(email.id, options.successStatus, {
      providerMessageId: result.providerMessageId,
    });

    return {
      outcome: "succeeded",
      status: options.successStatus,
      providerMessageId: result.providerMessageId,
    };
  } catch (error) {
    const providerError =
      error instanceof EmailProviderError
        ? error
        : new EmailProviderError(
            "unknown_provider_error",
            error instanceof Error ? error.message : "Unknown provider error",
          );

    await options.store.markFailed(email.id, {
      code: providerError.code,
      message: providerError.message,
    });
    await options.store.recordEvent(email.id, "failed", {
      code: providerError.code,
      message: providerError.message,
    });

    return { outcome: "failed", code: providerError.code, message: providerError.message };
  }
}
