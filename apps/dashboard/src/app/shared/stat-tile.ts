import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { VoltCard, VoltCardContent } from '@voltui/components';

@Component({
  selector: 'app-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VoltCard, VoltCardContent],
  host: { class: 'block' },
  template: `
    <volt-card>
      <volt-card-content class="flex flex-col gap-1 p-5">
        <span class="text-sm text-muted-foreground">{{ label() }}</span>
        <span class="text-2xl font-semibold tracking-tight">{{ value() }}</span>
        @if (hint()) {
          <span class="text-xs text-muted-foreground">{{ hint() }}</span>
        }
      </volt-card-content>
    </volt-card>
  `,
})
export class AppStatTile {
  readonly label = input<string>('');
  readonly value = input<string>('');
  readonly hint = input<string>('');
}
