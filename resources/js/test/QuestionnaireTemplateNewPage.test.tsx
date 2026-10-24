import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import QuestionnaireTemplateNewPage from '@/pages/clinic/questionnaire-template/QuestionnaireTemplateNewPage';
import { routerFutureFlags } from '@/test/browser-router';

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

const create = vi.fn();

vi.mock(
    '@/infrastructure/repositories/api-clinic-questionnaire-templates',
    () => ({
        apiClinicQuestionnaireTemplatesRepository: {
            list: vi.fn(),
            findById: vi.fn(),
            create: (...args: unknown[]) => create(...args),
            update: vi.fn(),
            destroy: vi.fn(),
        },
    }),
);

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function LocationProbe() {
    const { pathname, search } = useLocation();
    return (
        <span role="status" aria-label="url atual" hidden>
            {pathname}
            {search}
        </span>
    );
}

function renderNew(returnTo?: string) {
    const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[`/clinica/questionarios/novo${query}`]}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/questionarios/novo"
                        element={<QuestionnaireTemplateNewPage />}
                    />
                    <Route
                        path="/clinica/pacientes/:id"
                        element={
                            <>
                                <p>Prontuário</p>
                                <LocationProbe />
                            </>
                        }
                    />
                    <Route
                        path="/clinica/pacientes"
                        element={
                            <>
                                <p>Lista de pacientes</p>
                                <LocationProbe />
                            </>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    create.mockResolvedValue({
        id: 9,
        clinicId: 1,
        title: 'Dor lombar',
        description: null,
        isActive: true,
        sections: [],
    });
});

describe('novo questionário (Banco de perguntas v2)', () => {
    it('mostra o banco e salva na API, voltando ao returnTo', async () => {
        const user = userEvent.setup();
        renderNew('/clinica/pacientes/36');

        expect(
            screen.getByRole('heading', { name: 'Novo questionário' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Banco de perguntas')).toBeInTheDocument();
        expect(screen.queryByText('Tela atual (v1)')).not.toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: /O que piora a dor/ }),
        );
        await user.type(screen.getByLabelText('Título'), 'Check-in de dor');
        await user.type(
            screen.getByLabelText('Descrição'),
            'Aplicar antes da consulta',
        );
        await user.click(
            screen.getByRole('button', { name: 'Salvar questionário' }),
        );

        await waitFor(() => {
            expect(create).toHaveBeenCalled();
        });
        const dto = create.mock.calls[0]?.[0] as {
            title: string;
            description: string | null;
            sections: { questions: { label: string }[] }[];
        };
        expect(dto.title).toBe('Check-in de dor');
        expect(dto.description).toBe('Aplicar antes da consulta');
        expect(dto.sections[0]?.questions[0]?.label).toBe('O que piora a dor?');

        expect(await screen.findByText('Prontuário')).toBeInTheDocument();
        expect(
            screen.getByLabelText('url atual', { selector: '[hidden]' }),
        ).toHaveTextContent('/clinica/pacientes/36');
    });

    it('bloqueia salvar sem título e perguntas', async () => {
        const user = userEvent.setup();
        renderNew('/clinica/pacientes/36');

        await user.click(
            screen.getByRole('button', { name: 'Salvar questionário' }),
        );

        expect(create).not.toHaveBeenCalled();
        expect(
            screen.getByText('Dê um título ao questionário.'),
        ).toBeInTheDocument();
    });

    it('sem returnTo volta para a lista de pacientes após salvar', async () => {
        const user = userEvent.setup();
        renderNew();

        await user.click(
            screen.getByRole('button', { name: /De 0 a 10, quanto dói/ }),
        );
        await user.type(screen.getByLabelText('Título'), 'Escala rápida');
        await user.click(
            screen.getByRole('button', { name: 'Salvar questionário' }),
        );

        await waitFor(() => {
            expect(create).toHaveBeenCalled();
        });
        expect(
            await screen.findByText('Lista de pacientes'),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText('url atual', { selector: '[hidden]' }),
        ).toHaveTextContent('/clinica/pacientes');
    });

    it('não importa PrototypeSwitcher nem questionnaire-new-prototype', () => {
        const root = join(
            process.cwd(),
            'resources/js/pages/clinic/questionnaire-template',
        );
        const source = [
            join(root, 'QuestionnaireTemplateNewPage.tsx'),
            join(root, 'questionnaire-template-new/QuestionnaireNewScreen.tsx'),
            join(root, 'questionnaire-template-new/shared.ts'),
            join(root, 'questionnaire-template-new/parts.tsx'),
        ]
            .map((f) => readFileSync(f, 'utf8'))
            .join('\n');
        expect(source).not.toMatch('PrototypeSwitcher');
        expect(source).not.toMatch('questionnaire-new-prototype');
        expect(source).not.toMatch('Protótipo:');
        expect(source).not.toMatch('components/ui');
    });
});
