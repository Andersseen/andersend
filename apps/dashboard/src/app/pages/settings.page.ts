import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { HealthResponse } from '@andersseen/contracts';
import {
  VoltBadge,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltSkeleton,
} from '@voltui/components';
import { ApiClientService } from '../core/api-client.service';
import { ThemeService, type ThemePreference } from '../core/theme.service';
import { AppErrorState } from '../shared/error-state';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VoltBadge,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltSkeleton,
    AppErrorState,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
        <p class="text-sm text-muted-foreground">Project configuration for this local environment.</p>
      </div>

      <volt-card>
        <volt-card-header>
          <volt-card-title>Project</volt-card-title>
        </volt-card-header>
        <volt-card-content class="flex flex-col gap-3 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Project name</span>
            <span>Andersseen Personal</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Dashboard domain</span>
            <span class="font-mono text-xs">mail.andersseen.dev</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">API domain</span>
            <span class="font-mono text-xs">api.mail.andersseen.dev</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Sender domain</span>
            <span class="font-mono text-xs">andersseen.dev</span>
          </div>
        </volt-card-content>
      </volt-card>

      @if (error()) {
        <app-error-state [message]="error()!" (retry)="load()" />
      } @else if (loading()) {
        <volt-skeleton height="10rem" />
      } @else if (health(); as health) {
        <volt-card>
          <volt-card-header>
            <volt-card-title>Environment</volt-card-title>
          </volt-card-header>
          <volt-card-content class="flex flex-col gap-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Environment</span>
              <volt-badge variant="outline">{{ health.environment }}</volt-badge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Active email provider</span>
              <volt-badge variant="secondary">{{
                health.provider === 'cloudflare' ? 'Cloudflare Email Service' : 'Mock provider'
              }}</volt-badge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Database connectivity</span>
              <volt-badge [variant]="health.database === 'connected' ? 'secondary' : 'destructive'">
                {{ health.database }}
              </volt-badge>
            </div>
          </volt-card-content>
        </volt-card>
      }

      <volt-card>
        <volt-card-header>
          <volt-card-title>Cloudflare resources</volt-card-title>
          <volt-card-description>All resources run locally via Miniflare in this iteration.</volt-card-description>
        </volt-card-header>
        <volt-card-content class="flex flex-col gap-3 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">D1 database</span>
            <volt-badge variant="outline">Local</volt-badge>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Queue (andersend-emails)</span>
            <volt-badge variant="outline">Local</volt-badge>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Email Service binding</span>
            <volt-badge variant="outline">Not onboarded (mocked)</volt-badge>
          </div>
        </volt-card-content>
      </volt-card>

      <volt-card>
        <volt-card-header>
          <volt-card-title>Appearance</volt-card-title>
        </volt-card-header>
        <volt-card-content>
          <div class="flex gap-2" role="radiogroup" aria-label="Theme preference">
            @for (option of themeOptions; track option.value) {
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="theme.preference() === option.value"
                class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                [class]="
                  theme.preference() === option.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-muted'
                "
                (click)="theme.setPreference(option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </volt-card-content>
      </volt-card>
    </div>
  `,
})
export default class SettingsPage {
  private readonly api = inject(ApiClientService);
  protected readonly theme = inject(ThemeService);

  protected readonly themeOptions = THEME_OPTIONS;
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly health = signal<HealthResponse | null>(null);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.health.set(await this.api.client.health.get());
    } catch {
      this.error.set('Could not load environment information from the API.');
    } finally {
      this.loading.set(false);
    }
  }
}
