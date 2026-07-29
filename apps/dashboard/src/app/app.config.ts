import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideFileRouter } from '@analogjs/router';
import { provideVoltTheme } from '@voltui/components';
import { provideMovement } from 'angular-movement';
import { provideToastConfig } from 'ng-primitives/toast';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideFileRouter(),
    provideHttpClient(withFetch()),
    provideVoltTheme({ color: 'volt', style: 'sharp' }),
    provideMovement({ disabled: prefersReducedMotion }),
    provideToastConfig({ placement: 'bottom-end', duration: 5000 }),
  ],
};
