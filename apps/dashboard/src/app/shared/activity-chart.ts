import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { DailyActivity } from '@andersseen/contracts';

/** Lightweight CSS-only stacked bar chart — no charting library needed for 7 data points. */
@Component({
  selector: 'app-activity-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-end gap-3 sm:gap-4" role="img" [attr.aria-label]="ariaLabel()">
      @for (day of data(); track day.date) {
        <div class="flex flex-1 flex-col items-center gap-2">
          <div class="flex h-32 w-full max-w-9 flex-col-reverse overflow-hidden rounded-md bg-muted">
            <div class="w-full bg-success" [style.height.%]="percent(day.delivered)"></div>
            <div class="w-full bg-destructive" [style.height.%]="percent(day.failed)"></div>
          </div>
          <span class="text-[11px] text-muted-foreground">{{ dayLabel(day.date) }}</span>
        </div>
      }
    </div>
  `,
})
export class AppActivityChart {
  readonly data = input<DailyActivity[]>([]);

  protected readonly maxValue = computed(() =>
    Math.max(1, ...this.data().map((day) => day.delivered + day.failed)),
  );

  protected percent(count: number): number {
    return (count / this.maxValue()) * 100;
  }

  protected dayLabel(date: string): string {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short' });
  }

  protected ariaLabel(): string {
    const parts = this.data().map(
      (day) => `${this.dayLabel(day.date)}: ${day.delivered} delivered, ${day.failed} failed`,
    );
    return `7-day email activity. ${parts.join('. ')}.`;
  }
}
