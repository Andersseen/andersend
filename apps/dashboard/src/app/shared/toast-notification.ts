import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectToastContext } from 'ng-primitives/toast';
import { VoltToast, VoltToastClose, VoltToastDescription, VoltToastTitle } from '@voltui/components';

export interface ToastContext {
  readonly type: 'success' | 'error';
  readonly title?: string;
  readonly message: string;
}

@Component({
  selector: 'app-toast-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VoltToast, VoltToastTitle, VoltToastDescription, VoltToastClose],
  template: `
    <volt-toast [variant]="context.type" class="pointer-events-auto w-full max-w-sm shadow-lg">
      <div class="flex flex-1 flex-col gap-0.5">
        @if (context.title) {
          <volt-toast-title>{{ context.title }}</volt-toast-title>
        }
        <volt-toast-description>{{ context.message }}</volt-toast-description>
      </div>
      <volt-toast-close />
    </volt-toast>
  `,
})
export class AppToastNotification {
  protected readonly context = injectToastContext<ToastContext>();
}
