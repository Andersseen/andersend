import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MoveStaggerDirective, MoveEnterDirective } from 'angular-movement';
import { AppNavIcon } from '../shared/nav-icon';
import { NAV_ITEMS } from './nav-items';

@Component({
  selector: 'app-nav-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, AppNavIcon, MoveStaggerDirective, MoveEnterDirective],
  template: `
    <nav class="flex flex-col gap-1" aria-label="Primary" [moveStagger]="60">
      @for (item of items; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="bg-muted text-foreground"
          [routerLinkActiveOptions]="{ exact: item.path === '/' }"
          moveEnter="fade-right"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="linkActivated.emit()"
        >
          <app-nav-icon [name]="item.icon" />
          {{ item.label }}
        </a>
      }
    </nav>
  `,
})
export class AppNavList {
  protected readonly items = NAV_ITEMS;
  readonly linkActivated = output<void>();
}
