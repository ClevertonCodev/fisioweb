import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useDashboardSummary,
    useOccupancyRate,
    usePatientAcquisition,
    useRecentActivities,
    useRefreshDashboard,
} from '@/application/clinic/use-dashboard';
import { dayKey } from '@/components/clinic/dashboard/dashboard-format';

const getSummary = vi.fn();
const getOccupancyRate = vi.fn();
const getPatientAcquisition = vi.fn();
const getActivities = vi.fn();

vi.mock('@/infrastructure/repositories', () => ({
    apiClinicDashboardRepository: {
        getSummary: (...args: unknown[]) => getSummary(...args),
        getOccupancyRate: (...args: unknown[]) => getOccupancyRate(...args),
        getPatientAcquisition: (...args: unknown[]) =>
            getPatientAcquisition(...args),
        getActivities: (...args: unknown[]) => getActivities(...args),
    },
}));

function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

function nextCalendarDay(date: Date): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useDashboardSummary', () => {
    it('pede o summary de novo quando o dia muda e não segura os dados de ontem', async () => {
        getSummary.mockResolvedValue({ origem: 'ontem' });
        const today = new Date();

        const { result, rerender } = renderHook(
            ({ day }: { day: string }) => useDashboardSummary('clinic', day),
            { wrapper, initialProps: { day: dayKey(today) } },
        );
        await waitFor(() =>
            expect(result.current.data).toEqual({ origem: 'ontem' }),
        );

        rerender({ day: dayKey(nextCalendarDay(today)) });

        expect(result.current.data).toBeUndefined();
        await waitFor(() => expect(getSummary).toHaveBeenCalledTimes(2));
        expect(getSummary).toHaveBeenLastCalledWith('clinic');
    });
});

describe('useRefreshDashboard', () => {
    it('pede de novo todos os blocos ativos ao atualizar', async () => {
        for (const fetcher of [
            getSummary,
            getOccupancyRate,
            getPatientAcquisition,
            getActivities,
        ]) {
            fetcher.mockResolvedValue({});
        }

        const { result } = renderHook(
            () => ({
                summary: useDashboardSummary('clinic', dayKey(new Date())),
                occupancy: useOccupancyRate('daily', '1'),
                acquisition: usePatientAcquisition('clinic'),
                activities: useRecentActivities(true),
                refresh: useRefreshDashboard(),
            }),
            { wrapper },
        );
        await waitFor(() => expect(getActivities).toHaveBeenCalledTimes(1));

        await act(() => result.current.refresh());

        expect(getSummary).toHaveBeenCalledTimes(2);
        expect(getOccupancyRate).toHaveBeenCalledTimes(2);
        expect(getPatientAcquisition).toHaveBeenCalledTimes(2);
        expect(getActivities).toHaveBeenCalledTimes(2);
    });

    it('não pede o feed de quem não pode ver atividades', async () => {
        getSummary.mockResolvedValue({});

        const { result } = renderHook(
            () => ({
                summary: useDashboardSummary('mine', dayKey(new Date())),
                activities: useRecentActivities(false),
                refresh: useRefreshDashboard(),
            }),
            { wrapper },
        );
        await waitFor(() => expect(getSummary).toHaveBeenCalledTimes(1));

        await act(() => result.current.refresh());

        expect(getSummary).toHaveBeenCalledTimes(2);
        expect(getActivities).not.toHaveBeenCalled();
    });
});
