import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useOpenFinanceAttachment } from '@/application/clinic/use-finance-attachments';

const signedUrl = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-finance-attachments', () => ({
    apiClinicFinanceAttachmentsRepository: {
        signedUrl: (...args: unknown[]) => signedUrl(...args),
    },
}));

function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
    });
    return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

describe('useOpenFinanceAttachment', () => {
    const tab = {
        opener: {} as unknown,
        location: { href: '' },
        close: vi.fn(),
    };
    let open: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        signedUrl.mockReset();
        tab.location.href = '';
        tab.close.mockReset();
        open = vi
            .spyOn(window, 'open')
            .mockReturnValue(tab as unknown as Window);
    });

    afterEach(() => {
        open.mockRestore();
    });

    it('abre a aba ainda dentro do clique e leva ao link assinado', async () => {
        signedUrl.mockResolvedValue({
            url: 'https://r2.invalid/comprovante.pdf',
            expiresAt: '2026-11-11T12:00:00Z',
        });
        const { result } = renderHook(() => useOpenFinanceAttachment('9'), {
            wrapper,
        });

        act(() => {
            result.current.open('4');
            expect(open).toHaveBeenCalledTimes(1);
        });

        await waitFor(() =>
            expect(tab.location.href).toBe(
                'https://r2.invalid/comprovante.pdf',
            ),
        );
        expect(tab.opener).toBeNull();
        expect(signedUrl).toHaveBeenCalledWith('9', '4');
    });
});
