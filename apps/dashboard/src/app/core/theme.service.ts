import { Injectable, computed, effect, signal } from '@angular/core';
import { applyVoltTheme } from '@voltui/components';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'andersend-theme';
const THEME_ORDER: ThemePreference[] = ['light', 'dark', 'system'];

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

/** Persists the user's theme choice and mirrors it onto `<html>` via Volt's `applyVoltTheme`. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly preference = signal<ThemePreference>(readStoredPreference());
  private readonly systemIsDark = signal(systemPrefersDark());

  readonly isDark = computed(() => {
    const preference = this.preference();
    return preference === 'system' ? this.systemIsDark() : preference === 'dark';
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (event) => this.systemIsDark.set(event.matches));
    }

    effect(() => {
      applyVoltTheme({ dark: this.isDark() });
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    window.localStorage.setItem(STORAGE_KEY, preference);
  }

  cyclePreference(): void {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(this.preference()) + 1) % THEME_ORDER.length] ?? 'system';
    this.setPreference(next);
  }
}
