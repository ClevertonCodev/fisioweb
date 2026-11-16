import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Clinic, LoginAsEntry } from '@/domain/admin';
import ClinicEditPage from '@/pages/admin/clinic/ClinicEditPage';
import { routerFutureFlags } from '@/test/browser-router';

const getById = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    apiClinicsRepository: {
        getById: (...args: unknown[]) => getById(...args),
        getPlansOptions: () => Promise.resolve([]),
    },
}));

vi.mock('@/components/admin/AdminLayout', () => ({
    AdminLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

beforeEach(() => {
    vi.stubEnv('TZ', 'America/Sao_Paulo');
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
});

function makeClinic(recentLoginAs: LoginAsEntry[]): Clinic {
    return {
        id: 12,
        name: 'Clínica Exemplo',
        document: '11222333000181',
        typePerson: 'PJ',
        status: 1,
        email: 'contato@clinica.test',
        phone: null,
        slug: 'clinica-exemplo',
        zipCode: null,
        address: null,
        number: null,
        city: null,
        state: null,
        planId: null,
        planName: null,
        createdAt: '2026-11-01T10:00:00Z',
        masterAccess: null,
        recentLoginAs,
    };
}

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={['/admin/clinicas/12/editar']}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/admin/clinicas/:id/editar"
                        element={<ClinicEditPage />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('ClinicEditPage › últimos acessos do suporte', () => {
    it('lista quem entrou como a clínica, como quem e quando', async () => {
        getById.mockResolvedValue(
            makeClinic([
                {
                    operatorName: 'Operadora Ana',
                    clinicUserName: 'Mestre da Clínica',
                    createdAt: '2026-11-08T13:45:00-03:00',
                },
                {
                    operatorName: 'Operador Bruno',
                    clinicUserName: null,
                    createdAt: '2026-11-07T09:05:00-03:00',
                },
            ]),
        );
        renderPage();

        const section = await screen.findByRole('region', {
            name: 'Últimos acessos do suporte',
        });
        const items = within(section).getAllByRole('listitem');
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent('Operadora Ana');
        expect(items[0]).toHaveTextContent('como Mestre da Clínica');
        expect(items[0]).toHaveTextContent('08/11/2026 às 13:45');
        expect(items[1]).toHaveTextContent('Operador Bruno');
        expect(items[1]).toHaveTextContent('como usuário removido');
        expect(items[1]).toHaveTextContent('07/11/2026 às 09:05');
    });

    it('avisa quando ninguém do suporte entrou', async () => {
        getById.mockResolvedValue(makeClinic([]));
        renderPage();

        const section = await screen.findByRole('region', {
            name: 'Últimos acessos do suporte',
        });
        expect(
            within(section).getByText('Nenhum acesso do suporte registrado.'),
        ).toBeInTheDocument();
        expect(within(section).queryAllByRole('listitem')).toHaveLength(0);
    });
});
