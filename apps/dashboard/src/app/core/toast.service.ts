import { Injectable, inject } from '@angular/core';
import { NgpToastManager } from 'ng-primitives/toast';
import { AppToastNotification, type ToastContext } from '../shared/toast-notification';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly manager = inject(NgpToastManager);

  success(message: string, title?: string): void {
    this.show({ type: 'success', message, title });
  }

  error(message: string, title?: string): void {
    this.show({ type: 'error', message, title });
  }

  private show(context: ToastContext): void {
    this.manager.show(AppToastNotification, { context, placement: 'bottom-end' });
  }
}
