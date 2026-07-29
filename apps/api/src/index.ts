import { createApp } from "./app";
import { handleQueueBatch } from "./queue";

const app = createApp();

export default {
  fetch: app.fetch,
  queue: handleQueueBatch,
} satisfies ExportedHandler<Env>;
