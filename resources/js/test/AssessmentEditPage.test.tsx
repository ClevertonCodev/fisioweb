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
import AssessmentEditPage from '@/pages/clinic/patient/AssessmentEditPage';
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

const getDetailById = vi.fn();
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
        find: (...args: unknown[]) => find(...args),
        update: (...args: unknown[]) => update(...args),
        sign: (...args: unknown[]) => sign(...args),
        listByPatient: vi.fn(),
        listTemplates: vi.fn(),
        findTemplate: vi.fn(),
        create: vi.fn(),
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
                    {
                        id: 102,
                        label: 'Queixa principal (QP)',
                        fieldType: 'textarea',
                        required: false,
                        sortOrder: 2,
                        config: null,
                        options: [],
                    },
                ],
            },
        ],
    };
}

function draftAssessment(overrides: Partial<Assessment> = {}): Assessment {
    return {
        id: 104,
        patientId: 108,
        status: 'draft',
        signedAt: null,
        template: lombarTemplate(),
        answers: [],
        answerOptions: [],
        clinicUser: { id: 1, name: 'Cleverton' },
        ...overrides,
    };
}

function renderEdit(assessmentId = '104') {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[
                    `/clinica/pacientes/108/avaliacoes/${assessmentId}/editar`,
                ]}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/pacientes/:id/avaliacoes/:assessmentId/editar"
                        element={<AssessmentEditPage />}
                    />
                    <Route
                        path="/clinica/pacientes/:id"
                        element={<p>Prontuário</p>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    getDetailById.mockResolvedValue(patient());
    find.mockResolvedValue(draftAssessment());
    update.mockResolvedValue(draftAssessment());
    sign.mockResolvedValue(
        draftAssessment({
            status: 'signed',
            signedAt: '2026-10-23T12:00:00.000Z',
        }),
    );
});

describe('responder avaliação (Ficha e laudo C)', () => {
    it('mostra a Ficha e laudo, sem barra de protótipo e sem PDF', async () => {
        renderEdit();

        expect(
            await screen.findByRole('heading', {
                level: 1,
                name: 'Fisioterapia Musculoesquelética: Lombar',
            }),
        ).toBeInTheDocument();
        expect(screen.getByText('Avaliação #104')).toBeInTheDocument();
        expect(screen.getByText('Aguardando assinatura')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Salvar rascunho' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Assinar' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Baixar PDF' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Ver como rascunho' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Tela atual (v1)')).not.toBeInTheDocument();
        expect(screen.queryByText('Ficha e laudo')).not.toBeInTheDocument();
    });

    it('salvar rascunho chama o update com as respostas', async () => {
        const user = userEvent.setup();
        renderEdit();

        const field = await screen.findByRole('textbox', {
            name: 'Diagnóstico clínico',
        });
        await user.type(field, 'Lombalgia crônica');
        await user.click(
            screen.getByRole('button', { name: 'Salvar rascunho' }),
        );

        await waitFor(() => {
            expect(update).toHaveBeenCalledTimes(1);
        });
        expect(update).toHaveBeenCalledWith('104', {
            answers: [{ fieldId: 101, value: 'Lombalgia crônica' }],
            answerOptions: [],
        });
    });

    it('assinar chama o sign; depois a tela é só a folha e os campos não editam', async () => {
        const user = userEvent.setup();
        sign.mockImplementation(async () => {
            const signed = draftAssessment({
                status: 'signed',
                signedAt: '2026-10-23T12:00:00.000Z',
                answers: [
                    {
                        id: 1,
                        fieldId: 101,
                        value: 'Lombalgia crônica',
                    },
                ],
            });
            find.mockResolvedValue(signed);
            return signed;
        });
        renderEdit();

        const field = await screen.findByRole('textbox', {
            name: 'Diagnóstico clínico',
        });
        await user.type(field, 'Lombalgia crônica');
        await user.click(screen.getByRole('button', { name: 'Assinar' }));

        await waitFor(() => {
            expect(sign).toHaveBeenCalledWith('104');
        });
        expect(update).toHaveBeenCalled();
        expect(
            await screen.findByText(/Não dá mais para mudar/),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Salvar rascunho' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('textbox', { name: 'Diagnóstico clínico' }),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Lombalgia crônica')).toBeInTheDocument();
    });

    it('avaliação de outra clínica ou id inexistente mostra 404', async () => {
        find.mockRejectedValue(new Error('Not found'));
        renderEdit('999');

        expect(
            await screen.findByText('Avaliação não encontrada'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Ela pode ser de outra clínica ou ter sido excluída.',
            ),
        ).toBeInTheDocument();
        expect(update).not.toHaveBeenCalled();
        expect(sign).not.toHaveBeenCalled();
    });

    it('avaliação de outro paciente da mesma clínica mostra 404 e não o laudo', async () => {
        find.mockResolvedValue(draftAssessment({ patientId: 999 }));
        renderEdit();

        expect(
            await screen.findByText('Avaliação não encontrada'),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('article', { name: 'Laudo da avaliação' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText('Miss Orpha Schuster'),
        ).not.toBeInTheDocument();
        expect(update).not.toHaveBeenCalled();
        expect(sign).not.toHaveBeenCalled();
    });

    it('os arquivos desta rota não importam PrototypeSwitcher, PDF nem rascunho=', () => {
        const root = join(process.cwd(), 'resources/js/pages/clinic/patient');
        const files = [
            join(root, 'AssessmentEditPage.tsx'),
            join(root, 'assessment-form/AssessmentEditScreen.tsx'),
            join(root, 'assessment-form/shared.ts'),
            join(root, 'assessment-form/parts.tsx'),
        ];
        const source = files.map((f) => readFileSync(f, 'utf8')).join('\n');
        expect(source).not.toMatch('PrototypeSwitcher');
        expect(source).not.toMatch('assessment-answer-prototype');
        expect(source).not.toMatch('Baixar PDF');
        expect(source).not.toMatch('rascunho=');
        expect(source).not.toMatch('Ver como rascunho');
        expect(source).not.toMatch('apiClient');
        expect(source).not.toMatch('components/ui');
        expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
        expect(source).not.toMatch(/text-\[[0-9]+px\]/);
    });
});
