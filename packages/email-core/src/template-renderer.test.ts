import { describe, expect, it } from "vitest";
import { escapeHtml, extractVariableNames, renderTemplate } from "./template-renderer";

describe("renderTemplate", () => {
  const template = {
    subject: "Welcome, {{name}}!",
    html: "<p>Hi {{name}}, your project is {{project}}.</p>",
    text: "Hi {{name}}, your project is {{project}}.",
  };

  it("interpolates all provided variables", () => {
    const result = renderTemplate(template, { name: "Andrii", project: "Andersend" });

    expect(result.subject).toBe("Welcome, Andrii!");
    expect(result.html).toBe("<p>Hi Andrii, your project is Andersend.</p>");
    expect(result.text).toBe("Hi Andrii, your project is Andersend.");
    expect(result.missingVariables).toEqual([]);
  });

  it("escapes HTML in variables injected into the html body only", () => {
    const result = renderTemplate(template, {
      name: '<img src=x onerror="alert(1)">',
      project: "Andersend",
    });

    expect(result.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(result.html).not.toContain("<img src=x");
    // The plain-text body has no markup context, so it is left un-escaped.
    expect(result.text).toContain('<img src=x onerror="alert(1)">');
  });

  it("reports missing variables and substitutes an empty string", () => {
    const result = renderTemplate(template, { name: "Andrii" });

    expect(result.missingVariables).toEqual(["project"]);
    expect(result.subject).toBe("Welcome, Andrii!");
    expect(result.html).toBe("<p>Hi Andrii, your project is .</p>");
  });

  it("defaults to an empty variables object", () => {
    const result = renderTemplate(template);
    expect(result.missingVariables).toEqual(["name", "project"]);
  });
});

describe("extractVariableNames", () => {
  it("returns unique variable names in order of first appearance", () => {
    expect(extractVariableNames("{{a}} {{b}} {{a}}")).toEqual(["a", "b"]);
  });

  it("returns an empty array when there are no placeholders", () => {
    expect(extractVariableNames("Hello world")).toEqual([]);
  });
});

describe("escapeHtml", () => {
  it("escapes the five reserved HTML characters", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
});
