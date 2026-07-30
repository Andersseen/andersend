import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideVoltTheme } from '@voltui/components';
import { provideMovement } from 'angular-movement';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideVoltTheme({ color: 'volt', style: 'sharp' }),
    provideMovement({ disabled: prefersReducedMotion }),
  ],
};
