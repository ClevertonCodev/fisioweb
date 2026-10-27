import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Assessment, AssessmentTemplate } from '@/domain/clinic';
import type { PatientDetail } from '@/domain/clinic/patient';
import AssessmentNewPage from '@/pages/clinic/patient/AssessmentNewPage';
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
    Element.prototype.scrollIntoView = vi.fn();
});

const getDetailById = vi.fn();
const listTemplates = vi.fn();
const findTemplate = vi.fn();
const create = vi.fn();
const find = vi.fn();
const update = vi.fn();
const sign = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-patients', () => ({
    apiClinicPatientsRepository: {
        getDetailById: (...args: unknown[]) => getDetailById(...args),
    },
}));

vi.mock('@/infrastructure/repositories/api-clinic-assessments', () => ({
    apiClinicAssessmentsRepository: {
        listTemplates: (...args: unknown[]) => listTemplates(...args),
        findTemplate: (...args: unknown[]) => findTemplate(...args),
        create: (...args: unknown[]) => create(...args),
        find: (...args: unknown[]) => find(...args),
        update: (...args: unknown[]) => update(...args),
        sign: (...args: unknown[]) => sign(...args),
        listByPatient: vi.fn(),
        destroy: vi.fn(),
    },
}));

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function patient(): PatientDetail {
    return {
        id: '108',
        name: 'Miss Orpha Schuster',
        initial: 'O',
        professional: 'Cleverton',
        professionalInitial: 'C',
        status: 'em_tratamento',
        diagnosis: 'Lombalgia',
        isActive: true,
        apelido: undefined,
        useApelido: false,
        isForeign: false,
        birthDate: '1995-03-15',
        phone: '84977776666',
        insurance: 'Amil',
    };
}

function lombarTemplate(): AssessmentTemplate {
    return {
        id: 1,
        name: 'Fisioterapia Musculoesquelética: Lombar',
        description: null,
        sections: [
            {
                id: 10,
                title: 'História Clínica',
                sortOrder: 1,
                fields: [
                    {
                        id: 101,
                        label: 'Diagnóstico clínico',
                        fieldType: 'textarea',
                        required: true,
                        sortOrder: 1,
                        config: null,
                        options: [],
                    },
                ],
            },
            {
                id: 11,
                title: 'Sinais Vitais',
                sortOrder: 2,
                fields: [
                    {
                        id: 102,
                        label: 'Frequência cardíaca (FC)',
                        fieldType: 'number',
                        required: false,
                        sortOrder: 2,
                        config: { unit: 'bpm' },
                        options: [],
                    },
                ],
            },
        ],
    };
}

function createdAssessment(): Assessment {
    return {
        id: 104,
        patientId: 108,
        status: 'draft',
        signedAt: null,
        template: lombarTemplate(),
        answers: [],
        answerOptions: [],
        clinicUser: { id: 1, name: 'Cleverton' },
    };
}

function renderNew() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={['/clinica/pacientes/108/avaliacoes/nova']}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/pacientes/:id/avaliacoes/nova"
                        element={<AssessmentNewPage />}
                    />
                    <Route
                        path="/clinica/pacientes/:id/avaliacoes/:assessmentId/editar"
                        element={<p>Ficha da avaliação</p>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    getDetailById.mockResolvedValue(patient());
    listTemplates.mockResolvedValue({
        data: [
            {
                id: 1,
                name: 'Fisioterapia Musculoesquelética: Lombar',
                description: null,
                fieldCount: 23,
            },
            {
                id: 2,
                name: 'Fisioterapia Neurológica',
                description: null,
                fieldCount: 32,
            },
        ],
        total: 2,
        lastPage: 1,
    });
    findTemplate.mockResolvedValue(lombarTemplate());
    create.mockResolvedValue(createdAssessment());
});

describe('nova avaliação (Prévia B)', () => {
    it('mostra a Prévia, sem Enviar link e sem barra de protótipo', async () => {
        const user = userEvent.setup();
        renderNew();

        expect(
            await screen.findByRole('heading', { name: 'Nova avaliação' }),
        ).toBeInTheDocument();
        await user.click(await screen.findByRole('button', { name: /Lombar/ }));

        expect(
            await screen.findByRole('heading', {
                name: 'Fisioterapia Musculoesquelética: Lombar',
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Indicada pelo diagnóstico'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Responder agora' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Enviar link' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Tela atual (v1)')).not.toBeInTheDocument();
        expect(
            screen.queryByText('Prévia para experimentar'),
        ).not.toBeInTheDocument();
    });

    it('mexer na prévia não cria a avaliação', async () => {
        const user = userEvent.setup();
        renderNew();

        await user.click(await screen.findByRole('button', { name: /Lombar/ }));
        const field = await screen.findByRole('textbox', {
            name: 'Diagnóstico clínico',
        });
        await user.type(field, 'Lombalgia crônica');
        await waitFor(() => {
            expect(field).toHaveValue('Lombalgia crônica');
        });
        expect(create).not.toHaveBeenCalled();
    });

    it('Responder agora cria a avaliação vazia e abre a ficha deste paciente', async () => {
        const user = userEvent.setup();
        renderNew();

        await user.click(await screen.findByRole('button', { name: /Lombar/ }));
        await screen.findByRole('textbox', { name: 'Diagnóstico clínico' });
        await user.click(
            screen.getByRole('button', { name: 'Responder agora' }),
        );

        expect(
            await screen.findByText('Ficha da avaliação'),
        ).toBeInTheDocument();
        expect(create).toHaveBeenCalledTimes(1);
        expect(create).toHaveBeenCalledWith('108', {
            templateId: 1,
            answers: [],
            answerOptions: [],
        });
    });

    it('os arquivos desta rota não importam PrototypeSwitcher, Enviar link nem a v1', () => {
        const root = join(process.cwd(), 'resources/js/pages/clinic/patient');
        const files = [
            join(root, 'AssessmentNewPage.tsx'),
            join(root, 'assessment-new/AssessmentNewScreen.tsx'),
            join(root, 'assessment-new/shared.ts'),
            join(root, 'assessment-new/parts.tsx'),
        ];
        const source = files.map((f) => readFileSync(f, 'utf8')).join('\n');
        expect(source).not.toMatch('PrototypeSwitcher');
        expect(source).not.toMatch('assessment-new-prototype');
        expect(source).not.toMatch('Enviar link');
        expect(source).not.toMatch('sendLink');
        expect(source).not.toMatch('apiClient');
        expect(source).not.toMatch('components/ui');
    });
});
