import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LmnGithubIcon } from 'lumen-icons/github';

const REPO_URL = 'https://github.com/Andersseen/andersend';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LmnGithubIcon],
  template: `
    <footer class="border-t border-border">
      <div
        class="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left"
      >
        <div>
          <div class="flex items-center justify-center gap-2 text-sm font-semibold sm:justify-start">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
              >A</span
            >
            Andersend
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            A personal transactional email platform, built by Andrii for Andrii's own projects.
          </p>
        </div>

        <a
          [href]="repoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <lmn-github [size]="16" />
          github.com/Andersseen/andersend
        </a>
      </div>
    </footer>
  `,
})
export class AppSiteFooter {
  protected readonly repoUrl = REPO_URL;
}
