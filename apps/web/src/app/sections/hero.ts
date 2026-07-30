import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VoltBadge, VoltCard, VoltCardContent, buttonVariants } from '@voltui/components';
import { MoveEnterDirective, MoveStaggerDirective } from 'angular-movement';
import { LmnGithubIcon } from 'lumen-icons/github';
import { LmnSparklesIcon } from 'lumen-icons/sparkles';

const REPO_URL = 'https://github.com/Andersseen/andersend';

const SDK_SNIPPET = `import { createAndersendClient } from '@andersseen/sdk';

const andersend = createAndersendClient({
  baseUrl: 'http://localhost:8787',
  apiKey: env.ANDERSEND_API_KEY,
});

await andersend.emails.send({
  to: ['andrii@andersseen.dev'],
  template: 'welcome',
  variables: { name: 'Andrii' },
});`;

@Component({
  selector: 'app-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VoltBadge,
    VoltCard,
    VoltCardContent,
    MoveEnterDirective,
    MoveStaggerDirective,
    LmnGithubIcon,
    LmnSparklesIcon,
  ],
  template: `
    <section id="top" class="relative overflow-hidden">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[32rem] bg-[radial-gradient(50%_50%_at_50%_0%,var(--color-primary)_0%,transparent_70%)] opacity-[0.08]"
      ></div>

      <div class="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div [moveStagger]="90">
          <volt-badge variant="outline" moveEnter="fade-up" class="inline-flex items-center gap-1.5">
            <lmn-sparkles [size]="14" />
            A local-first foundation, not a SaaS
          </volt-badge>

          <h1 moveEnter="fade-up" class="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Transactional email, built for one developer's projects.
          </h1>

          <p moveEnter="fade-up" class="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Andersend is a Resend-style email platform I built for myself: a typed HTTP API, a
            queue-backed delivery pipeline, a live dashboard, and a typed SDK — running entirely
            on my machine today, with a real Cloudflare deployment path already wired in.
          </p>

          <div moveEnter="fade-up" class="mt-8 flex flex-wrap gap-3">
            <a [class]="primaryCta" [href]="repoUrl" target="_blank" rel="noopener noreferrer">
              <lmn-github [size]="16" />
              View source on GitHub
            </a>
            <a [class]="secondaryCta" href="#how-it-works">See how it works</a>
          </div>

          <dl moveEnter="fade-up" class="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
            <div>
              <dt class="text-muted-foreground">Built for</dt>
              <dd class="font-semibold">1 developer</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Templates</dt>
              <dd class="font-semibold">3 built-in</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Runtime</dt>
              <dd class="font-semibold">Cloudflare Workers</dd>
            </div>
          </dl>
        </div>

        <volt-card moveEnter="fade-left" class="overflow-hidden font-mono">
          <div class="flex items-center gap-1.5 border-b border-border px-4 py-3">
            <span class="h-2.5 w-2.5 rounded-full bg-destructive/60"></span>
            <span class="h-2.5 w-2.5 rounded-full bg-warning/70"></span>
            <span class="h-2.5 w-2.5 rounded-full bg-success/70"></span>
            <span class="ml-2 text-xs text-muted-foreground">send-welcome-email.ts</span>
          </div>
          <volt-card-content class="p-0">
            <pre class="overflow-x-auto p-5 text-[13px] leading-relaxed"><code>{{ snippet }}</code></pre>
          </volt-card-content>
        </volt-card>
      </div>
    </section>
  `,
})
export class AppHero {
  protected readonly repoUrl = REPO_URL;
  protected readonly snippet = SDK_SNIPPET;
  protected readonly primaryCta = buttonVariants({ variant: 'solid' });
  protected readonly secondaryCta = buttonVariants({ variant: 'outline' });
}
