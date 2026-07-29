import { renderLayout } from "../layout";
import type { EmailTemplateDefinition } from "../types";

export const welcomeTemplate: EmailTemplateDefinition = {
  name: "Welcome",
  slug: "welcome",
  subject: "Welcome to {{projectName}}, {{name}}!",
  html: renderLayout(`
    <p style="margin:0 0 16px;">Hi {{name}},</p>
    <p style="margin:0 0 16px;">
      Your account for <strong>{{projectName}}</strong> is ready to go.
    </p>
    <p style="margin:0 0 24px;">
      <a href="{{actionUrl}}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 20px;border-radius:8px;">
        Open dashboard
      </a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;">
      If you weren't expecting this email, you can safely ignore it.
    </p>
  `),
  text: [
    "Hi {{name}},",
    "",
    "Your account for {{projectName}} is ready to go.",
    "",
    "Open your dashboard: {{actionUrl}}",
    "",
    "If you weren't expecting this email, you can safely ignore it.",
  ].join("\n"),
  exampleVariables: {
    name: "Andrii",
    projectName: "Andersseen Personal",
    actionUrl: "https://mail.andersseen.dev",
  },
  metadata: {
    description: "Sent once when a new project or user is provisioned.",
  },
};
