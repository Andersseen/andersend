import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VoltCard, VoltCardContent } from '@voltui/components';
import { MoveEnterDirective, MoveStaggerDirective } from 'angular-movement';
import { LmnCheckIcon } from 'lumen-icons/check';
import { LmnXMarkIcon } from 'lumen-icons/x-mark';

const INCLUDED = [
  'One project, one API key, one developer — and that\'s fine',
  'A complete send → queue → deliver → track pipeline',
  'Real D1, Queues, and Workers (simulated locally by Wrangler)',
  'A Cloudflare Email Service adapter, implemented and ready to enable',
  'Idempotent sends and HTML-escaped template rendering',
  'Integration tests against a real, Miniflare-simulated database',
];

const NOT_INCLUDED = [
  'Billing, subscriptions, or plans',
  'Teams, organizations, or multi-tenancy',
  'Public sign-up or registration',
  'Full API key lifecycle — create, rotate, revoke',
];

@Component({
  selector: 'app-honesty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VoltCard, VoltCardContent, MoveEnterDirective, MoveStaggerDirective, LmnCheckIcon, LmnXMarkIcon],
  template: `
    <section id="scope" class="border-t border-border bg-surface/50">
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div moveEnter="fade-up" class="max-w-2xl">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Deliberately small scope.</h2>
          <p class="mt-4 text-muted-foreground">
            Andersend is personal-only, on purpose. It exists to send email for one developer's
            own projects — not to be sold to anyone else.
          </p>
        </div>

        <div class="mt-10 grid gap-4 sm:grid-cols-2" [moveStagger]="80">
          <volt-card moveEnter="fade-up">
            <volt-card-content class="pt-6">
              <h3 class="text-sm font-semibold text-success">What's actually built</h3>
              <ul class="mt-4 flex flex-col gap-3 text-sm">
                @for (item of included; track item) {
                  <li class="flex items-start gap-2.5">
                    <lmn-check [size]="16" class="mt-0.5 shrink-0 text-success" />
                    <span>{{ item }}</span>
                  </li>
                }
              </ul>
            </volt-card-content>
          </volt-card>

          <volt-card moveEnter="fade-up">
            <volt-card-content class="pt-6">
              <h3 class="text-sm font-semibold text-muted-foreground">Not included — on purpose</h3>
              <ul class="mt-4 flex flex-col gap-3 text-sm">
                @for (item of notIncluded; track item) {
                  <li class="flex items-start gap-2.5 text-muted-foreground">
                    <lmn-x-mark [size]="16" class="mt-0.5 shrink-0" />
                    <span>{{ item }}</span>
                  </li>
                }
              </ul>
            </volt-card-content>
          </volt-card>
        </div>

        <p moveEnter="fade-up" class="mt-8 max-w-2xl text-sm text-muted-foreground">
          The schema is already shaped for the missing pieces — a <code class="rounded bg-muted px-1 py-0.5 font-mono text-xs">project_id</code>
          on every table, a real <code class="rounded bg-muted px-1 py-0.5 font-mono text-xs">api_keys</code> table — so they
          could be added later without a migration. They're just not needed to send email for one
          person's projects today.
        </p>
      </div>
    </section>
  `,
})
export class AppHonesty {
  protected readonly included = INCLUDED;
  protected readonly notIncluded = NOT_INCLUDED;
}
