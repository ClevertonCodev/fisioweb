import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
    MEUS_MODELOS_PATH,
    NOSSOS_MODELOS_PATH,
    ProgramsOriginProvider,
    programsTabFromPath,
    programsTabPath,
} from '@/pages/clinic/program/programs-shell/programs-tabs';
import { ProgramsPageShell } from '@/pages/clinic/program/programs-shell/ProgramsPageShell';
import { routerFutureFlags } from '@/test/browser-router';

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function PathSpy() {
    const location = useLocation();
    return (
        <div>
            caminho {location.pathname}
            {location.search}
        </div>
    );
}

function Shell() {
    return (
        <ProgramsOriginProvider>
            <ProgramsPageShell
                subtitle="teste"
                filters={<div />}
                chips={<div />}
            >
                <PathSpy />
            </ProgramsPageShell>
        </ProgramsOriginProvider>
    );
}

describe('programs-tabs', () => {
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

    it('deriva a aba pelo caminho', () => {
        expect(programsTabFromPath('/clinica/programas/historico')).toBe(
            'historico',
        );
        expect(programsTabFromPath('/clinica/programas/exercicios')).toBe(
            'exercicios',
        );
        expect(programsTabFromPath(MEUS_MODELOS_PATH)).toBe('programas');
        expect(programsTabPath('programas', MEUS_MODELOS_PATH)).toBe(
            MEUS_MODELOS_PATH,
        );
        expect(
            programsTabPath('programas', '/clinica/programas/historico'),
        ).toBe(NOSSOS_MODELOS_PATH);
        expect(
            programsTabPath(
                'programas',
                '/clinica/programas/historico',
                MEUS_MODELOS_PATH,
            ),
        ).toBe(MEUS_MODELOS_PATH);
    });

    it('volta para Meus modelos depois de ir ao Histórico', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter
                initialEntries={[MEUS_MODELOS_PATH]}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/programas/historico"
                        element={<Shell />}
                    />
                    <Route
                        path="/clinica/programas/exercicios"
                        element={<Shell />}
                    />
                    <Route
                        path="/clinica/programas/modelos"
                        element={<Shell />}
                    />
                    <Route
                        path="/clinica/programas/meus-modelos"
                        element={<Shell />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            screen.getByText(`caminho ${MEUS_MODELOS_PATH}`),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('tab', { name: 'Histórico' }));
        expect(
            screen.getByText('caminho /clinica/programas/historico'),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('tab', { name: 'Programas' }));
        expect(
            screen.getByText(`caminho ${MEUS_MODELOS_PATH}`),
        ).toBeInTheDocument();
    });

    it('volta ao Histórico com o recorte ?patientId= do prontuário', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter
                initialEntries={['/clinica/programas/historico?patientId=10']}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/programas/historico"
                        element={<Shell />}
                    />
                    <Route
                        path="/clinica/programas/exercicios"
                        element={<Shell />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        await user.click(screen.getByRole('tab', { name: 'Exercícios' }));
        expect(
            screen.getByText('caminho /clinica/programas/exercicios'),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('tab', { name: 'Histórico' }));
        expect(
            screen.getByText(
                'caminho /clinica/programas/historico?patientId=10',
            ),
        ).toBeInTheDocument();
    });
});
