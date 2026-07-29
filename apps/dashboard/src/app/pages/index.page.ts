import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DashboardStats } from '@andersseen/contracts';
import {
  VoltBadge,
  VoltButton,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltSkeleton,
  buttonVariants,
} from '@voltui/components';
import { MoveEnterDirective, MoveStaggerDirective } from 'angular-movement';
import { LmnPaperAirplaneIcon } from 'lumen-icons/paper-airplane';
import { ApiClientService } from '../core/api-client.service';
import { AppActivityChart } from '../shared/activity-chart';
import { AppErrorState } from '../shared/error-state';
import { formatDateTime } from '../shared/format';
import { AppStatTile } from '../shared/stat-tile';
import { AppStatusBadge } from '../shared/status-badge';

@Component({
  selector: 'app-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    VoltBadge,
    VoltButton,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltSkeleton,
    AppActivityChart,
    AppErrorState,
    AppStatTile,
    AppStatusBadge,
    MoveEnterDirective,
    MoveStaggerDirective,
    LmnPaperAirplaneIcon,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Overview</h1>
          <p class="text-sm text-muted-foreground">Your Andersend activity at a glance.</p>
        </div>
        <a [routerLink]="['/emails/new']" [class]="quickSendClass">
          <lmn-paper-airplane [size]="16" />
          Send email
        </a>
      </div>

      @if (error()) {
        <app-error-state [message]="error()!" (retry)="load()" />
      } @else if (loading()) {
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          @for (i of [1, 2, 3, 4]; track i) {
            <volt-skeleton height="6rem" />
          }
        </div>
        <volt-skeleton height="16rem" />
      } @else if (stats(); as data) {
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4" [moveStagger]="80">
          <app-stat-tile
            moveEnter="fade-up"
            label="Sent today"
            [value]="data.sentToday.toString()"
          />
          <app-stat-tile
            moveEnter="fade-up"
            label="Delivery rate"
            [value]="data.deliveryRate + '%'"
          />
          <app-stat-tile
            moveEnter="fade-up"
            label="Failed emails"
            [value]="data.failed.toString()"
          />
          <app-stat-tile
            moveEnter="fade-up"
            label="Active templates"
            [value]="data.activeTemplates.toString()"
          />
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <volt-card class="lg:col-span-2">
            <volt-card-header>
              <volt-card-title>Last 7 days</volt-card-title>
              <volt-card-description>Delivered vs. failed sends per day.</volt-card-description>
            </volt-card-header>
            <volt-card-content>
              <app-activity-chart [data]="data.recentActivity" />
            </volt-card-content>
          </volt-card>

          <volt-card>
            <volt-card-header>
              <volt-card-title>Platform status</volt-card-title>
              <volt-card-description>Local development environment.</volt-card-description>
            </volt-card-header>
            <volt-card-content class="flex flex-col gap-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Email provider</span>
                <volt-badge variant="secondary">{{ providerLabel() }}</volt-badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">andersseen.dev</span>
                <volt-badge variant="outline">Not onboarded (local)</volt-badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Database</span>
                <volt-badge variant="secondary">D1 (local)</volt-badge>
              </div>
            </volt-card-content>
          </volt-card>
        </div>

        <volt-card>
          <volt-card-header class="flex flex-row items-center justify-between">
            <div>
              <volt-card-title>Recent emails</volt-card-title>
              <volt-card-description>The last 5 emails sent from this project.</volt-card-description>
            </div>
            <a [routerLink]="['/emails']" class="text-sm font-medium text-primary hover:underline">
              View all
            </a>
          </volt-card-header>
          <volt-card-content>
            @if (data.recentEmails.length === 0) {
              <p class="py-4 text-center text-sm text-muted-foreground">No emails sent yet.</p>
            } @else {
              <ul class="flex flex-col divide-y divide-border">
                @for (email of data.recentEmails; track email.id) {
                  <li class="flex items-center justify-between gap-4 py-3">
                    <div class="min-w-0">
                      <a
                        [routerLink]="['/emails', email.id]"
                        class="block truncate text-sm font-medium text-foreground hover:underline"
                      >
                        {{ email.subject }}
                      </a>
                      <p class="truncate text-xs text-muted-foreground">
                        {{ email.to.join(', ') }} &middot; {{ formatDateTime(email.createdAt) }}
                      </p>
                    </div>
                    <app-status-badge [status]="email.status" />
                  </li>
                }
              </ul>
            }
          </volt-card-content>
        </volt-card>
      }
    </div>
  `,
})
export default class OverviewPage {
  private readonly api = inject(ApiClientService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly providerLabel = signal('Mock provider');
  protected readonly quickSendClass = buttonVariants({ variant: 'solid' });
  protected readonly formatDateTime = formatDateTime;

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [stats, health] = await Promise.all([this.api.client.stats.get(), this.api.client.health.get()]);
      this.stats.set(stats);
      this.providerLabel.set(health.provider === 'cloudflare' ? 'Cloudflare Email Service' : 'Mock provider');
    } catch {
      this.error.set('Could not load dashboard statistics from the API.');
    } finally {
      this.loading.set(false);
    }
  }
}
