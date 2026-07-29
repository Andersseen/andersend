import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { ApiKey } from '@andersseen/contracts';
import {
  VoltBadge,
  VoltButton,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltSkeleton,
} from '@voltui/components';
import { LmnClipboardDocumentIcon } from 'lumen-icons/clipboard-document';
import { TooltipDirective } from 'quartz-headless';
import { ApiClientService } from '../core/api-client.service';
import { ToastService } from '../core/toast.service';
import { AppErrorState } from '../shared/error-state';
import { formatDateTime } from '../shared/format';

const DEV_API_KEY_PLAINTEXT = 'and_dev_local';
const SDK_EXAMPLE = `import { createAndersendClient } from '@andersseen/sdk';

const andersend = createAndersendClient({
  apiKey: process.env.ANDERSEND_API_KEY!,
  baseUrl: 'http://localhost:8787',
});

await andersend.emails.send({
  to: ['user@example.com'],
  template: 'welcome',
  variables: { name: 'Andrii' },
});`;

@Component({
  selector: 'app-api-keys-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VoltBadge,
    VoltButton,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltSkeleton,
    AppErrorState,
    LmnClipboardDocumentIcon,
    TooltipDirective,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">API keys</h1>
        <p class="text-sm text-muted-foreground">Local development access to the Andersend API.</p>
      </div>

      <div class="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
        Full API key management (creating, rotating, and revoking keys) is not implemented yet. This
        page shows the single local development key seeded into D1.
      </div>

      @if (error()) {
        <app-error-state [message]="error()!" (retry)="load()" />
      } @else if (loading()) {
        <volt-skeleton height="10rem" />
      } @else if (apiKey(); as key) {
        <volt-card>
          <volt-card-header>
            <volt-card-title>{{ key.name }}</volt-card-title>
            <volt-card-description>Created {{ formatDateTime(key.createdAt) }}</volt-card-description>
          </volt-card-header>
          <volt-card-content class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-muted-foreground">Key</span>
              <div class="flex items-center gap-2">
                <code class="rounded-md bg-muted px-3 py-2 font-mono text-sm">{{ key.prefix }}••••••••••••</code>
                <volt-badge variant="outline">Masked</volt-badge>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-xs font-medium text-muted-foreground">Prefix</p>
                <p class="font-mono">{{ key.prefix }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-muted-foreground">Last used</p>
                <p>{{ key.lastUsedAt ? formatDateTime(key.lastUsedAt) : 'Never' }}</p>
              </div>
            </div>
          </volt-card-content>
        </volt-card>

        <volt-card>
          <volt-card-header>
            <volt-card-title>Environment variable</volt-card-title>
            <volt-card-description>Used by the API worker and the SDK in local development.</volt-card-description>
          </volt-card-header>
          <volt-card-content>
            <div class="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
              <code class="font-mono text-sm">ANDERSEND_API_KEY={{ devKeyPlaintext }}</code>
              <volt-button
                variant="ghost"
                size="icon"
                (click)="copy('ANDERSEND_API_KEY=' + devKeyPlaintext)"
                aria-label="Copy environment variable"
                qzTooltip="Copy to clipboard"
              >
                <lmn-clipboard-document [size]="16" />
              </volt-button>
            </div>
          </volt-card-content>
        </volt-card>

        <volt-card>
          <volt-card-header>
            <volt-card-title>SDK usage</volt-card-title>
            <volt-card-description>Send an email from any Node.js or Workers project.</volt-card-description>
          </volt-card-header>
          <volt-card-content>
            <div class="flex items-start justify-between gap-3 rounded-md bg-muted px-3 py-3">
              <pre class="overflow-x-auto font-mono text-xs leading-relaxed">{{ sdkExample }}</pre>
              <volt-button
                variant="ghost"
                size="icon"
                class="shrink-0"
                (click)="copy(sdkExample)"
                aria-label="Copy SDK example"
                qzTooltip="Copy to clipboard"
              >
                <lmn-clipboard-document [size]="16" />
              </volt-button>
            </div>
          </volt-card-content>
        </volt-card>
      }
    </div>
  `,
})
export default class ApiKeysPage {
  private readonly api = inject(ApiClientService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly apiKey = signal<ApiKey | null>(null);

  protected readonly devKeyPlaintext = DEV_API_KEY_PLAINTEXT;
  protected readonly sdkExample = SDK_EXAMPLE;
  protected readonly formatDateTime = formatDateTime;

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const keys = await this.api.client.apiKeys.list();
      this.apiKey.set(keys[0] ?? null);
    } catch {
      this.error.set('Could not load API keys from the API.');
    } finally {
      this.loading.set(false);
    }
  }

  async copy(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.toast.success('Copied to clipboard.');
    } catch {
      this.toast.error('Could not copy to clipboard.');
    }
  }
}
