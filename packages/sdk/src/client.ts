import { createApiKeysResource, type ApiKeysResource } from "./api-keys";
import { createEmailsResource, type EmailsResource } from "./emails";
import { createHealthResource, type HealthResource } from "./health";
import { createHttpClient, type AndersendClientOptions } from "./http-client";
import { createStatsResource, type StatsResource } from "./stats";
import { createTemplatesResource, type TemplatesResource } from "./templates";

export interface AndersendClient {
  emails: EmailsResource;
  templates: TemplatesResource;
  stats: StatsResource;
  health: HealthResource;
  apiKeys: ApiKeysResource;
}

export function createAndersendClient(options: AndersendClientOptions): AndersendClient {
  const http = createHttpClient(options);

  return {
    emails: createEmailsResource(http),
    templates: createTemplatesResource(http),
    stats: createStatsResource(http),
    health: createHealthResource(http),
    apiKeys: createApiKeysResource(http),
  };
}
