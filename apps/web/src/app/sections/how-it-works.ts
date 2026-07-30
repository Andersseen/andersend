import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VoltBadge } from '@voltui/components';
import { MoveEnterDirective, MoveStaggerDirective } from 'angular-movement';
import { LmnBoltIcon } from 'lumen-icons/bolt';
import { LmnCheckBadgeIcon } from 'lumen-icons/check-badge';
import { LmnPaperAirplaneIcon } from 'lumen-icons/paper-airplane';

interface Step {
  icon: string;
  title: string;
  description: string;
  tag: string;
}

const STEPS: Step[] = [
  {
    icon: 'paper-airplane',
    tag: 'POST /v1/emails',
    title: 'Call the API or the SDK',
    description:
      "Send a template with variables, or raw HTML/text, protected by an idempotency key so retries can't double-send.",
  },
  {
    icon: 'bolt',
    tag: 'Cloudflare Queues',
    title: 'Accepted instantly, queued for delivery',
    description:
      'The request returns right away with a `queued` status. Delivery happens asynchronously, decoupled from the caller.',
  },
  {
    icon: 'check-badge',
    tag: 'D1 + dashboard',
    title: 'Delivered and tracked',
    description:
      'The queue consumer renders the template and sends it. Every state change — queued → processing → delivered/failed — lands in the dashboard.',
  },
];

@Component({
  selector: 'app-how-it-works',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VoltBadge, MoveEnterDirective, MoveStaggerDirective, LmnPaperAirplaneIcon, LmnBoltIcon, LmnCheckBadgeIcon],
  template: `
    <section id="how-it-works" class="border-t border-border bg-surface/50">
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div moveEnter="fade-up" class="max-w-2xl">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">How a send moves through the system.</h2>
          <p class="mt-4 text-muted-foreground">
            One Cloudflare Worker handles both the HTTP API and the queue consumer — the same
            pipeline a real product would use, just sized for one developer's traffic.
          </p>
        </div>

        <ol class="mt-12 grid gap-6 sm:grid-cols-3" [moveStagger]="90">
          @for (step of steps; track step.title; let i = $index) {
            <li moveEnter="fade-up" class="relative flex flex-col gap-3 rounded-xl border border-border bg-background p-6">
              <div class="flex items-center justify-between">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  @switch (step.icon) {
                    @case ('paper-airplane') {
                      <lmn-paper-airplane [size]="20" />
                    }
                    @case ('bolt') {
                      <lmn-bolt [size]="20" />
                    }
                    @case ('check-badge') {
                      <lmn-check-badge [size]="20" />
                    }
                  }
                </div>
                <span class="text-sm font-semibold text-muted-foreground">0{{ i + 1 }}</span>
              </div>
              <volt-badge variant="secondary" class="w-fit font-mono text-xs">{{ step.tag }}</volt-badge>
              <h3 class="text-lg font-semibold">{{ step.title }}</h3>
              <p class="text-sm text-muted-foreground">{{ step.description }}</p>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
})
export class AppHowItWorks {
  protected readonly steps = STEPS;
}
