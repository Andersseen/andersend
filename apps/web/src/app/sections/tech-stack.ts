import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MoveEnterDirective, MoveStaggerDirective } from 'angular-movement';
import { TooltipDirective } from 'quartz-headless';

interface TechItem {
  name: string;
  description: string;
}

const STACK: TechItem[] = [
  { name: 'Hono', description: 'Ultrafast web framework powering the API on Cloudflare Workers.' },
  { name: 'Cloudflare Workers', description: 'Runs the HTTP API and the queue consumer at the edge.' },
  { name: 'Cloudflare D1', description: 'SQLite database storing projects, emails, and templates.' },
  { name: 'Cloudflare Queues', description: 'Decouples accepting a send from actually delivering it.' },
  { name: 'Zod', description: 'Runtime validation shared everywhere via @andersseen/contracts.' },
  { name: 'Analog', description: 'The meta-framework powering this page and the dashboard.' },
  { name: 'Angular 21', description: 'Zoneless, signal-based components — no zone.js in the bundle.' },
  { name: 'Tailwind CSS 4', description: 'Utility-first styling with CSS-first configuration.' },
  { name: 'Volt UI', description: 'The copy-and-own Angular component library used throughout.' },
  { name: 'Quartz Headless', description: "Unstyled Angular primitives — this tooltip is one of them." },
  { name: 'Angular Movement', description: 'Web Animations API-driven motion for every entrance on this page.' },
  { name: 'Lumen Icons', description: 'The icon set used across the dashboard and this page.' },
  { name: 'TypeScript', description: 'Strict mode, everywhere in the monorepo.' },
  { name: 'Turborepo + pnpm', description: 'Monorepo task orchestration and workspaces.' },
  { name: 'Vitest + Playwright', description: 'Unit, integration, and end-to-end coverage.' },
];

@Component({
  selector: 'app-tech-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoveEnterDirective, MoveStaggerDirective, TooltipDirective],
  template: `
    <section id="stack" class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div moveEnter="fade-up" class="max-w-2xl">
        <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Built with a real, boring stack.</h2>
        <p class="mt-4 text-muted-foreground">
          No framework of the week. Hover any item for what it's doing here — including the
          tooltip itself.
        </p>
      </div>

      <div class="mt-10 flex flex-wrap gap-3" [moveStagger]="30">
        @for (item of stack; track item.name) {
          <span
            moveEnter="fade-up"
            [qzTooltip]="item.description"
            tooltipPlacement="top"
            class="cursor-default rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
          >
            {{ item.name }}
          </span>
        }
      </div>
    </section>
  `,
})
export class AppTechStack {
  protected readonly stack = STACK;
}
