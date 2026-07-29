import { DEV_PROJECT_ID, getEmailById, insertEmail, listEmailEvents } from "@andersseen/database";
import type { EmailJob } from "@andersseen/email-core";
import { createExecutionContext, createMessageBatch, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import worker from "../src/index";

function queueMessage(body: EmailJob) {
  return {
    id: randomBytes(16).toString("hex"),
    timestamp: new Date(),
    attempts: 1,
    body,
  };
}

describe("queue consumer", () => {
  it("processes a queued email through to delivered using the mock provider", async () => {
    const email = await insertEmail(env.DB, {
      projectId: DEV_PROJECT_ID,
      from: "Andersend <no-reply@andersseen.dev>",
      to: ["queue-success@example.com"],
      subject: "Queue test",
      html: "<p>Queue test</p>",
      text: "Queue test",
    });

    const batch = createMessageBatch("andersend-emails", [
      queueMessage({ emailId: email.id, projectId: DEV_PROJECT_ID }),
    ]);
    const ctx = createExecutionContext();
    await worker.queue(batch, env, ctx);
    await waitOnExecutionContext(ctx);

    const updated = await getEmailById(env.DB, DEV_PROJECT_ID, email.id);
    expect(updated?.status).toBe("delivered");
    expect(updated?.providerMessageId).toMatch(/^mock_/);
    expect(updated?.deliveredAt).not.toBeNull();

    const events = await listEmailEvents(env.DB, email.id);
    expect(events.map((event) => event.type)).toEqual(["processing", "delivered"]);
  });

  it("marks an email failed for the deterministic mock failure address", async () => {
    const email = await insertEmail(env.DB, {
      projectId: DEV_PROJECT_ID,
      from: "Andersend <no-reply@andersseen.dev>",
      to: ["fail@example.com"],
      subject: "Queue failure test",
      html: "<p>Queue failure test</p>",
      text: "Queue failure test",
    });

    const batch = createMessageBatch("andersend-emails", [
      queueMessage({ emailId: email.id, projectId: DEV_PROJECT_ID }),
    ]);
    const ctx = createExecutionContext();
    await worker.queue(batch, env, ctx);
    await waitOnExecutionContext(ctx);

    const updated = await getEmailById(env.DB, DEV_PROJECT_ID, email.id);
    expect(updated?.status).toBe("failed");
    expect(updated?.errorCode).toBe("mock_delivery_failed");

    const events = await listEmailEvents(env.DB, email.id);
    expect(events.map((event) => event.type)).toEqual(["processing", "failed"]);
  });

  it("is idempotent: redelivering a message for an already-processed email is a no-op", async () => {
    const email = await insertEmail(env.DB, {
      projectId: DEV_PROJECT_ID,
      from: "Andersend <no-reply@andersseen.dev>",
      to: ["queue-redelivery@example.com"],
      subject: "Redelivery test",
      html: "<p>Redelivery test</p>",
      text: "Redelivery test",
    });

    const job = { emailId: email.id, projectId: DEV_PROJECT_ID };
    const firstCtx = createExecutionContext();
    await worker.queue(createMessageBatch("andersend-emails", [queueMessage(job)]), env, firstCtx);
    await waitOnExecutionContext(firstCtx);

    const afterFirst = await getEmailById(env.DB, DEV_PROJECT_ID, email.id);
    expect(afterFirst?.status).toBe("delivered");

    const secondCtx = createExecutionContext();
    await worker.queue(createMessageBatch("andersend-emails", [queueMessage(job)]), env, secondCtx);
    await waitOnExecutionContext(secondCtx);

    const afterSecond = await getEmailById(env.DB, DEV_PROJECT_ID, email.id);
    expect(afterSecond?.providerMessageId).toBe(afterFirst?.providerMessageId);

    const events = await listEmailEvents(env.DB, email.id);
    expect(events.map((event) => event.type)).toEqual(["processing", "delivered"]);
  });

  it("acks malformed messages instead of retrying them forever", async () => {
    const batch = createMessageBatch("andersend-emails", [
      queueMessage({ emailId: 42 as unknown as string, projectId: DEV_PROJECT_ID }),
    ]);
    const ctx = createExecutionContext();
    await expect(worker.queue(batch, env, ctx)).resolves.toBeUndefined();
    await waitOnExecutionContext(ctx);
  });
});
