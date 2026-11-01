import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicFinanceOpeningBalanceRepository } from '@/infrastructure/repositories/api-clinic-finance-opening-balance';
import {
    apiClinicFinanceSummaryRepository,
    apiClinicFinanceTransactionsRepository,
} from '@/infrastructure/repositories/api-clinic-finance-transactions';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);
const mockPatch = vi.mocked(apiClient.patch);
const mockDelete = vi.mocked(apiClient.delete);

afterEach(() => {
    vi.clearAllMocks();
});

function makeApiTransaction(overrides = {}) {
    return {
        id: 9,
        date: '2026-10-15',
        description: 'Sessão',
        category: {
            id: 2,
            name: 'Sessões',
            type: 'entrada',
            origin: 'system',
            active: true,
            display_order: 1,
        },
        type: 'entrada',
        status: 'pendente',
        payment_method: 'pix',
        gross_amount: '100.00',
        fee_amount: '0.00',
        net_amount: '100.00',
        ...overrides,
    };
}

describe('apiClinicFinanceTransactionsRepository.list', () => {
    it('manda overdueUntil como overdue_until e lê o netTotal do meta', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: [makeApiTransaction()],
                meta: { page: 1, perPage: 25, total: 1, netTotal: '100.00' },
            },
        });

        const result = await apiClinicFinanceTransactionsRepository.list({
            overdueUntil: '2026-10-31',
            type: 'entrada',
        });

        const [url, config] = mockGet.mock.calls[0];
        expect(url).toBe('/clinic/finances/transactions');
        expect(config).toMatchObject({
            params: { overdue_until: '2026-10-31', type: 'entrada' },
        });
        expect(config?.params).not.toHaveProperty('overdueUntil');
        expect(result.meta).toEqual({
            page: 1,
            perPage: 25,
            total: 1,
            netTotal: 100,
        });
        expect(result.data[0]).toMatchObject({
            id: '9',
            paymentMethod: 'pix',
            netAmount: 100,
        });
    });
});

describe('apiClinicFinanceSummaryRepository.getSummary', () => {
    it('manda overdueUntil como overdue_until também nas somas', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    period: { year: 2026, month: 10 },
                    income: { received: 0, pending: 0 },
                    expense: { paid: 0, pending: 0 },
                    opening_balance: '10.00',
                    opening_balance_source: 'typed',
                    available: '10.00',
                    forecast: '10.00',
                },
            },
        });

        const summary = await apiClinicFinanceSummaryRepository.getSummary({
            overdueUntil: '2026-10-31',
        });

        const [url, config] = mockGet.mock.calls[0];
        expect(url).toBe('/clinic/finances/summary');
        expect(config).toMatchObject({
            params: { overdue_until: '2026-10-31' },
        });
        expect(summary.openingBalance).toBe(10);
        expect(summary.openingBalanceSource).toBe('typed');
    });
});

describe('apiClinicFinanceTransactionsRepository.setStatus', () => {
    it('faz PATCH em .../transactions/{id}/status só com o status', async () => {
        mockPatch.mockResolvedValueOnce({
            data: { data: makeApiTransaction({ status: 'recebido' }) },
        });

        const result = await apiClinicFinanceTransactionsRepository.setStatus(
            '9',
            'recebido',
        );

        expect(mockPatch).toHaveBeenCalledTimes(1);
        expect(mockPatch).toHaveBeenCalledWith(
            '/clinic/finances/transactions/9/status',
            { status: 'recebido' },
        );
        expect(result.status).toBe('recebido');
    });
});

describe('apiClinicFinanceOpeningBalanceRepository.clear', () => {
    it('faz DELETE em opening-balance com o período na query', async () => {
        mockDelete.mockResolvedValueOnce({ data: null });

        await apiClinicFinanceOpeningBalanceRepository.clear('2026-10');

        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(
            '/clinic/finances/opening-balance',
            { params: { period: '2026-10' } },
        );
    });
});
