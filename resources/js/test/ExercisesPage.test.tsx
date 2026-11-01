import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Exercise } from '@/domain/clinic';
import ExercisesPage from '@/pages/clinic/ExercisesPage';
import { routerFutureFlags } from '@/test/browser-router';

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Test User', type: 'clinic', role: 'admin' },
        token: 'fake-token',
        login: vi.fn(),
        logout: vi.fn(),
        guard: 'clinic',
    }),
}));

const listPaginated = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        apiClinicExercisesRepository: {
            listPaginated: (...args: unknown[]) => listPaginated(...args),
            toggleFavorite: vi.fn(),
        },
    };
});

function makeExercise(id: string): Exercise {
    return {
        id,
        title: `Exercício ${id}`,
        description: '',
        specialty: 'Ortopedia',
        bodyArea: 'Membro Superior',
        bodyRegion: 'Ombro',
        objective: 'Mobilidade',
        difficulty: 'facil',
        muscleGroup: 'Deltoide',
        equipment: 'Nenhum',
        movementType: 'Ativo',
        movementPattern: 'Empurrar',
        movementForm: 'Livre',
        videoUrl: `https://example.test/${id}.mp4`,
        thumbnailUrl: `https://example.test/${id}.jpg`,
        isFavorite: false,
        reviewStatus: 'approved',
        isOwnSubmission: false,
        duration: 0,
        createdAt: '',
    };
}

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
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            observe() {}
            unobserve() {}
            disconnect() {}
        },
    );
    global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

beforeEach(() => {
    listPaginated.mockReset();
    listPaginated.mockResolvedValue({
        items: [makeExercise('1'), makeExercise('2')],
        currentPage: 1,
        lastPage: 1,
        perPage: 20,
        total: 2,
    });
});

describe('ExercisesPage', () => {
    it('mostra a biblioteca v2 sem as abas de Programas', async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter
                    initialEntries={['/clinica/exercicios']}
                    future={routerFutureFlags}
                >
                    <ExercisesPage />
                </MemoryRouter>
            </QueryClientProvider>,
        );

        expect(await screen.findByText('Exercício 1')).toBeInTheDocument();
        expect(
            screen.queryByRole('tab', { name: 'Histórico' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Criar programa' }),
        ).not.toBeInTheDocument();
    });
});
