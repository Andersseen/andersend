import { mergeApplicationConfig, type ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

// Used only by Analog's build-time prerendering pass (`static: true` in
// vite.config.ts) to generate the initial `index.html`; the deployed app is
// a plain client-rendered SPA (see context.md — no SSR runtime).
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
