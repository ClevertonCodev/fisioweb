import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PatientProgram } from '@/domain/patient/program';
import PatientExerciseDetailPage from '@/pages/patient/program/PatientExerciseDetailPage';
import PatientProgramListPage from '@/pages/patient/program/PatientProgramListPage';

const programsState = {
    data: undefined as PatientProgram[] | undefined,
    isLoading: false,
    isRefetching: false,
    isError: false,
    refetch: vi.fn(),
};

const programState = {
    data: undefined as PatientProgram | undefined,
    isLoading: false,
    isError: false,
};

vi.mock('@/application/patient/use-patient-program', () => ({
    usePatientPrograms: () => programsState,
    usePatientProgram: () => programState,
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: true,
        guard: 'patient',
        user: { name: 'Ana Silva' },
        isLoading: false,
        logout: vi.fn(),
    }),
}));

function program(overrides: Partial<PatientProgram> = {}): PatientProgram {
    return {
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
                        prescription: {},
                    },
                ],
            },
        ],
        outcomePainEnabled: false,
        outcomeDifficultyEnabled: false,
        outcomeSatisfactionEnabled: false,
        ...overrides,
    };
}

function renderAt(path: string, page: ReactNode) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/:clinicSlug/paciente/programas" element={page} />
                <Route
                    path="/:clinicSlug/paciente/programas/:publicToken/exercicios/:exerciseId"
                    element={page}
                />
            </Routes>
        </MemoryRouter>,
    );
}

describe('lista de programas do paciente', () => {
    beforeEach(() => {
        programsState.data = undefined;
        programsState.isLoading = false;
        programsState.isRefetching = false;
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('mostra o período na data civil, sem recuar um dia', () => {
        vi.stubEnv('TZ', 'America/Sao_Paulo');
        programsState.data = [program()];

        renderAt(
            '/clinica-teste/paciente/programas',
            <PatientProgramListPage />,
        );

        expect(screen.getByText('06/11/2026 a 06/12/2026')).toBeInTheDocument();
    });

    it('conta como ativo só o disponível e o disponível em breve', () => {
        programsState.data = [
            program({ publicToken: 'a', status: 'available' }),
            program({ publicToken: 'b', status: 'scheduled' }),
            program({ publicToken: 'c', status: 'completed' }),
            program({ publicToken: 'd', status: 'inactive' }),
            program({ publicToken: 'e', status: 'unavailable' }),
        ];

        renderAt(
            '/clinica-teste/paciente/programas',
            <PatientProgramListPage />,
        );

        expect(
            screen.getByText('2 programas ativos para você seguir em casa.'),
        ).toBeInTheDocument();
    });

    it('sem programa ativo, não conta os outros status', () => {
        programsState.data = [
            program({ publicToken: 'c', status: 'completed' }),
        ];

        renderAt(
            '/clinica-teste/paciente/programas',
            <PatientProgramListPage />,
        );

        expect(
            screen.getByText(
                'Acompanhe aqui os programas prescritos pelo seu profissional.',
            ),
        ).toBeInTheDocument();
    });

    it('lista vazia pede contato com o profissional', () => {
        programsState.data = [];

        renderAt(
            '/clinica-teste/paciente/programas',
            <PatientProgramListPage />,
        );

        expect(
            screen.getByText('Nenhum programa disponível'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Entre em contato com o profissional da saúde.'),
        ).toBeInTheDocument();
    });

    it('carregando, o hero e o miolo dizem que a lista está vindo', () => {
        programsState.isLoading = true;

        renderAt(
            '/clinica-teste/paciente/programas',
            <PatientProgramListPage />,
        );

        expect(screen.getByText('Carregando sua lista…')).toBeInTheDocument();
        expect(
            screen.getByText('Carregando programas. Aguarde…'),
        ).toBeInTheDocument();
    });

    it('enquanto atualiza, o botão não aceita outro toque', () => {
        programsState.isRefetching = true;
        programsState.data = [program()];

        renderAt(
            '/clinica-teste/paciente/programas',
            <PatientProgramListPage />,
        );

        expect(
            screen.getByRole('button', { name: 'Atualizar lista' }),
        ).toBeDisabled();
    });

    it('sem slug, o card fica desabilitado', () => {
        programsState.data = [program({ clinicSlug: undefined })];

        render(
            <MemoryRouter initialEntries={['/programas']}>
                <Routes>
                    <Route
                        path="/programas"
                        element={<PatientProgramListPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('button', { name: /Programa de Reabilitação/ }),
        ).toBeDisabled();
    });
});

describe('detalhe do exercício do paciente', () => {
    beforeEach(() => {
        programState.data = undefined;
        programState.isLoading = false;
        programState.isError = false;
    });

    it('sem dia e sem período, não desenha “Quando fazer” nem o dígito 0', () => {
        programState.data = program();

        renderAt(
            '/clinica-teste/paciente/programas/token-1/exercicios/ex-1',
            <PatientExerciseDetailPage />,
        );

        expect(screen.queryByText('Quando fazer')).not.toBeInTheDocument();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
        expect(screen.getByText('Vídeo indisponível')).toBeInTheDocument();
    });

    it('com uma série e nota, mostra o singular e tira o prefixo', () => {
        programState.data = program({
            groups: [
                {
                    id: 'g1',
                    name: 'Principal',
                    exercises: [
                        {
                            id: 'ex-1',
                            name: 'Agachamento',
                            notes: 'Descrição: Manter coluna reta',
                            days: ['seg'],
                            period: ['Manhã'],
                            videoUrl: 'https://example.com/video',
                            prescription: { seriesMin: 1 },
                        },
                    ],
                },
            ],
        });

        renderAt(
            '/clinica-teste/paciente/programas/token-1/exercicios/ex-1',
            <PatientExerciseDetailPage />,
        );

        expect(screen.getByText('série')).toBeInTheDocument();
        expect(screen.getByText('Quando fazer')).toBeInTheDocument();
        expect(screen.getByText('Manter coluna reta')).toBeInTheDocument();
        expect(screen.queryByText(/Descrição:/)).not.toBeInTheDocument();
        const frame = screen.getByTitle('Vídeo: Agachamento');
        expect(frame).toHaveAttribute('allowfullscreen');
    });

    it('carregando, diz que o exercício está vindo', () => {
        programState.isLoading = true;

        renderAt(
            '/clinica-teste/paciente/programas/token-1/exercicios/ex-1',
            <PatientExerciseDetailPage />,
        );

        expect(screen.getByText('Carregando exercício…')).toBeInTheDocument();
    });

    it('programa ausente, diz que o exercício não foi encontrado', () => {
        programState.isError = true;

        renderAt(
            '/clinica-teste/paciente/programas/token-1/exercicios/ex-1',
            <PatientExerciseDetailPage />,
        );

        expect(
            screen.getByText('Exercício não encontrado'),
        ).toBeInTheDocument();
    });

    it('exercício fora dos grupos, avisa que não está no programa', () => {
        programState.data = program();

        renderAt(
            '/clinica-teste/paciente/programas/token-1/exercicios/outro',
            <PatientExerciseDetailPage />,
        );

        expect(
            screen.getByText('Exercício não encontrado no programa'),
        ).toBeInTheDocument();
    });
});
