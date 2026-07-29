import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VoltButton],
  host: { class: 'block' },
  template: `
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
      role="alert"
    >
      <p class="text-sm font-medium text-destructive">{{ message() }}</p>
      <volt-button variant="outline" size="sm" (click)="retry.emit()">Try again</volt-button>
    </div>
  `,
})
export class AppErrorState {
  readonly message = input<string>('Something went wrong. Please try again.');
  readonly retry = output<void>();
}
