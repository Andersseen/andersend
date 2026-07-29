export interface RenderedEmail {
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo: string | null;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProviderResult {
  providerMessageId: string;
}

export interface EmailProvider {
  send(message: RenderedEmail): Promise<EmailProviderResult>;
}
