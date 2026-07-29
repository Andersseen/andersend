import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ApiClientService } from '../core/api-client.service';

type ApiStatus = 'checking' | 'online' | 'offline';

const POLL_INTERVAL_MS = 30_000;

const STATUS_LABEL: Record<ApiStatus, string> = {
  checking: 'Checking API…',
  online: 'API online',
  offline: 'API offline',
};

const STATUS_DOT_CLASS: Record<ApiStatus, string> = {
  checking: 'bg-muted-foreground',
  online: 'bg-success',
  offline: 'bg-destructive',
};

@Component({
  selector: 'app-api-status-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-2 text-xs text-muted-foreground" role="status">
      <span class="h-2 w-2 rounded-full" [class]="dotClass()"></span>
      {{ label() }}
    </span>
  `,
})
export class AppApiStatusIndicator {
  private readonly api = inject(ApiClientService);

  protected readonly status = signal<ApiStatus>('checking');
  protected readonly label = signal(STATUS_LABEL.checking);
  protected readonly dotClass = signal(STATUS_DOT_CLASS.checking);

  constructor() {
    const check = async () => {
      try {
        const health = await this.api.client.health.get();
        this.setStatus(health.status === 'ok' ? 'online' : 'offline');
      } catch {
        this.setStatus('offline');
      }
    };

    void check();
    const intervalId = setInterval(() => void check(), POLL_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalId));
  }

  private setStatus(status: ApiStatus): void {
    this.status.set(status);
    this.label.set(STATUS_LABEL[status]);
    this.dotClass.set(STATUS_DOT_CLASS[status]);
  }
}
