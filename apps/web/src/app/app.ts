import { Component } from '@angular/core';
import { AppSiteFooter } from './shared/site-footer';
import { AppSiteHeader } from './shared/site-header';
import { AppFeatures } from './sections/features';
import { AppFinalCta } from './sections/final-cta';
import { AppHero } from './sections/hero';
import { AppHonesty } from './sections/honesty';
import { AppHowItWorks } from './sections/how-it-works';
import { AppTechStack } from './sections/tech-stack';

@Component({
  selector: 'app-root',
  imports: [
    AppSiteHeader,
    AppHero,
    AppFeatures,
    AppHowItWorks,
    AppTechStack,
    AppHonesty,
    AppFinalCta,
    AppSiteFooter,
  ],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <app-site-header />
      <main>
        <app-hero />
        <app-features />
        <app-how-it-works />
        <app-tech-stack />
        <app-honesty />
        <app-final-cta />
      </main>
      <app-site-footer />
    </div>
  `,
})
export class App {}
