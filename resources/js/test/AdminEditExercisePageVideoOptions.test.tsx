import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AdminEditExercisePage from '@/pages/admin/exercises/AdminEditExercisePage';
import { routerFutureFlags } from '@/test/browser-router';

const getById = vi.fn();
const getOptions = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    apiAdminExercisesRepository: {
        getById: (...args: unknown[]) => getById(...args),
        getOptions: (...args: unknown[]) => getOptions(...args),
    },
}));

vi.mock('@/components/admin/AdminLayout', () => ({
    AdminLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

afterEach(() => {
    vi.clearAllMocks();
});

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={['/admin/exercicios/42/editar']}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/admin/exercicios/:id/editar"
                        element={<AdminEditExercisePage />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('AdminEditExercisePage', () => {
    it('pede as opções com o id do exercício e mostra o vídeo da clínica já ligado', async () => {
        getById.mockResolvedValue({
            id: 42,
            name: 'Exercício enviado pela clínica',
            physio_area_id: 1,
            physio_subarea_id: null,
            body_region_id: 1,
            difficulty_level: 'medium',
            is_active: true,
            videos: [{ id: 7 }],
        });
        getOptions.mockImplementation((exerciseId?: number) =>
            Promise.resolve({
                physio_areas: [],
                body_regions: [],
                difficulties: {},
                movement_forms: {},
                videos:
                    exerciseId === 42
                        ? [{ id: 7, original_filename: 'da-clinica.mp4' }]
                        : [],
            }),
        );

        renderPage();

        expect(await screen.findByText('da-clinica.mp4')).toBeInTheDocument();
        await waitFor(() => expect(getOptions).toHaveBeenCalledWith(42));
    });
});
