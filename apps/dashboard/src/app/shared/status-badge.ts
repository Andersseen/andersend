import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { EmailStatus } from '@andersseen/contracts';

const STATUS_CLASSES: Record<EmailStatus, string> = {
  queued: 'border-border bg-muted text-muted-foreground',
  processing: 'border-info/40 bg-info/10 text-info',
  sent: 'border-info/40 bg-info/10 text-info',
  delivered: 'border-success/40 bg-success/10 text-success',
  failed: 'border-destructive/40 bg-destructive/10 text-destructive',
};

const STATUS_LABELS: Record<EmailStatus, string> = {
  queued: 'Queued',
  processing: 'Processing',
  sent: 'Sent',
  delivered: 'Delivered',
  failed: 'Failed',
};

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium"
      [class]="colorClasses()"
    >
      <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-current"></span>
      {{ label() }}
    </span>
  `,
})
export class AppStatusBadge {
  readonly status = input<EmailStatus>('queued');

  protected readonly colorClasses = computed(() => STATUS_CLASSES[this.status()]);
  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
}
