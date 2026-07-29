import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Template } from '@andersseen/contracts';
import { renderTemplate } from '@andersseen/email-core';
import {
  VoltButton,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltFormField,
  VoltHint,
  VoltInput,
  VoltLabel,
  VoltSkeleton,
  VoltTabs,
  VoltTabsContent,
  VoltTabsList,
  VoltTabsTrigger,
  VoltTextarea,
} from '@voltui/components';
import { LmnArrowLeftIcon } from 'lumen-icons/arrow-left';
import { ApiClientService } from '../../core/api-client.service';
import { ToastService } from '../../core/toast.service';
import { AppErrorState } from '../../shared/error-state';

@Component({
  selector: 'app-template-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    VoltButton,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltFormField,
    VoltLabel,
    VoltHint,
    VoltInput,
    VoltTextarea,
    VoltSkeleton,
    VoltTabs,
    VoltTabsList,
    VoltTabsTrigger,
    VoltTabsContent,
    AppErrorState,
    LmnArrowLeftIcon,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <a
        routerLink="/templates"
        class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <lmn-arrow-left [size]="16" />
        Back to templates
      </a>

      @if (error()) {
        <app-error-state [message]="error()!" (retry)="load()" />
      } @else if (loading()) {
        <volt-skeleton height="20rem" />
      } @else if (template()) {
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight">{{ name() }}</h1>
            <p class="text-sm text-muted-foreground">Slug: {{ template()!.slug }}</p>
          </div>
          <volt-button (click)="save()" [disabled]="saving()">
            {{ saving() ? 'Saving…' : 'Save changes' }}
          </volt-button>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <div class="flex flex-col gap-5">
            <volt-form-field>
              <volt-label htmlFor="name">Name</volt-label>
              <volt-input id="name" [value]="name()" (valueChange)="name.set($event)" />
            </volt-form-field>

            <volt-form-field>
              <volt-label htmlFor="subject">Subject</volt-label>
              <volt-input id="subject" [value]="subject()" (valueChange)="subject.set($event)" />
              <volt-hint>Supports {{ '{{variableName}}' }} placeholders.</volt-hint>
            </volt-form-field>

            <volt-form-field>
              <volt-label htmlFor="html">HTML body</volt-label>
              <volt-textarea id="html" [rows]="10" [value]="html()" (valueChange)="html.set($event)" />
            </volt-form-field>

            <volt-form-field>
              <volt-label htmlFor="text">Plain-text body</volt-label>
              <volt-textarea id="text" [rows]="6" [value]="text()" (valueChange)="text.set($event)" />
            </volt-form-field>

            @if (variableNames().length) {
              <volt-form-field>
                <volt-label>Example variables</volt-label>
                <div class="flex flex-col gap-3 rounded-lg border border-border p-3">
                  @for (name of variableNames(); track name) {
                    <div class="flex flex-col gap-1">
                      <label [attr.for]="'var-' + name" class="text-xs font-medium text-muted-foreground">{{
                        name
                      }}</label>
                      <volt-input
                        [id]="'var-' + name"
                        [value]="variableValues()[name] ?? ''"
                        (valueChange)="setVariable(name, $event)"
                      />
                    </div>
                  }
                </div>
                <volt-hint>Used to seed the Send email form and this preview.</volt-hint>
              </volt-form-field>
            }
          </div>

          <volt-card class="h-fit">
            <volt-card-header>
              <volt-card-title>Preview</volt-card-title>
              <volt-card-description>{{ preview().subject }}</volt-card-description>
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
                    [innerHTML]="preview().html"
                  ></div>
                </volt-tabs-content>
                <volt-tabs-content value="text">
                  <pre class="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm">{{
                    preview().text
                  }}</pre>
                </volt-tabs-content>
              </volt-tabs>
              @if (preview().missingVariables.length) {
                <p class="mt-3 text-xs text-warning">
                  Missing values for: {{ preview().missingVariables.join(', ') }}
                </p>
              }
            </volt-card-content>
          </volt-card>
        </div>
      }
    </div>
  `,
})
export default class TemplateDetailsPage {
  private readonly api = inject(ApiClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly template = signal<Template | null>(null);

  protected readonly name = signal('');
  protected readonly subject = signal('');
  protected readonly html = signal('');
  protected readonly text = signal('');
  protected readonly variableValues = signal<Record<string, string>>({});
  protected readonly variableNames = computed(() => Object.keys(this.variableValues()));

  protected readonly preview = computed(() =>
    renderTemplate(
      { subject: this.subject(), html: this.html(), text: this.text() },
      this.variableValues(),
    ),
  );

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const template = await this.api.client.templates.get(id);
      this.template.set(template);
      this.name.set(template.name);
      this.subject.set(template.subject);
      this.html.set(template.html);
      this.text.set(template.text);
      this.variableValues.set(
        Object.fromEntries(Object.entries(template.variables).map(([key, value]) => [key, String(value)])),
      );
    } catch {
      this.error.set('Could not load this template from the API.');
    } finally {
      this.loading.set(false);
    }
  }

  protected setVariable(name: string, value: string): void {
    this.variableValues.update((current) => ({ ...current, [name]: value }));
  }

  async save(): Promise<void> {
    const template = this.template();
    if (!template) return;

    this.saving.set(true);
    try {
      const updated = await this.api.client.templates.update(template.id, {
        name: this.name(),
        subject: this.subject(),
        html: this.html(),
        text: this.text(),
        variables: this.variableValues(),
      });
      this.template.set(updated);
      this.toast.success('Template saved.', 'Saved');
    } catch {
      this.toast.error('Failed to save the template.');
    } finally {
      this.saving.set(false);
    }
  }
}
