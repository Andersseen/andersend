import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EMAIL_STATUSES, type EmailResponse, type EmailStatus } from '@andersseen/contracts';
import {
  VoltButton,
  VoltInput,
  VoltPagination,
  VoltPaginationNext,
  VoltPaginationPrevious,
  VoltSkeleton,
  VoltTable,
  VoltTableBody,
  VoltTableCell,
  VoltTableHead,
  VoltTableHeader,
  VoltTableRow,
  buttonVariants,
} from '@voltui/components';
import { LmnPaperAirplaneIcon } from 'lumen-icons/paper-airplane';
import { ApiClientService } from '../../core/api-client.service';
import { AppEmptyState } from '../../shared/empty-state';
import { AppErrorState } from '../../shared/error-state';
import { formatDateTime, truncate } from '../../shared/format';
import { AppStatusBadge } from '../../shared/status-badge';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-emails-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    VoltButton,
    VoltInput,
    VoltPagination,
    VoltPaginationPrevious,
    VoltPaginationNext,
    VoltSkeleton,
    VoltTable,
    VoltTableHeader,
    VoltTableRow,
    VoltTableHead,
    VoltTableBody,
    VoltTableCell,
    AppEmptyState,
    AppErrorState,
    AppStatusBadge,
    LmnPaperAirplaneIcon,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Emails</h1>
          <p class="text-sm text-muted-foreground">Search and filter every email sent from this project.</p>
        </div>
        <a routerLink="/emails/new" [class]="sendButtonClass">
          <lmn-paper-airplane [size]="16" />
          Send email
        </a>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label class="sr-only" for="email-search">Search emails</label>
        <volt-input
          id="email-search"
          class="sm:max-w-xs"
          placeholder="Search subject or recipient…"
          [(value)]="searchTerm"
        />
        <select
          class="flex h-10 w-full max-w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-48"
          aria-label="Filter by status"
          (change)="statusFilter.set($any($event.target).value)"
        >
          <option value="">All statuses</option>
          @for (status of statuses; track status) {
            <option [value]="status">{{ status }}</option>
          }
        </select>
      </div>

      @if (error()) {
        <app-error-state [message]="error()!" (retry)="load()" />
      } @else if (loading()) {
        <div class="flex flex-col gap-2">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <volt-skeleton height="3rem" />
          }
        </div>
      } @else if (emails().length === 0) {
        <app-empty-state
          title="No emails match your filters"
          description="Try clearing the search or status filter, or send your first email."
        >
          <volt-button variant="outline" size="sm" (click)="clearFilters()">Clear filters</volt-button>
        </app-empty-state>
      } @else {
        <div class="overflow-x-auto rounded-xl border border-border">
          <volt-table>
            <volt-table-header>
              <volt-table-row>
                <volt-table-head>Recipient</volt-table-head>
                <volt-table-head>Subject</volt-table-head>
                <volt-table-head>Template</volt-table-head>
                <volt-table-head>Status</volt-table-head>
                <volt-table-head>Created</volt-table-head>
                <volt-table-head>Provider ID</volt-table-head>
                <volt-table-head><span class="sr-only">Open</span></volt-table-head>
              </volt-table-row>
            </volt-table-header>
            <volt-table-body>
              @for (email of emails(); track email.id) {
                <volt-table-row class="hover:bg-muted/50">
                  <volt-table-cell class="max-w-40 truncate">{{ email.to.join(', ') }}</volt-table-cell>
                  <volt-table-cell class="max-w-56 truncate">{{ email.subject }}</volt-table-cell>
                  <volt-table-cell>{{ email.templateSlug ?? '—' }}</volt-table-cell>
                  <volt-table-cell><app-status-badge [status]="email.status" /></volt-table-cell>
                  <volt-table-cell class="whitespace-nowrap text-muted-foreground">{{
                    formatDateTime(email.createdAt)
                  }}</volt-table-cell>
                  <volt-table-cell class="font-mono text-xs text-muted-foreground">{{
                    truncateId(email.providerMessageId)
                  }}</volt-table-cell>
                  <volt-table-cell>
                    <a [routerLink]="['/emails', email.id]" class="text-sm font-medium text-primary hover:underline">
                      View
                    </a>
                  </volt-table-cell>
                </volt-table-row>
              }
            </volt-table-body>
          </volt-table>
        </div>

        <div class="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {{ page() }} of {{ totalPages() }} &middot; {{ total() }} total</span>
          <volt-pagination [(page)]="page" [pageCount]="totalPages()">
            <volt-pagination-previous />
            <volt-pagination-next />
          </volt-pagination>
        </div>
      }
    </div>
  `,
})
export default class EmailsPage {
  private readonly api = inject(ApiClientService);

  protected readonly statuses = EMAIL_STATUSES;
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<EmailStatus | ''>('');
  protected readonly page = signal(1);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly emails = signal<EmailResponse[]>([]);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(1);

  protected readonly formatDateTime = formatDateTime;
  protected readonly sendButtonClass = buttonVariants({ variant: 'solid' });

  constructor() {
    effect(() => {
      this.searchTerm();
      this.statusFilter();
      this.page();
      void this.load();
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.api.client.emails.list({
        page: this.page(),
        pageSize: PAGE_SIZE,
        q: this.searchTerm() || undefined,
        status: this.statusFilter() || undefined,
      });
      this.emails.set(result.data);
      this.total.set(result.pagination.total);
      this.totalPages.set(result.pagination.totalPages);
    } catch {
      this.error.set('Could not load emails from the API.');
    } finally {
      this.loading.set(false);
    }
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.page.set(1);
  }

  truncateId(id: string | null): string {
    return id ? truncate(id, 18) : '—';
  }
}
