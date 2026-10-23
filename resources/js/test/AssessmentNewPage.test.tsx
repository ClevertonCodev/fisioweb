import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

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
});

const getDetailById = vi.fn();
const listTemplates = vi.fn();
const findTemplate = vi.fn();
const createAssessment = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-patients', () => ({
    apiClinicPatientsRepository: {
        getDetailById: (...args: unknown[]) => getDetailById(...args),
    },
}));

vi.mock('@/infrastructure/repositories/api-clinic-assessments', () => ({
    apiClinicAssessmentsRepository: {
        listTemplates: (...args: unknown[]) => listTemplates(...args),
        findTemplate: (...args: unknown[]) => findTemplate(...args),
        create: (...args: unknown[]) => createAssessment(...args),
    },
}));

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 1, name: 'Cleverton', role: 'admin' } }),
}));

function makePatient(): PatientDetail {
    return {
        id: '108',
        name: 'QA Mobile',
        initial: 'Q',
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

function makeTemplate(): AssessmentTemplate {
    return {
        id: 2,
        name: 'Fisioterapia Musculoesquelética: Lombar',
        description: null,
        sections: [
            {
                id: 10,
                title: 'Dor',
                sortOrder: 1,
                fields: [
                    {
                        id: 21,
                        label: 'Intensidade',
                        fieldType: 'range',
                        required: true,
                        sortOrder: 1,
                        config: {
                            min: 0,
                            max: 10,
                            minLabel: 'Nada',
                            maxLabel: 'Máxima',
                        },
                        options: [],
                    },
                ],
            },
        ],
    };
}

function makeCreated(): Assessment {
    const template = makeTemplate();
    return {
        id: 99,
        status: 'draft',
        signedAt: null,
        template,
        answers: [],
        answerOptions: [],
        clinicUser: { id: 1, name: 'Cleverton' },
    };
}

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
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
                        element={<p>Editar avaliação</p>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    getDetailById.mockResolvedValue(makePatient());
    listTemplates.mockResolvedValue({
        data: [
            {
                id: 2,
                name: 'Fisioterapia Musculoesquelética: Lombar',
                description: null,
                fieldCount: 1,
            },
        ],
        total: 1,
        lastPage: 1,
    });
    findTemplate.mockResolvedValue(makeTemplate());
    createAssessment.mockResolvedValue(makeCreated());
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('nova avaliação (DS v2)', () => {
    it('os arquivos da página não importam PrototypeSwitcher nem a v1', () => {
        const root = join(process.cwd(), 'resources/js/pages/clinic/patient');
        const files = [
            join(root, 'AssessmentNewPage.tsx'),
            join(root, 'assessment-new/AssessmentNewScreen.tsx'),
            join(root, 'assessment-new/picker.ts'),
            join(root, 'assessment-new/parts.tsx'),
        ];
        const source = files.map((f) => readFileSync(f, 'utf8')).join('\n');
        expect(source).not.toMatch('PrototypeSwitcher');
        expect(source).not.toMatch('assessment-new-prototype');
        expect(source).not.toMatch('@/components/ui');
        expect(source).not.toMatch('Enviar link');
        expect(source).not.toMatch('Avaliações Vedius');
    });

    it('mostra a prévia do DS e Responder agora cria a avaliação', async () => {
        const user = userEvent.setup();
        renderPage();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Nova avaliação' }),
            ).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.getByText('Lombar')).toBeInTheDocument();
        });
        expect(screen.queryByText('Avaliações Vedius')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /enviar link/i }),
        ).not.toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Intensidade')).toBeInTheDocument();
        });

        await user.click(
            screen.getByRole('button', { name: 'Responder agora' }),
        );

        await waitFor(() => {
            expect(createAssessment).toHaveBeenCalledWith(
                '108',
                expect.objectContaining({ templateId: 2 }),
            );
        });
        expect(await screen.findByText('Editar avaliação')).toBeInTheDocument();
    });
});
