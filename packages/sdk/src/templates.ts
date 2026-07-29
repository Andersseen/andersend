import {
  createTemplateInputSchema,
  previewTemplateResponseSchema,
  templateListResponseSchema,
  templateSchema,
  updateTemplateInputSchema,
  type CreateTemplateInput,
  type PreviewTemplateResponse,
  type Template,
  type TemplateVariables,
  type UpdateTemplateInput,
} from "@andersseen/contracts";
import { z } from "zod";
import type { HttpClient } from "./http-client";

export interface TemplatesResource {
  list(): Promise<Template[]>;
  get(id: string): Promise<Template>;
  create(input: CreateTemplateInput): Promise<Template>;
  update(id: string, input: UpdateTemplateInput): Promise<Template>;
  delete(id: string): Promise<void>;
  preview(id: string, variables?: TemplateVariables): Promise<PreviewTemplateResponse>;
}

export function createTemplatesResource(http: HttpClient): TemplatesResource {
  return {
    async list() {
      const response = await http.request("/v1/templates", { method: "GET" }, templateListResponseSchema);
      return response.data;
    },

    async get(id) {
      return http.request(`/v1/templates/${encodeURIComponent(id)}`, { method: "GET" }, templateSchema);
    },

    async create(input) {
      const payload = createTemplateInputSchema.parse(input);
      return http.request(
        "/v1/templates",
        { method: "POST", body: JSON.stringify(payload) },
        templateSchema,
      );
    },

    async update(id, input) {
      const payload = updateTemplateInputSchema.parse(input);
      return http.request(
        `/v1/templates/${encodeURIComponent(id)}`,
        { method: "PUT", body: JSON.stringify(payload) },
        templateSchema,
      );
    },

    async delete(id) {
      await http.request(`/v1/templates/${encodeURIComponent(id)}`, { method: "DELETE" }, z.void());
    },

    async preview(id, variables = {}) {
      return http.request(
        `/v1/templates/${encodeURIComponent(id)}/preview`,
        { method: "POST", body: JSON.stringify({ variables }) },
        previewTemplateResponseSchema,
      );
    },
  };
}
