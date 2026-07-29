import { provideZonelessChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiClientService } from '../../core/api-client.service';
import SendEmailPage from './new.page';

function createApiClientMock() {
  return {
    client: {
      templates: { list: vi.fn().mockResolvedValue([]) },
      emails: { send: vi.fn().mockResolvedValue({ id: 'email_123', status: 'queued' }) },
    },
  };
}

describe('SendEmailPage', () => {
  it('shows accessible validation errors and does not call the API when required fields are missing', async () => {
    const apiClientMock = createApiClientMock();
    const user = userEvent.setup();

    await render(SendEmailPage, {
      providers: [
        provideZonelessChangeDetection(),
        { provide: ApiClientService, useValue: apiClientMock },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
      ],
    });

    const submitButton = await screen.findByRole('button', { name: /send email/i });
    await user.click(submitButton);

    expect(await screen.findByText(/at least one recipient is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/provide a subject and html or plain-text content/i),
    ).toBeInTheDocument();
    expect(apiClientMock.client.emails.send).not.toHaveBeenCalled();
  });

  it('sends the email and navigates to the details page on successful submission', async () => {
    const apiClientMock = createApiClientMock();
    const navigate = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    await render(SendEmailPage, {
      providers: [
        provideZonelessChangeDetection(),
        { provide: ApiClientService, useValue: apiClientMock },
        { provide: Router, useValue: { navigate } },
      ],
    });

    await user.type(await screen.findByLabelText(/to/i), 'user@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Hello there');
    await user.type(screen.getByLabelText(/html body/i), '<p>Hi</p>');
    await user.click(screen.getByRole('button', { name: /send email/i }));

    await waitFor(() => {
      expect(apiClientMock.client.emails.send).toHaveBeenCalledTimes(1);
    });

    expect(apiClientMock.client.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['user@example.com'],
        subject: 'Hello there',
        html: '<p>Hi</p>',
      }),
    );
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(['/emails', 'email_123']);
    });
  });
});
