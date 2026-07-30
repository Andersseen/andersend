import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LmnComputerDesktopIcon } from 'lumen-icons/computer-desktop';
import { LmnMoonIcon } from 'lumen-icons/moon';
import { LmnSunIcon } from 'lumen-icons/sun';
import { ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-theme-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LmnSunIcon, LmnMoonIcon, LmnComputerDesktopIcon],
  template: `
    <button
      type="button"
      class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      [attr.aria-label]="label()"
      [attr.title]="label()"
      (click)="theme.cyclePreference()"
    >
      @switch (theme.preference()) {
        @case ('light') {
          <lmn-sun [size]="16" />
        }
        @case ('dark') {
          <lmn-moon [size]="16" />
        }
        @default {
          <lmn-computer-desktop [size]="16" />
        }
      }
    </button>
  `,
})
export class AppThemeSwitcher {
  protected readonly theme = inject(ThemeService);

  protected readonly label = computed(() => `Theme: ${this.theme.preference()} (click to change)`);
}
