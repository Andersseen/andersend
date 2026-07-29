import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { EmailEvent, EmailResponse } from '@andersseen/contracts';
import {
  VoltBadge,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltSkeleton,
  VoltTabs,
  VoltTabsContent,
  VoltTabsList,
  VoltTabsTrigger,
} from '@voltui/components';
import { LmnArrowLeftIcon } from 'lumen-icons/arrow-left';
import { LmnCheckCircleIcon } from 'lumen-icons/check-circle';
import { LmnClockIcon } from 'lumen-icons/clock';
import { LmnArrowPathIcon } from 'lumen-icons/arrow-path';
import { LmnXCircleIcon } from 'lumen-icons/x-circle';
import { ApiClientService } from '../../core/api-client.service';
import { AppErrorState } from '../../shared/error-state';
import { formatDateTime } from '../../shared/format';
import { AppStatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-email-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    VoltBadge,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltSkeleton,
    VoltTabs,
    VoltTabsList,
    VoltTabsTrigger,
    VoltTabsContent,
    AppErrorState,
    AppStatusBadge,
    LmnArrowLeftIcon,
    LmnCheckCircleIcon,
    LmnClockIcon,
    LmnArrowPathIcon,
    LmnXCircleIcon,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <a routerLink="/emails" class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <lmn-arrow-left [size]="16" />
        Back to emails
      </a>

      @if (error()) {
        <app-error-state [message]="error()!" (retry)="load()" />
      } @else if (loading()) {
        <volt-skeleton height="12rem" />
        <volt-skeleton height="16rem" />
      } @else if (email(); as email) {
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight">{{ email.subject || '(no subject)' }}</h1>
            <p class="text-sm text-muted-foreground">{{ email.id }}</p>
          </div>
          <app-status-badge [status]="email.status" />
        </div>

        @if (email.status === 'failed') {
          <div class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <p class="font-medium">{{ email.errorCode }}</p>
            <p>{{ email.errorMessage }}</p>
          </div>
        }

        <div class="grid gap-4 lg:grid-cols-3">
          <volt-card class="lg:col-span-2">
            <volt-card-header>
              <volt-card-title>Content</volt-card-title>
              <volt-card-description>Rendered preview of what was sent.</volt-card-description>
            </volt-card-header>
            <volt-card-content>
              <volt-tabs value="html">
                <volt-tabs-list>
                  <volt-tabs-trigger value="html">HTML</volt-tabs-trigger>
                  <volt-tabs-trigger value="text">Plain text</volt-tabs-trigger>
                </volt-tabs-list>
                <volt-tabs-content value="html">
                  <div
                    class="prose prose-sm max-w-none rounded-lg border border-border bg-background p-4"
                    [innerHTML]="email.html"
                  ></div>
                </volt-tabs-content>
                <volt-tabs-content value="text">
                  <pre class="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm">{{
                    email.text
                  }}</pre>
                </volt-tabs-content>
              </volt-tabs>
            </volt-card-content>
          </volt-card>

          <volt-card>
            <volt-card-header>
              <volt-card-title>Metadata</volt-card-title>
            </volt-card-header>
            <volt-card-content class="flex flex-col gap-3 text-sm">
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground">From</span>
                <span class="truncate text-right">{{ email.from }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground">To</span>
                <span class="truncate text-right">{{ email.to.join(', ') }}</span>
              </div>
              @if (email.cc.length) {
                <div class="flex justify-between gap-2">
                  <span class="text-muted-foreground">Cc</span>
                  <span class="truncate text-right">{{ email.cc.join(', ') }}</span>
                </div>
              }
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground">Template</span>
                <span>{{ email.templateSlug ?? '—' }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground">Provider ID</span>
                <span class="truncate text-right font-mono text-xs">{{ email.providerMessageId ?? '—' }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground">Idempotency key</span>
                <span class="truncate text-right font-mono text-xs">{{ email.idempotencyKey ?? '—' }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground">Created</span>
                <span>{{ formatDateTime(email.createdAt) }}</span>
              </div>
            </volt-card-content>
          </volt-card>
        </div>

        <volt-card>
          <volt-card-header>
            <volt-card-title>Event timeline</volt-card-title>
          </volt-card-header>
          <volt-card-content>
            <ol class="flex flex-col gap-4">
              @for (event of events(); track event.id) {
                <li class="flex items-start gap-3">
                  <span class="mt-0.5" [class]="eventIconClass(event.type)">
                    @switch (event.type) {
                      @case ('queued') {
                        <lmn-clock [size]="16" />
                      }
                      @case ('processing') {
                        <lmn-arrow-path [size]="16" />
                      }
                      @case ('failed') {
                        <lmn-x-circle [size]="16" />
                      }
                      @default {
                        <lmn-check-circle [size]="16" />
                      }
                    }
                  </span>
                  <div>
                    <p class="text-sm font-medium capitalize">{{ event.type }}</p>
                    <p class="text-xs text-muted-foreground">{{ formatDateTime(event.createdAt) }}</p>
                  </div>
                </li>
              }
            </ol>
          </volt-card-content>
        </volt-card>
      }
    </div>
  `,
})
export default class EmailDetailsPage {
  private readonly api = inject(ApiClientService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly email = signal<EmailResponse | null>(null);
  protected readonly events = signal<EmailEvent[]>([]);
  protected readonly formatDateTime = formatDateTime;

  private pollTimeoutId: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.route.paramMap.subscribe(() => void this.load());
    inject(DestroyRef).onDestroy(() => clearTimeout(this.pollTimeoutId));
  }

  async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    clearTimeout(this.pollTimeoutId);
    this.loading.set(true);
    this.error.set(null);
    try {
      const [email, events] = await Promise.all([
        this.api.client.emails.get(id),
        this.api.client.emails.getEvents(id),
      ]);
      this.email.set(email);
      this.events.set(events);

      if (email.status === 'queued' || email.status === 'processing') {
        this.pollTimeoutId = setTimeout(() => void this.load(), 2000);
      }
    } catch {
      this.error.set('Could not load this email from the API.');
    } finally {
      this.loading.set(false);
    }
  }

  protected eventIconClass(type: EmailEvent['type']): string {
    if (type === 'failed') return 'text-destructive';
    if (type === 'queued' || type === 'processing') return 'text-muted-foreground';
    return 'text-success';
  }
}
