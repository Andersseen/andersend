import { renderLayout } from "../layout";
import type { EmailTemplateDefinition } from "../types";

export const projectNotificationTemplate: EmailTemplateDefinition = {
  name: "Project notification",
  slug: "project-notification",
  subject: "{{projectName}}: {{eventTitle}}",
  html: renderLayout(`
    <p style="margin:0 0 16px;font-weight:600;">{{eventTitle}}</p>
    <p style="margin:0 0 16px;">{{eventDescription}}</p>
    <p style="margin:0;">
      <a href="{{actionUrl}}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 20px;border-radius:8px;">
        View details
      </a>
    </p>
  `),
  text: [
    "{{eventTitle}}",
    "",
    "{{eventDescription}}",
    "",
    "View details: {{actionUrl}}",
  ].join("\n"),
  exampleVariables: {
    projectName: "Andersseen Personal",
    eventTitle: "Deployment succeeded",
    eventDescription: "andersend-api was deployed to production without errors.",
    actionUrl: "https://mail.andersseen.dev/emails",
  },
  metadata: {
    description: "Generic notification for project events (deploys, alerts, digests).",
  },
};
