import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSendQuestionnaire } from '@/application/clinic/use-patient-questionnaires';

const store = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        error: (...args: unknown[]) => toastError(...args),
    },
}));

vi.mock(
    '@/infrastructure/repositories/api-clinic-patient-questionnaires',
    () => ({
        apiClinicPatientQuestionnairesRepository: {
            store: (...args: unknown[]) => store(...args),
        },
    }),
);

function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
    });
    return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

const dto = {
    questionnaireTemplateId: 3,
    modality: 'remoto' as const,
    expiresAt: null,
};

describe('useSendQuestionnaire', () => {
    beforeEach(() => {
        store.mockReset();
        toastSuccess.mockReset();
        toastError.mockReset();
    });

    it('cria o envio sem dizer que o questionário foi enviado ao paciente', async () => {
        store.mockResolvedValue({ id: 9, shareUrl: 'https://x/q/abc' });
        const { result } = renderHook(() => useSendQuestionnaire('1'), {
            wrapper,
        });

        await act(async () => {
            await result.current.mutateAsync(dto);
        });

        expect(store).toHaveBeenCalledWith('1', dto);
        expect(toastSuccess).not.toHaveBeenCalled();
    });

    it('continua mostrando o erro quando criar o envio falha', async () => {
        store.mockRejectedValue({
            response: { data: { message: 'Modelo inativo' } },
        });
        const { result } = renderHook(() => useSendQuestionnaire('1'), {
            wrapper,
        });

        await act(async () => {
            await result.current.mutateAsync(dto).catch(() => undefined);
        });

        expect(toastError).toHaveBeenCalledWith('Modelo inativo');
    });
});
