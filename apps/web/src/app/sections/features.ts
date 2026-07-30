import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VoltCard, VoltCardContent, VoltCardDescription, VoltCardTitle } from '@voltui/components';
import { MoveEnterDirective, MoveStaggerDirective } from 'angular-movement';
import { LmnChartBarSquareIcon } from 'lumen-icons/chart-bar-square';
import { LmnCircleStackIcon } from 'lumen-icons/circle-stack';
import { LmnCodeBracketIcon } from 'lumen-icons/code-bracket';
import { LmnEnvelopeIcon } from 'lumen-icons/envelope';
import { LmnQueueListIcon } from 'lumen-icons/queue-list';
import { LmnShieldCheckIcon } from 'lumen-icons/shield-check';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'code-bracket',
    title: 'Typed HTTP API',
    description:
      'Hono running on Cloudflare Workers, with every request and response validated against Zod schemas shared across the whole monorepo.',
  },
  {
    icon: 'queue-list',
    title: 'Queue-backed delivery',
    description:
      'Sends are accepted instantly and processed asynchronously through Cloudflare Queues, with idempotency keys so retries never double-send.',
  },
  {
    icon: 'chart-bar-square',
    title: 'A dashboard that uses the real API',
    description:
      'An Analog and Angular signals dashboard renders live delivery stats, a 7-day activity chart, and a full event timeline for every email.',
  },
  {
    icon: 'shield-check',
    title: 'A typed SDK',
    description:
      '@andersseen/sdk gives every project of mine a fully-typed client, so sending an email from any script is one `await` away.',
  },
  {
    icon: 'envelope',
    title: 'Built-in templates',
    description:
      'Welcome, email verification, and project notification templates ship out of the box, with safe {{variable}} interpolation and HTML escaping.',
  },
  {
    icon: 'circle-stack',
    title: 'Local-first, Cloudflare-ready',
    description:
      'D1, Queues, and Workers all run locally today via Wrangler. A real Cloudflare Email Service adapter is already implemented for when it goes live.',
  },
];

@Component({
  selector: 'app-features',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VoltCard,
    VoltCardContent,
    VoltCardTitle,
    VoltCardDescription,
    MoveEnterDirective,
    MoveStaggerDirective,
    LmnCodeBracketIcon,
    LmnQueueListIcon,
    LmnChartBarSquareIcon,
    LmnShieldCheckIcon,
    LmnEnvelopeIcon,
    LmnCircleStackIcon,
  ],
  template: `
    <section id="features" class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div moveEnter="fade-up" class="max-w-2xl">
        <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Everything a real send pipeline needs.</h2>
        <p class="mt-4 text-muted-foreground">
          Andersend isn't a demo — every route, template, and dashboard page runs against a real
          Cloudflare D1 database and a real queue consumer, exercised by an integration test suite.
        </p>
      </div>

      <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" [moveStagger]="70">
        @for (feature of features; track feature.title) {
          <volt-card moveEnter="fade-up" class="h-full">
            <volt-card-content class="flex flex-col gap-3 pt-6">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                @switch (feature.icon) {
                  @case ('code-bracket') {
                    <lmn-code-bracket [size]="20" />
                  }
                  @case ('queue-list') {
                    <lmn-queue-list [size]="20" />
                  }
                  @case ('chart-bar-square') {
                    <lmn-chart-bar-square [size]="20" />
                  }
                  @case ('shield-check') {
                    <lmn-shield-check [size]="20" />
                  }
                  @case ('envelope') {
                    <lmn-envelope [size]="20" />
                  }
                  @case ('circle-stack') {
                    <lmn-circle-stack [size]="20" />
                  }
                }
              </div>
              <volt-card-title class="text-base">{{ feature.title }}</volt-card-title>
              <volt-card-description>{{ feature.description }}</volt-card-description>
            </volt-card-content>
          </volt-card>
        }
      </div>
    </section>
  `,
})
export class AppFeatures {
  protected readonly features = FEATURES;
}
