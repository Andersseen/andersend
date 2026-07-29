import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { AppStatusBadge } from './status-badge';

const providers = [provideZonelessChangeDetection()];

describe('AppStatusBadge', () => {
  it('renders the human-readable label for a status', async () => {
    await render(AppStatusBadge, { inputs: { status: 'delivered' }, providers });
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('applies success styling for delivered emails', async () => {
    const { container } = await render(AppStatusBadge, { inputs: { status: 'delivered' }, providers });
    expect(container.querySelector('span')).toHaveClass('text-success');
  });

  it('applies destructive styling for failed emails', async () => {
    const { container } = await render(AppStatusBadge, { inputs: { status: 'failed' }, providers });
    expect(container.querySelector('span')).toHaveClass('text-destructive');
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('applies muted styling for queued emails', async () => {
    const { container } = await render(AppStatusBadge, { inputs: { status: 'queued' }, providers });
    expect(container.querySelector('span')).toHaveClass('text-muted-foreground');
    expect(screen.getByText('Queued')).toBeInTheDocument();
  });
});
