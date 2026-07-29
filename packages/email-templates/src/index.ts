import { emailVerificationTemplate } from "./templates/email-verification";
import { projectNotificationTemplate } from "./templates/project-notification";
import { welcomeTemplate } from "./templates/welcome";

export type { EmailTemplateDefinition } from "./types";
export { welcomeTemplate } from "./templates/welcome";
export { emailVerificationTemplate } from "./templates/email-verification";
export { projectNotificationTemplate } from "./templates/project-notification";

export const BUILT_IN_EMAIL_TEMPLATES = [
  welcomeTemplate,
  emailVerificationTemplate,
  projectNotificationTemplate,
];

export function getBuiltInTemplate(slug: string) {
  return BUILT_IN_EMAIL_TEMPLATES.find((template) => template.slug === slug) ?? null;
}
