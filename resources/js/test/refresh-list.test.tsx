import {
    QueryClient,
    QueryClientProvider,
    useQuery,
} from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useRefreshList } from '@/application/clinic/use-refresh-list';

describe('renovar as fotos de uma lista', () => {
    it('vários avatares vencidos ao mesmo tempo buscam a lista uma vez só', async () => {
        const queryFn = vi.fn(async () => [{ id: '1', photoUrl: 'x' }]);
        const client = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={client}>
                {children}
            </QueryClientProvider>
        );
        const { result } = renderHook(
            () => {
                useQuery({ queryKey: ['patients', { page: 1 }], queryFn });
                return useRefreshList('patients');
            },
            { wrapper },
        );
        await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));

        const answers = await Promise.all(
            Array.from({ length: 50 }, () => result.current()),
        );

        expect(queryFn).toHaveBeenCalledTimes(2);
        expect(answers.every((answer) => answer === null)).toBe(true);
    });
});
