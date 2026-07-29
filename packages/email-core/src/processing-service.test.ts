import { describe, expect, it } from "vitest";
import type { EmailStatus } from "@andersseen/contracts";
import { MockEmailProvider } from "./providers/mock-provider";
import {
  processEmailJob,
  type EmailProcessingStore,
  type EmailRecordForProcessing,
} from "./processing-service";

class InMemoryStore implements EmailProcessingStore {
  events: Array<{ emailId: string; type: EmailStatus; payload?: Record<string, unknown> }> = [];

  constructor(private record: EmailRecordForProcessing | null) {}

  async getEmail(emailId: string): Promise<EmailRecordForProcessing | null> {
    if (!this.record || this.record.id !== emailId) return null;
    return this.record;
  }

  async markProcessing(emailId: string): Promise<void> {
    if (this.record?.id === emailId) this.record = { ...this.record, status: "processing" };
  }

  async markSucceeded(
    emailId: string,
    result: { status: "sent" | "delivered"; providerMessageId: string },
  ): Promise<void> {
    if (this.record?.id === emailId) {
      this.record = { ...this.record, status: result.status };
    }
  }

  async markFailed(emailId: string): Promise<void> {
    if (this.record?.id === emailId) this.record = { ...this.record, status: "failed" };
  }

  async recordEvent(
    emailId: string,
    type: EmailStatus,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    this.events.push({ emailId, type, payload });
  }
}

function baseEmail(overrides: Partial<EmailRecordForProcessing> = {}): EmailRecordForProcessing {
  return {
    id: "email_1",
    status: "queued",
    from: "Andersend <no-reply@andersseen.dev>",
    to: ["user@example.com"],
    cc: [],
    bcc: [],
    replyTo: null,
    subject: "Hello",
    html: "<p>Hello</p>",
    text: "Hello",
    ...overrides,
  };
}

describe("processEmailJob", () => {
  it("processes a queued email through to delivered in mock mode", async () => {
    const store = new InMemoryStore(baseEmail());
    const outcome = await processEmailJob(
      { emailId: "email_1", projectId: "proj_1" },
      { provider: new MockEmailProvider(), store, successStatus: "delivered" },
    );

    expect(outcome).toMatchObject({ outcome: "succeeded", status: "delivered" });
    expect(store.events.map((event) => event.type)).toEqual(["processing", "delivered"]);
  });

  it("marks the email failed when the provider rejects", async () => {
    const store = new InMemoryStore(baseEmail({ to: ["fail@example.com"] }));
    const outcome = await processEmailJob(
      { emailId: "email_1", projectId: "proj_1" },
      { provider: new MockEmailProvider(), store, successStatus: "delivered" },
    );

    expect(outcome.outcome).toBe("failed");
    expect(store.events.map((event) => event.type)).toEqual(["processing", "failed"]);
  });

  it("skips an email that is not in queued status (idempotent redelivery)", async () => {
    const store = new InMemoryStore(baseEmail({ status: "delivered" }));
    const outcome = await processEmailJob(
      { emailId: "email_1", projectId: "proj_1" },
      { provider: new MockEmailProvider(), store, successStatus: "delivered" },
    );

    expect(outcome).toEqual({ outcome: "skipped_already_processed", status: "delivered" });
    expect(store.events).toEqual([]);
  });

  it("skips safely when the email no longer exists", async () => {
    const store = new InMemoryStore(null);
    const outcome = await processEmailJob(
      { emailId: "missing", projectId: "proj_1" },
      { provider: new MockEmailProvider(), store, successStatus: "delivered" },
    );

    expect(outcome).toEqual({ outcome: "skipped_missing" });
  });
});
