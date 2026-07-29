import { describe, expect, it } from "vitest";
import { EmailProviderError } from "../errors";
import { MockEmailProvider } from "./mock-provider";

function message(overrides: Partial<Parameters<MockEmailProvider["send"]>[0]> = {}) {
  return {
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

describe("MockEmailProvider", () => {
  it("returns a mock provider message id on success", async () => {
    const provider = new MockEmailProvider();
    const result = await provider.send(message());

    expect(result.providerMessageId).toMatch(/^mock_/);
  });

  it("throws for the deterministic failure address", async () => {
    const provider = new MockEmailProvider();

    await expect(
      provider.send(message({ to: ["fail@example.com"] })),
    ).rejects.toBeInstanceOf(EmailProviderError);
  });

  it("detects the failure address in cc and bcc too", async () => {
    const provider = new MockEmailProvider();

    await expect(
      provider.send(message({ to: ["user@example.com"], bcc: ["fail@example.com"] })),
    ).rejects.toThrow(EmailProviderError);
  });

  it("matches the failure address regardless of display name formatting", async () => {
    const provider = new MockEmailProvider();

    await expect(
      provider.send(message({ to: ["Someone <fail@example.com>"] })),
    ).rejects.toBeInstanceOf(EmailProviderError);
  });
});
