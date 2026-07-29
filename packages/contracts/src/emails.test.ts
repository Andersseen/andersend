import { describe, expect, it } from "vitest";
import { sendEmailRequestSchema } from "./emails";

describe("sendEmailRequestSchema", () => {
  it("accepts a template-based request", () => {
    const result = sendEmailRequestSchema.safeParse({
      to: ["user@example.com"],
      template: "welcome",
      variables: { name: "Andrii" },
    });

    expect(result.success).toBe(true);
  });

  it("accepts a raw html request with explicit subject", () => {
    const result = sendEmailRequestSchema.safeParse({
      to: ["user@example.com"],
      subject: "Hello",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a display-name formatted from/to address", () => {
    const result = sendEmailRequestSchema.safeParse({
      from: "Andersend <no-reply@andersseen.dev>",
      to: ["Andrii <user@example.com>"],
      subject: "Hello",
      text: "Hello",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a request with no recipients", () => {
    const result = sendEmailRequestSchema.safeParse({
      to: [],
      subject: "Hello",
      text: "Hello",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a request missing both template and subject", () => {
    const result = sendEmailRequestSchema.safeParse({
      to: ["user@example.com"],
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a request missing both template and content", () => {
    const result = sendEmailRequestSchema.safeParse({
      to: ["user@example.com"],
      subject: "Hello",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid recipient address", () => {
    const result = sendEmailRequestSchema.safeParse({
      to: ["not-an-email"],
      subject: "Hello",
      text: "Hello",
    });

    expect(result.success).toBe(false);
  });
});
