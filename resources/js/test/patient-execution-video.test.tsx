import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PatientProgram } from '@/domain/patient/program';
import { storageClient } from '@/infrastructure/api/storage-client';
import PatientProgramExecutionPage from '@/pages/patient/program/PatientProgramExecutionPage';

const program: PatientProgram = {
    publicToken: 'token-1',
    name: 'Programa de Reabilitação',
    professionalName: 'Dra. Ana',
    startDate: '2026-11-06',
    endDate: '2026-12-06',
    status: 'available',
    groups: [
        {
            id: 'g1',
            name: 'Principal',
            exercises: [
                {
                    id: 'ex-1',
                    name: 'Agachamento',
                    days: [],
                    period: [],
                    videoUrl:
                        'https://conta.example/videos/agachamento.mp4?assinatura=1',
                    prescription: { seriesMin: 3 },
                },
                {
                    id: 'ex-2',
                    name: 'Ponte',
                    days: [],
                    period: [],
                    videoUrl:
                        'https://conta.example/videos/ponte.mp4?assinatura=1',
                    prescription: { seriesMin: 3 },
                },
            ],
        },
    ],
    outcomePainEnabled: false,
    outcomeDifficultyEnabled: false,
    outcomeSatisfactionEnabled: false,
};

vi.mock('@/application/patient/use-patient-program', () => ({
    usePatientProgram: () => ({
        data: program,
        isLoading: false,
        isError: false,
    }),
    useRefreshPatientExercise: () => vi.fn(async () => null),
    useStartOrResumeExecution: () => ({
        mutateAsync: vi.fn(async () => ({ id: 1 })),
    }),
    useSaveProgramSeries: () => ({ mutateAsync: vi.fn() }),
    useCompleteProgram: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: false,
        guard: null,
        user: null,
        isLoading: false,
        logout: vi.fn(),
    }),
}));

const get = vi.spyOn(storageClient, 'get');

describe('execução do programa do paciente', () => {
    beforeEach(() => {
        get.mockReset();
        get.mockResolvedValue({
            status: 200,
            data: new Blob(['video']),
        } as Awaited<ReturnType<typeof storageClient.get>>);
        vi.stubGlobal('URL', {
            createObjectURL: vi.fn(() => `blob:video-${get.mock.calls.length}`),
            revokeObjectURL: vi.fn(),
        });
        HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
        HTMLMediaElement.prototype.pause = vi.fn();
        HTMLMediaElement.prototype.load = vi.fn();
    });

    it('ao avançar de exercício no meio do download, o play do exercício novo fica liberado e baixa o vídeo dele', async () => {
        get.mockImplementationOnce(
            () => new Promise(() => {}) as ReturnType<typeof storageClient.get>,
        );
        render(
            <MemoryRouter
                initialEntries={[
                    '/clinica-teste/paciente/programas/token-1/executar',
                ]}
            >
                <Routes>
                    <Route
                        path="/:clinicSlug/paciente/programas/:publicToken/executar"
                        element={<PatientProgramExecutionPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        await userEvent.click(
            screen.getByRole('button', { name: 'Reproduzir Agachamento' }),
        );
        expect(get).toHaveBeenCalledTimes(1);

        await userEvent.click(
            screen.getAllByRole('button', { name: /Exercício 2: Ponte/ })[0],
        );
        const playPonte = screen.getByRole('button', {
            name: 'Reproduzir Ponte',
        });
        expect(playPonte).toBeEnabled();
        await userEvent.click(playPonte);

        await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
        expect(get.mock.calls[1][0]).toBe(
            'https://conta.example/videos/ponte.mp4?assinatura=1',
        );
        await waitFor(() =>
            expect(screen.getByTitle('Ponte')).toHaveAttribute(
                'src',
                'blob:video-2',
            ),
        );
    });
});
