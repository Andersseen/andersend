import angular from "angular-eslint";
import globals from "globals";
import tseslint from "typescript-eslint";
import { config as baseConfig } from "./base.js";

/**
 * A shared ESLint configuration for the Analog/Angular dashboard.
 * `selectorPrefix` controls the required prefix for component and directive selectors.
 *
 * @param {string} selectorPrefix
 * @returns {import("eslint").Linter.Config[]}
 * */
export function angularConfig(selectorPrefix = "app") {
  return tseslint.config(
    ...baseConfig,
    {
      files: ["**/*.ts"],
      languageOptions: {
        globals: {
          ...globals.browser,
        },
      },
      extends: [...angular.configs.tsRecommended],
      processor: angular.processInlineTemplates,
      rules: {
        "@angular-eslint/directive-selector": [
          "error",
          { type: "attribute", prefix: selectorPrefix, style: "camelCase" },
        ],
        "@angular-eslint/component-selector": [
          "error",
          { type: "element", prefix: selectorPrefix, style: "kebab-case" },
        ],
      },
    },
    {
      files: ["**/*.html"],
      extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
      rules: {},
    },
  );
}
