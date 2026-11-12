import {
    onlineManager,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useOpenPatientFile } from '@/application/clinic/use-patient-files';

const getUrl = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-patient-files', () => ({
    apiClinicPatientFilesRepository: {
        getUrl: (...args: unknown[]) => getUrl(...args),
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

describe('useOpenPatientFile', () => {
    const tab = {
        opener: {} as unknown,
        location: { href: '' },
        close: vi.fn(),
    };
    let open: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        getUrl.mockReset();
        tab.location.href = '';
        tab.close.mockReset();
        open = vi
            .spyOn(window, 'open')
            .mockReturnValue(tab as unknown as Window);
    });

    afterEach(() => {
        open.mockRestore();
        onlineManager.setOnline(true);
    });

    it('abre a aba ainda dentro do clique, antes de qualquer microtask', async () => {
        getUrl.mockResolvedValue({
            url: 'https://r2.invalid/arquivo.pdf',
            expiresAt: '2026-11-11T12:00:00Z',
        });
        const { result } = renderHook(() => useOpenPatientFile('7'), {
            wrapper,
        });

        act(() => {
            result.current.open('3');
            expect(open).toHaveBeenCalledTimes(1);
        });

        await waitFor(() =>
            expect(tab.location.href).toBe('https://r2.invalid/arquivo.pdf'),
        );
        expect(tab.opener).toBeNull();
        expect(getUrl).toHaveBeenCalledWith('7', '3');
    });

    it('fecha a aba aberta quando o link não vem', async () => {
        getUrl.mockRejectedValue(new Error('falhou'));
        const { result } = renderHook(() => useOpenPatientFile('7'), {
            wrapper,
        });

        act(() => {
            result.current.open('3');
        });

        await waitFor(() => expect(tab.close).toHaveBeenCalledTimes(1));
    });

    it('sem rede, o pedido não fica pausado: falha e fecha a aba aberta', async () => {
        onlineManager.setOnline(false);
        getUrl.mockRejectedValue(new Error('Network Error'));
        const { result } = renderHook(() => useOpenPatientFile('7'), {
            wrapper,
        });

        act(() => {
            result.current.open('3');
        });

        await waitFor(() => expect(tab.close).toHaveBeenCalledTimes(1));
        expect(getUrl).toHaveBeenCalledWith('7', '3');
    });
});
