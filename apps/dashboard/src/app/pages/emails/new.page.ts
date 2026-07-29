import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { DEFAULT_FROM_ADDRESS, type Template } from '@andersseen/contracts';
import {
  VoltButton,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltError,
  VoltFormField,
  VoltHint,
  VoltInput,
  VoltLabel,
  VoltTabs,
  VoltTabsContent,
  VoltTabsList,
  VoltTabsTrigger,
  VoltTextarea,
} from '@voltui/components';
import { ApiClientService } from '../../core/api-client.service';
import { ToastService } from '../../core/toast.service';

function parseRecipients(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function sendFormValidator(control: AbstractControl): ValidationErrors | null {
  const templateSlug = control.get('templateSlug')?.value as string;
  if (templateSlug) return null;

  const subject = (control.get('subject')?.value as string) ?? '';
  const html = (control.get('html')?.value as string) ?? '';
  const text = (control.get('text')?.value as string) ?? '';

  if (!subject.trim()) return { contentRequired: true };
  if (!html.trim() && !text.trim()) return { contentRequired: true };
  return null;
}

@Component({
  selector: 'app-send-email-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    VoltButton,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltFormField,
    VoltLabel,
    VoltHint,
    VoltError,
    VoltInput,
    VoltTextarea,
    VoltTabs,
    VoltTabsList,
    VoltTabsTrigger,
    VoltTabsContent,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Send email</h1>
        <p class="text-sm text-muted-foreground">
          Send using a built-in template or write raw HTML/text content.
        </p>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-5" novalidate>
          <volt-form-field>
            <volt-label htmlFor="from">From</volt-label>
            <volt-input id="from" formControlName="from" autocomplete="off" />
            <volt-hint>Defaults to the Andersend sender identity.</volt-hint>
          </volt-form-field>

          <volt-form-field>
            <volt-label htmlFor="to">To</volt-label>
            <volt-textarea
              id="to"
              formControlName="to"
              [rows]="2"
              placeholder="user@example.com, another@example.com"
            />
            @if (isInvalid('to')) {
              <volt-error>At least one recipient is required.</volt-error>
            } @else {
              <volt-hint>Separate multiple recipients with a comma.</volt-hint>
            }
          </volt-form-field>

          <volt-form-field>
            <volt-label htmlFor="template">Template</volt-label>
            <select
              id="template"
              class="flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              (change)="selectTemplate($any($event.target).value)"
            >
              <option value="">No template (raw HTML/text)</option>
              @for (template of templates(); track template.id) {
                <option [value]="template.slug">{{ template.name }}</option>
              }
            </select>
          </volt-form-field>

          @if (selectedTemplate(); as template) {
            <volt-form-field>
              <volt-label>Variables</volt-label>
              <div class="flex flex-col gap-3 rounded-lg border border-border p-3">
                @for (name of variableNames(); track name) {
                  <div class="flex flex-col gap-1">
                    <label
                      [attr.for]="'var-' + name"
                      class="text-xs font-medium text-muted-foreground"
                      >{{ name }}</label
                    >
                    <volt-input [id]="'var-' + name" [formControl]="variableControl(name)" />
                  </div>
                }
              </div>
              <volt-hint>Values default to the template's example variables.</volt-hint>
            </volt-form-field>
          } @else {
            <volt-form-field>
              <volt-label htmlFor="subject">Subject</volt-label>
              <volt-input id="subject" formControlName="subject" />
            </volt-form-field>

            <volt-form-field>
              <volt-label htmlFor="html">HTML body</volt-label>
              <volt-textarea id="html" formControlName="html" [rows]="6" />
            </volt-form-field>

            <volt-form-field>
              <volt-label htmlFor="text">Plain-text body</volt-label>
              <volt-textarea id="text" formControlName="text" [rows]="4" />
            </volt-form-field>

            @if (form.errors?.['contentRequired'] && form.touched) {
              <p class="text-sm font-medium text-destructive" role="alert">
                Provide a subject and HTML or plain-text content, or choose a template.
              </p>
            }
          }

          <volt-button type="submit" [disabled]="sending()">
            {{ sending() ? 'Sending…' : 'Send email' }}
          </volt-button>
        </form>

        <volt-card class="h-fit">
          <volt-card-header>
            <volt-card-title>Preview</volt-card-title>
            <volt-card-description>{{ previewSubject() || 'Subject preview' }}</volt-card-description>
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
                  [innerHTML]="previewHtml()"
                ></div>
              </volt-tabs-content>
              <volt-tabs-content value="text">
                <pre
                  class="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm"
                  >{{ previewText() }}</pre
                >
              </volt-tabs-content>
            </volt-tabs>
          </volt-card-content>
        </volt-card>
      </div>
    </div>
  `,
})
export default class SendEmailPage {
  private readonly api = inject(ApiClientService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly templates = signal<Template[]>([]);
  protected readonly selectedTemplate = signal<Template | null>(null);
  protected readonly variableNames = signal<string[]>([]);
  protected readonly sending = signal(false);

  protected readonly previewSubject = signal('');
  protected readonly previewHtml = signal('');
  protected readonly previewText = signal('');

  protected readonly form = new FormGroup(
    {
      from: new FormControl(DEFAULT_FROM_ADDRESS, { nonNullable: true }),
      to: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      templateSlug: new FormControl('', { nonNullable: true }),
      subject: new FormControl('', { nonNullable: true }),
      html: new FormControl('', { nonNullable: true }),
      text: new FormControl('', { nonNullable: true }),
    },
    { validators: sendFormValidator },
  );

  private variablesGroup = new FormGroup<Record<string, FormControl<string>>>({});

  constructor() {
    void this.loadTemplates();

    effect(() => {
      const template = this.selectedTemplate();
      if (template) {
        this.previewFromTemplate();
      } else {
        this.previewSubject.set(this.form.controls.subject.value);
        this.previewHtml.set(this.form.controls.html.value);
        this.previewText.set(this.form.controls.text.value);
      }
    });

    this.form.valueChanges.subscribe(() => {
      if (!this.selectedTemplate()) {
        this.previewSubject.set(this.form.controls.subject.value);
        this.previewHtml.set(this.form.controls.html.value);
        this.previewText.set(this.form.controls.text.value);
      }
    });
  }

  private async loadTemplates(): Promise<void> {
    try {
      this.templates.set(await this.api.client.templates.list());
    } catch {
      this.toast.error('Could not load templates from the API.');
    }
  }

  protected selectTemplate(slug: string): void {
    this.form.controls.templateSlug.setValue(slug);
    const template = this.templates().find((item) => item.slug === slug) ?? null;
    this.selectedTemplate.set(template);

    this.variablesGroup = new FormGroup<Record<string, FormControl<string>>>({});
    if (template) {
      const names = Object.keys(template.variables);
      this.variableNames.set(names);
      for (const name of names) {
        this.variablesGroup.addControl(
          name,
          new FormControl(String(template.variables[name] ?? ''), { nonNullable: true }),
        );
      }
      this.variablesGroup.valueChanges.subscribe(() => this.previewFromTemplate());
      this.previewFromTemplate();
    } else {
      this.variableNames.set([]);
    }
  }

  protected variableControl(name: string): FormControl<string> {
    // `name` always comes from `variableNames()`, which is derived from
    // these same `variablesGroup.controls` keys, so the control always exists.
    return this.variablesGroup.controls[name]!;
  }

  private async previewFromTemplate(): Promise<void> {
    const template = this.selectedTemplate();
    if (!template) return;

    try {
      const rendered = await this.api.client.templates.preview(template.id, this.variablesGroup.value as Record<string, string>);
      this.previewSubject.set(rendered.subject);
      this.previewHtml.set(rendered.html);
      this.previewText.set(rendered.text);
    } catch {
      // Preview is best-effort; leave the last successful render in place.
    }
  }

  protected isInvalid(name: 'to'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.sending.set(true);
    try {
      const value = this.form.getRawValue();
      const template = this.selectedTemplate();

      const response = await this.api.client.emails.send({
        from: value.from || undefined,
        to: parseRecipients(value.to),
        template: template?.slug,
        variables: template ? (this.variablesGroup.value as Record<string, string>) : undefined,
        subject: template ? undefined : value.subject,
        html: template ? undefined : value.html,
        text: template ? undefined : value.text,
      });

      this.toast.success(`Email queued (${response.status}).`, 'Sent');
      await this.router.navigate(['/emails', response.id]);
    } catch {
      this.toast.error('Failed to send the email. Check the form and try again.');
    } finally {
      this.sending.set(false);
    }
  }
}
