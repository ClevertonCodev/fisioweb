import { render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as useClinicUsersHook from '@/application/clinic/use-clinic-users';
import * as useProgramsHook from '@/application/clinic/use-programs';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Program } from '@/domain/clinic';
import ProgramHistoryTab from '@/pages/clinic/program/ProgramHistoryTab';
import { TestBrowserRouter } from '@/test/browser-router';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...(actual as object),
        useNavigate: () => mockNavigate,
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

    global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

function baseProgram(overrides: Partial<Program> = {}): Program {
    return {
        id: '1',
        title: 'Programa base',
        patientId: '10',
        patientName: 'Paciente Base',
        patientPhotoUrl: null,
        professionalId: '1',
        professionalName: 'Profissional Base',
        professionalPhotoUrl: null,
        exerciseCount: 5,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        message: '',
        groups: [],
        status: 'active',
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('ProgramsAndExercisesPage — aba Histórico', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.spyOn(useClinicUsersHook, 'useClinicUsers').mockReturnValue({
            data: [],
            isLoading: false,
        } as ReturnType<typeof useClinicUsersHook.useClinicUsers>);

        vi.spyOn(useProgramsHook, 'useDuplicateClinicProgram').mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as any);

        vi.spyOn(
            useProgramsHook,
            'useConvertToModelClinicProgram',
        ).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as any);

        vi.spyOn(useProgramsHook, 'useDeleteClinicProgram').mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as any);

        vi.spyOn(useProgramsHook, 'useClinicPrograms').mockReturnValue({
            data: {
                items: [],
                total: 0,
                lastPage: 1,
                perPage: 10,
                currentPage: 1,
            },
        } as unknown as ReturnType<typeof useProgramsHook.useClinicPrograms>);
    });

    function renderPage() {
        return render(
            <TestBrowserRouter>
                <TooltipProvider>
                    <ProgramHistoryTab />
                </TooltipProvider>
            </TestBrowserRouter>,
        );
    }

    it('exibe badges de status conforme engajamento e status do plano', () => {
        vi.spyOn(useProgramsHook, 'useClinicPrograms').mockReturnValue({
            data: {
                items: [
                    baseProgram({
                        id: '1',
                        title: 'Ativo não visto',
                        status: 'active',
                        patientViewedAt: null,
                    }),
                    baseProgram({
                        id: '2',
                        title: 'Ativo visto',
                        status: 'active',
                        patientViewedAt: '2026-03-01T12:00:00Z',
                    }),
                    baseProgram({
                        id: '3',
                        title: 'Concluído',
                        status: 'completed',
                        patientCompletedCount: 6,
                        patientViewedAt: '2026-02-01T10:00:00Z',
                    }),
                    baseProgram({
                        id: '4',
                        title: 'Rascunho modelo',
                        status: 'draft',
                        patientId: null,
                        patientName: null,
                    }),
                ],
                total: 4,
                lastPage: 1,
                perPage: 10,
                currentPage: 1,
            },
        } as unknown as ReturnType<typeof useProgramsHook.useClinicPrograms>);

        renderPage();

        expect(screen.getAllByText('Não visualizado').length).toBeGreaterThan(
            0,
        );
        expect(screen.getAllByText('Visualizado').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Completou • 6x/).length).toBeGreaterThan(0);
        expect(screen.getAllByText('Rascunho').length).toBeGreaterThan(0);
    });

    it('exibe contagem de exercícios na tabela', () => {
        vi.spyOn(useProgramsHook, 'useClinicPrograms').mockReturnValue({
            data: {
                items: [
                    baseProgram({
                        id: '1',
                        title: 'Com exercícios',
                        exerciseCount: 12,
                    }),
                ],
                total: 1,
                lastPage: 1,
                perPage: 10,
                currentPage: 1,
            },
        } as unknown as ReturnType<typeof useProgramsHook.useClinicPrograms>);

        renderPage();

        expect(screen.getAllByText('12 exercícios').length).toBeGreaterThan(0);
    });
});
