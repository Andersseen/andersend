import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center"
    >
      <p class="text-sm font-medium text-foreground">{{ title() }}</p>
      @if (description()) {
        <p class="max-w-sm text-sm text-muted-foreground">{{ description() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class AppEmptyState {
  readonly title = input<string>('');
  readonly description = input<string>('');
}
