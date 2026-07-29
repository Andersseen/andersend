import {
  emailEventListResponseSchema,
  emailListResponseSchema,
  emailResponseSchema,
  sendEmailAcceptedResponseSchema,
  sendEmailRequestSchema,
  type EmailEvent,
  type EmailListQuery,
  type EmailListResponse,
  type EmailResponse,
  type SendEmailAcceptedResponse,
  type SendEmailRequest,
} from "@andersseen/contracts";
import type { HttpClient } from "./http-client";

export interface SendEmailInput extends SendEmailRequest {
  idempotencyKey?: string;
}

export interface EmailsResource {
  send(input: SendEmailInput): Promise<SendEmailAcceptedResponse>;
  list(query?: Partial<EmailListQuery>): Promise<EmailListResponse>;
  get(id: string): Promise<EmailResponse>;
  getEvents(id: string): Promise<EmailEvent[]>;
}

export function createEmailsResource(http: HttpClient): EmailsResource {
  return {
    async send(input) {
      const { idempotencyKey, ...body } = input;
      const payload = sendEmailRequestSchema.parse(body);

      return http.request(
        "/v1/emails",
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
        },
        sendEmailAcceptedResponseSchema,
      );
    },

    async list(query = {}) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) params.set(key, String(value));
      }
      const search = params.toString();

      return http.request(
        `/v1/emails${search ? `?${search}` : ""}`,
        { method: "GET" },
        emailListResponseSchema,
      );
    },

    async get(id) {
      return http.request(`/v1/emails/${encodeURIComponent(id)}`, { method: "GET" }, emailResponseSchema);
    },

    async getEvents(id) {
      const response = await http.request(
        `/v1/emails/${encodeURIComponent(id)}/events`,
        { method: "GET" },
        emailEventListResponseSchema,
      );
      return response.data;
    },
  };
}
