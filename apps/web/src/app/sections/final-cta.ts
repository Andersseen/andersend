import { ChangeDetectionStrategy, Component } from '@angular/core';
import { buttonVariants } from '@voltui/components';
import { MoveEnterDirective } from 'angular-movement';
import { LmnGithubIcon } from 'lumen-icons/github';

const REPO_URL = 'https://github.com/Andersseen/andersend';

const QUICKSTART = `git clone https://github.com/Andersseen/andersend.git
cd andersend
pnpm install
pnpm setup:local   # migrate + seed the local D1 database
pnpm dev           # API on :8787, dashboard on :5173`;

@Component({
  selector: 'app-final-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoveEnterDirective, LmnGithubIcon],
  template: `
    <section class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div moveEnter="fade-up" class="rounded-2xl border border-border bg-surface p-8 sm:p-12">
        <div class="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Run it yourself.</h2>
            <p class="mt-4 max-w-md text-muted-foreground">
              Everything runs locally with no Cloudflare account required — a mock email
              provider, a seeded database, and a dashboard with a week of sample activity.
            </p>
            <div class="mt-6">
              <a [class]="ctaClass" [href]="repoUrl" target="_blank" rel="noopener noreferrer">
                <lmn-github [size]="16" />
                Clone the repository
              </a>
            </div>
          </div>

          <pre
            class="overflow-x-auto rounded-xl bg-background p-5 font-mono text-[13px] leading-relaxed"
          ><code>{{ quickstart }}</code></pre>
        </div>
      </div>
    </section>
  `,
})
export class AppFinalCta {
  protected readonly repoUrl = REPO_URL;
  protected readonly quickstart = QUICKSTART;
  protected readonly ctaClass = buttonVariants({ variant: 'solid' });
}
