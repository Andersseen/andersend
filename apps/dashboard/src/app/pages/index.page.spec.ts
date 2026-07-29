import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import type { DashboardStats, HealthResponse } from '@andersseen/contracts';
import { render, screen, waitFor } from '@testing-library/angular';
import { provideMovement } from 'angular-movement';
import { describe, expect, it, vi } from 'vitest';
import { ApiClientService } from '../core/api-client.service';
import OverviewPage from './index.page';

const mockStats: DashboardStats = {
  totalEmails: 42,
  sentToday: 5,
  delivered: 38,
  failed: 4,
  deliveryRate: 90.5,
  activeTemplates: 3,
  recentActivity: [
    { date: '2026-01-01', sent: 4, delivered: 4, failed: 0 },
    { date: '2026-01-02', sent: 3, delivered: 3, failed: 0 },
    { date: '2026-01-03', sent: 5, delivered: 4, failed: 1 },
    { date: '2026-01-04', sent: 2, delivered: 2, failed: 0 },
    { date: '2026-01-05', sent: 6, delivered: 5, failed: 1 },
    { date: '2026-01-06', sent: 1, delivered: 1, failed: 0 },
    { date: '2026-01-07', sent: 5, delivered: 5, failed: 0 },
  ],
  recentEmails: [],
};

const mockHealth: HealthResponse = {
  name: 'andersend',
  status: 'ok',
  environment: 'local',
  provider: 'mock',
  timestamp: '2026-01-01T00:00:00.000Z',
  database: 'connected',
};

describe('OverviewPage', () => {
  it('renders dashboard statistics fetched from the API', async () => {
    const apiClientMock = {
      client: {
        stats: { get: vi.fn().mockResolvedValue(mockStats) },
        health: { get: vi.fn().mockResolvedValue(mockHealth) },
      },
    };

    const { fixture } = await render(OverviewPage, {
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideMovement(),
        { provide: ApiClientService, useValue: apiClientMock },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText('90.5%')).toBeInTheDocument();
    });

    expect(screen.getByText('Sent today')).toBeInTheDocument();
    expect(screen.getByText('Delivery rate')).toBeInTheDocument();
    expect(screen.getByText('Mock provider')).toBeInTheDocument();

    await fixture.whenStable();
  });

  it('shows an error state and allows retrying when the API call fails', async () => {
    const getStats = vi.fn().mockRejectedValueOnce(new Error('network error')).mockResolvedValue(mockStats);
    const apiClientMock = {
      client: {
        stats: { get: getStats },
        health: { get: vi.fn().mockResolvedValue(mockHealth) },
      },
    };

    const { fixture } = await render(OverviewPage, {
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideMovement(),
        { provide: ApiClientService, useValue: apiClientMock },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText(/Could not load dashboard statistics/i)).toBeInTheDocument();
    });

    expect(getStats).toHaveBeenCalledTimes(1);

    await fixture.whenStable();
  });
});
