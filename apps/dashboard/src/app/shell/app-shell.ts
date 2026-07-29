import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import {
  VoltAvatar,
  VoltAvatarFallback,
  VoltBadge,
  VoltDrawer,
  VoltDrawerContent,
  VoltDrawerOverlay,
  VoltDrawerTitle,
} from '@voltui/components';
import { LmnBars3Icon } from 'lumen-icons/bars-3';
import { AppApiStatusIndicator } from './api-status-indicator';
import { AppNavList } from './nav-list';
import { AppThemeSwitcher } from './theme-switcher';

// eslint-disable-next-line turbo/no-undeclared-env-vars -- `DEV` is Vite's built-in flag, not a project env var.
const ENVIRONMENT_LABEL = import.meta.env.DEV ? 'Local' : 'Production';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterOutlet,
    AppNavList,
    AppThemeSwitcher,
    AppApiStatusIndicator,
    VoltAvatar,
    VoltAvatarFallback,
    VoltBadge,
    VoltDrawer,
    VoltDrawerOverlay,
    VoltDrawerContent,
    VoltDrawerTitle,
    LmnBars3Icon,
  ],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <div class="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside
          class="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4 md:flex"
        >
          <a routerLink="/" class="flex items-center gap-2 px-2 py-1 text-lg font-semibold tracking-tight">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
              >A</span
            >
            Andersend
          </a>
          <app-nav-list class="flex-1" />
          <div class="border-t border-border pt-4">
            <app-api-status-indicator />
          </div>
        </aside>

        <div class="flex min-h-screen flex-1 flex-col">
          <header
            class="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6"
          >
            <div class="flex items-center gap-3 md:hidden">
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open navigation menu"
                [voltDrawer]="mobileNavTpl"
              >
                <lmn-bars-3 [size]="16" />
              </button>
              <span class="text-sm font-semibold">Andersend</span>
            </div>

            <div class="hidden items-center gap-2 md:flex">
              <volt-badge variant="outline">{{ environmentLabel }}</volt-badge>
            </div>

            <div class="flex items-center gap-3">
              <app-theme-switcher />
              <div class="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5">
                <volt-avatar class="h-7 w-7">
                  <volt-avatar-fallback class="text-xs">A</volt-avatar-fallback>
                </volt-avatar>
                <span class="hidden text-sm font-medium sm:inline">Andrii</span>
              </div>
            </div>
          </header>

          <main id="main-content" class="flex-1 p-4 sm:p-6 lg:p-8">
            <router-outlet />
          </main>
        </div>
      </div>
    </div>

    <ng-template #mobileNavTpl let-close="close">
      <div voltDrawerOverlay></div>
      <div voltDrawerContent side="left" class="flex flex-col gap-6 p-4">
        <h2 voltDrawerTitle class="px-2 text-lg font-semibold">Andersend</h2>
        <app-nav-list (linkActivated)="close()" />
      </div>
    </ng-template>
  `,
})
export class AppShell {
  protected readonly environmentLabel = ENVIRONMENT_LABEL;
}
