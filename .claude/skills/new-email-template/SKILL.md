---
name: new-email-template
description: Add a new built-in email template to packages/email-templates, following this repo's existing template shape. Use when the user wants a new transactional email (e.g. "add a password-reset template").
disable-model-invocation: true
---

Add a new built-in email template for: $ARGUMENTS

Follow the exact shape of the three existing templates in
`packages/email-templates/src/templates/` (`welcome.ts` is the simplest reference).

1. Create `packages/email-templates/src/templates/<kebab-case-name>.ts` exporting a single
   `EmailTemplateDefinition` (shape defined in `packages/email-templates/src/types.ts`):
   - `name` — human-readable (Title Case).
   - `slug` — kebab-case, unique across all templates, used to look the template up
     (`getBuiltInTemplate(slug)`).
   - `subject` / `html` / `text` — use `{{variableName}}` placeholders (double curly braces, no
     spaces inside). `html` should be wrapped in `renderLayout(...)` (imported from `../layout`) so
     it inherits the shared email chrome — never hand-roll a full `<html>` document. `text` is a
     plain-text fallback, not derived automatically from `html`, so write it by hand as a parallel
     version.
   - `exampleVariables` — one concrete value per placeholder used in `subject`/`html`/`text`. These
     seed the local dev database (`packages/database/src/seed.ts`) and populate the dashboard's
     template preview and "Send Email" form defaults — every placeholder must have a matching key
     here or the preview will render the literal `{{placeholder}}` text.
   - `metadata.description` — one sentence on when this email is sent, shown in the dashboard's
     template list.

2. Register it in `packages/email-templates/src/index.ts`: add the import, add it to the
   `BUILT_IN_EMAIL_TEMPLATES` array, and re-export it the same way the existing three are exported.
   Nothing else needs to change — `BUILT_IN_EMAIL_TEMPLATES` is the single source both the seed
   script and `getBuiltInTemplate()` read from.

3. Add `packages/email-templates/src/<name>.test.ts`-style coverage if the template has any
   non-trivial structure — check `packages/email-templates/src/index.test.ts` for the existing
   assertions style (e.g. that every template's placeholders have a matching `exampleVariables`
   key).

Do not add a new templating mechanism or extend `{{variableName}}` substitution — rendering itself
lives in `packages/email-core/src/template-renderer.ts` and is deliberately simple (see
`context.md`'s "Email sending" section); a new template is just new content, not new rendering
logic.

After adding the template, run `pnpm db:seed:local` (or `pnpm setup:local` if the DB hasn't been
migrated yet) so it shows up in the local dashboard, and `pnpm --filter @andersseen/email-templates test`.
