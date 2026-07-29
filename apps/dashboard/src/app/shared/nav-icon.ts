import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LmnCog6ToothIcon } from 'lumen-icons/cog-6-tooth';
import { LmnDocumentTextIcon } from 'lumen-icons/document-text';
import { LmnHomeIcon } from 'lumen-icons/home';
import { LmnInboxIcon } from 'lumen-icons/inbox';
import { LmnKeyIcon } from 'lumen-icons/key';
import type { NavIconName } from '../shell/nav-items';

@Component({
  selector: 'app-nav-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LmnHomeIcon, LmnInboxIcon, LmnDocumentTextIcon, LmnKeyIcon, LmnCog6ToothIcon],
  template: `
    @switch (name()) {
      @case ('home') {
        <lmn-home [size]="16" />
      }
      @case ('inbox') {
        <lmn-inbox [size]="16" />
      }
      @case ('document') {
        <lmn-document-text [size]="16" />
      }
      @case ('key') {
        <lmn-key [size]="16" />
      }
      @case ('cog') {
        <lmn-cog-6-tooth [size]="16" />
      }
    }
  `,
})
export class AppNavIcon {
  readonly name = input<NavIconName>('home');
}
