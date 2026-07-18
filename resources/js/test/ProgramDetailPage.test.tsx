import { render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as useProgramsHook from '@/application/clinic/use-programs';
import type { Program } from '@/domain/clinic';
import ProgramDetailPage from '@/pages/clinic/program/ProgramDetailPage';
import { TestBrowserRouter } from '@/test/browser-router';

const mockNavigate = vi.fn();

let mockLoaderData: { program: Program | null; error: string | null } = {
    program: null,
    error: null,
};

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...(actual as object),
        useNavigate: () => mockNavigate,
        useLoaderData: () => mockLoaderData,
        useParams: () => ({ id: '1' }),
    };
});

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Test User', type: 'clinic' },
        token: 'fake-token',
        login: vi.fn(),
        logout: vi.fn(),
        guard: 'clinic',
    }),
}));

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

function makeProgram(overrides: Partial<Program> = {}): Program {
    return {
        id: '1',
        title: 'Mão e dedos – Osteoartrite',
        patientId: '10',
        patientName: 'Maria Rilva Bitu',
        patientPhotoUrl: null,
        patientPhone: null,
        patientEmail: null,
        shareUrl: null,
        professionalId: null,
        professionalName: 'Dr. Ricardo Silva',
        professionalPhotoUrl: null,
        exerciseCount: 2,
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        message: '',
        groups: [
            {
                id: 'g1',
                name: 'Novo grupo',
                exercises: [
                    {
                        id: 'e1',
                        exerciseId: '100',
                        title: 'Mobilização passiva do dedo em flexão',
                        thumbnailUrl: 'https://example.com/thumb1.jpg',
                        videoUrl: 'https://example.com/video1.mp4',
                        days: [1, 3, 5],
                        period: 'manha',
                        seriesMin: 3,
                        seriesMax: 3,
                        repetitionsMin: 10,
                        repetitionsMax: 10,
                        restTime: 15,
                        notes: null,
                        isConfigured: true,
                    },
                ],
            },
        ],
        status: 'active',
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: '2026-02-10T00:00:00Z',
        ...overrides,
    };
}

describe('ProgramDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLoaderData = { program: null, error: null };

        vi.spyOn(useProgramsHook, 'useClinicProgram').mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
        } as ReturnType<typeof useProgramsHook.useClinicProgram>);

        vi.spyOn(useProgramsHook, 'useDuplicateClinicProgram').mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useProgramsHook.useDuplicateClinicProgram
        >);

        vi.spyOn(useProgramsHook, 'useDeleteClinicProgram').mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useProgramsHook.useDeleteClinicProgram
        >);

        vi.spyOn(
            useProgramsHook,
            'useConvertToModelClinicProgram',
        ).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useProgramsHook.useConvertToModelClinicProgram
        >);
    });

    function renderPage() {
        return render(
            <TestBrowserRouter>
                <ProgramDetailPage />
            </TestBrowserRouter>,
        );
    }

    it('exibe mensagem de erro quando o loader falha', () => {
        mockLoaderData = {
            program: null,
            error: 'Programa não encontrado na API',
        };

        renderPage();

        expect(
            screen.getByText('Programa não encontrado na API'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /voltar/i }),
        ).toBeInTheDocument();
    });

    it('exibe mensagem quando programa é null e sem erro', () => {
        mockLoaderData = { program: null, error: null };

        renderPage();

        expect(
            screen.getByText('Programa não encontrado.'),
        ).toBeInTheDocument();
    });

    it('exibe título e dados do programa via loader', () => {
        const program = makeProgram();
        mockLoaderData = { program, error: null };

        renderPage();

        expect(
            screen.getByText('Mão e dedos – Osteoartrite'),
        ).toBeInTheDocument();
        expect(screen.getByText('Maria Rilva Bitu')).toBeInTheDocument();
        expect(
            screen.getByText('Dr. Ricardo Silva', { exact: false }),
        ).toBeInTheDocument();
        expect(screen.getByText('2 exercícios')).toBeInTheDocument();
    });

    it('exibe badge "Não visualizado" para programa ativo sem visualização', () => {
        mockLoaderData = {
            program: makeProgram({ status: 'active', patientViewedAt: null }),
            error: null,
        };

        renderPage();

        expect(screen.getByText('Não visualizado')).toBeInTheDocument();
    });

    it('exibe badge "Visualizado" para programa visto pelo paciente', () => {
        mockLoaderData = {
            program: makeProgram({
                status: 'active',
                patientViewedAt: '2026-03-01T10:00:00Z',
            }),
            error: null,
        };

        renderPage();

        expect(screen.getByText('Visualizado')).toBeInTheDocument();
    });

    it('exibe badge "Completou" com contagem para programa concluído', () => {
        mockLoaderData = {
            program: makeProgram({
                status: 'completed',
                patientCompletedCount: 5,
            }),
            error: null,
        };

        renderPage();

        expect(screen.getByText(/Completou • 5x/)).toBeInTheDocument();
    });

    it('exibe badge "Rascunho" para programa em rascunho', () => {
        mockLoaderData = {
            program: makeProgram({
                status: 'draft',
                patientId: null,
                patientName: null,
            }),
            error: null,
        };

        renderPage();

        expect(screen.getByText('Rascunho')).toBeInTheDocument();
    });

    it('exibe os grupos e exercícios do programa', () => {
        mockLoaderData = { program: makeProgram(), error: null };

        renderPage();

        expect(screen.getByText('Novo grupo')).toBeInTheDocument();
        expect(
            screen.getByText('Mobilização passiva do dedo em flexão'),
        ).toBeInTheDocument();
    });

    it('exibe a frequência formatada do exercício', () => {
        mockLoaderData = { program: makeProgram(), error: null };

        renderPage();

        // days: [1,3,5] = 3x/semana, period: manha = Manhã, series 3, reps 10, rest 15s
        expect(screen.getByText(/3x\/semana/)).toBeInTheDocument();
        expect(screen.getByText(/Manhã/)).toBeInTheDocument();
        expect(screen.getByText(/3 séries/)).toBeInTheDocument();
        expect(screen.getByText(/10 repetições/)).toBeInTheDocument();
        expect(screen.getByText(/descansar por 15s/)).toBeInTheDocument();
    });

    it('exibe "Válido até" quando endDate está presente', () => {
        mockLoaderData = {
            program: makeProgram({ endDate: '2026-12-31' }),
            error: null,
        };

        renderPage();

        expect(screen.getByText(/Válido até:/i)).toBeInTheDocument();
    });

    it('usa dados do hook quando disponíveis (atualização reativa)', () => {
        const loaderProgram = makeProgram({ title: 'Título via loader' });
        const hookProgram = makeProgram({
            title: 'Título via hook (atualizado)',
        });

        mockLoaderData = { program: loaderProgram, error: null };

        vi.spyOn(useProgramsHook, 'useClinicProgram').mockReturnValue({
            data: hookProgram,
            isPending: false,
            isError: false,
        } as ReturnType<typeof useProgramsHook.useClinicProgram>);

        renderPage();

        expect(
            screen.getByText('Título via hook (atualizado)'),
        ).toBeInTheDocument();
        expect(screen.queryByText('Título via loader')).not.toBeInTheDocument();
    });
});
