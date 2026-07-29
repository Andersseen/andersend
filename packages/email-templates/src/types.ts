import type { TemplateVariables } from "@andersseen/contracts";

export interface EmailTemplateDefinition {
  name: string;
  slug: string;
  subject: string;
  html: string;
  text: string;
  /** Example values used to seed local data and populate the dashboard preview. */
  exampleVariables: TemplateVariables;
  metadata: {
    description: string;
  };
}
