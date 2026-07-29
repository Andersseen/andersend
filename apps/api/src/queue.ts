import { processEmailJob } from "@andersseen/email-core";
import { z } from "zod";
import { createProcessingStore } from "./lib/processing-store";
import { createEmailProvider, successStatusFor } from "./lib/provider-factory";

const emailJobSchema = z.object({
  emailId: z.string(),
  projectId: z.string(),
});

export async function handleQueueBatch(
  batch: MessageBatch<unknown>,
  env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  const provider = createEmailProvider(env);
  const successStatus = successStatusFor(env);

  for (const message of batch.messages) {
    const parsed = emailJobSchema.safeParse(message.body);
    if (!parsed.success) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Dropping malformed email queue message",
          queueMessageId: message.id,
        }),
      );
      message.ack();
      continue;
    }

    const job = parsed.data;
    const store = createProcessingStore(env.DB, job.projectId);

    try {
      const outcome = await processEmailJob(job, { provider, store, successStatus });
      console.log(
        JSON.stringify({
          level: "info",
          message: "Processed email job",
          emailId: job.emailId,
          outcome: outcome.outcome,
        }),
      );
      message.ack();
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Unexpected error processing email job, will retry",
          emailId: job.emailId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      message.retry();
    }
  }
}
