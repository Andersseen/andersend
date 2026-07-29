import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Template } from '@andersseen/contracts';
import {
  VoltBadge,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltSkeleton,
} from '@voltui/components';
import { MoveEnterDirective, MoveStaggerDirective } from 'angular-movement';
import { ApiClientService } from '../../core/api-client.service';
import { AppEmptyState } from '../../shared/empty-state';
import { AppErrorState } from '../../shared/error-state';

@Component({
  selector: 'app-templates-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltBadge,
    VoltSkeleton,
    AppEmptyState,
    AppErrorState,
    MoveEnterDirective,
    MoveStaggerDirective,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Templates</h1>
        <p class="text-sm text-muted-foreground">Manage the built-in transactional email templates.</p>
      </div>

      @if (error()) {
        <app-error-state [message]="error()!" (retry)="load()" />
      } @else if (loading()) {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (i of [1, 2, 3]; track i) {
            <volt-skeleton height="8rem" />
          }
        </div>
      } @else if (templates().length === 0) {
        <app-empty-state
          title="No templates yet"
          description="Templates rendered via the API will show up here."
        />
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" [moveStagger]="60">
          @for (template of templates(); track template.id) {
            <a [routerLink]="['/templates', template.id]" moveEnter="fade-up" class="block">
              <volt-card class="h-full transition-colors hover:border-primary/50">
                <volt-card-header>
                  <div class="flex items-center justify-between gap-2">
                    <volt-card-title>{{ template.name }}</volt-card-title>
                    <volt-badge variant="secondary">{{ template.slug }}</volt-badge>
                  </div>
                  <volt-card-description class="truncate">{{ template.subject }}</volt-card-description>
                </volt-card-header>
                <volt-card-content class="text-sm text-muted-foreground">
                  {{ variableSummary(template) }}
                </volt-card-content>
              </volt-card>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export default class TemplatesPage {
  private readonly api = inject(ApiClientService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly templates = signal<Template[]>([]);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.templates.set(await this.api.client.templates.list());
    } catch {
      this.error.set('Could not load templates from the API.');
    } finally {
      this.loading.set(false);
    }
  }

  protected variableSummary(template: Template): string {
    const names = Object.keys(template.variables);
    return names.length ? `Variables: ${names.join(', ')}` : 'No variables';
  }
}
