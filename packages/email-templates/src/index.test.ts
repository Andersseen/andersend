import { extractVariableNames, renderTemplate } from "@andersseen/email-core";
import { describe, expect, it } from "vitest";
import { BUILT_IN_EMAIL_TEMPLATES, getBuiltInTemplate } from "./index";

describe("BUILT_IN_EMAIL_TEMPLATES", () => {
  it("exposes exactly the three required templates", () => {
    expect(BUILT_IN_EMAIL_TEMPLATES.map((template) => template.slug).sort()).toEqual([
      "email-verification",
      "project-notification",
      "welcome",
    ]);
  });

  it.each(BUILT_IN_EMAIL_TEMPLATES)(
    "renders $slug with no missing variables using its example data",
    (template) => {
      const result = renderTemplate(template, template.exampleVariables);
      expect(result.missingVariables).toEqual([]);
      expect(result.subject.length).toBeGreaterThan(0);
      expect(result.html).toContain("Andersend");
    },
  );

  it.each(BUILT_IN_EMAIL_TEMPLATES)(
    "declares example variables for every placeholder used in $slug",
    (template) => {
      const placeholders = new Set([
        ...extractVariableNames(template.subject),
        ...extractVariableNames(template.html),
        ...extractVariableNames(template.text),
      ]);

      for (const name of placeholders) {
        expect(template.exampleVariables).toHaveProperty(name);
      }
    },
  );
});

describe("getBuiltInTemplate", () => {
  it("finds a template by slug", () => {
    expect(getBuiltInTemplate("welcome")?.name).toBe("Welcome");
  });

  it("returns null for an unknown slug", () => {
    expect(getBuiltInTemplate("does-not-exist")).toBeNull();
  });
});
