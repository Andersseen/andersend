import { renderLayout } from "../layout";
import type { EmailTemplateDefinition } from "../types";

export const emailVerificationTemplate: EmailTemplateDefinition = {
  name: "Email verification",
  slug: "email-verification",
  subject: "Verify your email for {{projectName}}",
  html: renderLayout(`
    <p style="margin:0 0 16px;">Hi {{name}},</p>
    <p style="margin:0 0 16px;">
      Confirm this is your email address for <strong>{{projectName}}</strong>. This link expires
      in {{expiresInMinutes}} minutes.
    </p>
    <p style="margin:0 0 24px;">
      <a href="{{verificationUrl}}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 20px;border-radius:8px;">
        Verify email
      </a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `),
  text: [
    "Hi {{name}},",
    "",
    "Confirm this is your email address for {{projectName}}. This link expires in {{expiresInMinutes}} minutes.",
    "",
    "Verify email: {{verificationUrl}}",
    "",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n"),
  exampleVariables: {
    name: "Andrii",
    projectName: "Andersseen Personal",
    verificationUrl: "https://mail.andersseen.dev/verify/abc123",
    expiresInMinutes: 30,
  },
  metadata: {
    description: "Sent to confirm ownership of an email address.",
  },
};
