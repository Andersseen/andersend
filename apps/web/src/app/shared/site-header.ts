import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VoltBadge, buttonVariants } from '@voltui/components';
import { LmnArrowTopRightOnSquareIcon } from 'lumen-icons/arrow-top-right-on-square';
import { LmnGithubIcon } from 'lumen-icons/github';
import { AppThemeSwitcher } from './theme-switcher';

const REPO_URL = 'https://github.com/Andersseen/andersend';

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VoltBadge, AppThemeSwitcher, LmnGithubIcon, LmnArrowTopRightOnSquareIcon],
  template: `
    <header
      class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" class="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
            >A</span
          >
          Andersend
          <volt-badge variant="outline" class="hidden sm:inline-flex">Personal project</volt-badge>
        </a>

        <nav class="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" class="transition-colors hover:text-foreground">Features</a>
          <a href="#how-it-works" class="transition-colors hover:text-foreground">How it works</a>
          <a href="#stack" class="transition-colors hover:text-foreground">Stack</a>
          <a href="#scope" class="transition-colors hover:text-foreground">Scope</a>
        </nav>

        <div class="flex items-center gap-2">
          <app-theme-switcher />
          <a
            [href]="repoUrl"
            target="_blank"
            rel="noopener noreferrer"
            [class]="sourceButtonClass"
          >
            <lmn-github [size]="16" />
            <span class="hidden sm:inline">View source</span>
            <lmn-arrow-top-right-on-square [size]="14" class="hidden sm:inline" />
          </a>
        </div>
      </div>
    </header>
  `,
})
export class AppSiteHeader {
  protected readonly repoUrl = REPO_URL;
  protected readonly sourceButtonClass = buttonVariants({ variant: 'outline', size: 'sm' });
}
