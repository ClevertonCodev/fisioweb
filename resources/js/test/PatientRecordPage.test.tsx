import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from 'react-router-dom';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type { Appointment, PatientEvolution, Program } from '@/domain/clinic';
import type { AssessmentSummary } from '@/domain/clinic/assessment';
import type { PatientDetail } from '@/domain/clinic/patient';
import type { PatientFile } from '@/domain/clinic/patient-file';
import type {
    PatientQuestionnaire,
    PatientQuestionnaireDetail,
} from '@/domain/clinic/patient-questionnaire';
import PatientRecordPage from '@/pages/clinic/patient/PatientRecordPage';
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
const listEvolutions = vi.fn();
const listAssessments = vi.fn();
const listQuestionnaires = vi.fn();
const findQuestionnaire = vi.fn();
const listFiles = vi.fn();
const listAppointments = vi.fn();
const listPrograms = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-patients', () => ({
    apiClinicPatientsRepository: {
        getDetailById: (...args: unknown[]) => getDetailById(...args),
    },
}));

vi.mock('@/infrastructure/repositories/api-clinic-evolutions', () => ({
    apiClinicEvolutionsRepository: {
        listByPatient: (...args: unknown[]) => listEvolutions(...args),
    },
}));

vi.mock('@/infrastructure/repositories/api-clinic-assessments', () => ({
    apiClinicAssessmentsRepository: {
        listByPatient: (...args: unknown[]) => listAssessments(...args),
    },
}));

vi.mock(
    '@/infrastructure/repositories/api-clinic-patient-questionnaires',
    () => ({
        apiClinicPatientQuestionnairesRepository: {
            listByPatient: (...args: unknown[]) => listQuestionnaires(...args),
            findById: (...args: unknown[]) => findQuestionnaire(...args),
        },
    }),
);

vi.mock('@/infrastructure/repositories/api-clinic-patient-files', () => ({
    apiClinicPatientFilesRepository: {
        listByPatient: (...args: unknown[]) => listFiles(...args),
    },
}));

vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@/infrastructure/repositories')>();
    return {
        ...actual,
        apiClinicAppointmentsRepository: {
            ...actual.apiClinicAppointmentsRepository,
            list: (...args: unknown[]) => listAppointments(...args),
        },
        apiClinicProgramsRepository: {
            ...actual.apiClinicProgramsRepository,
            list: (...args: unknown[]) => listPrograms(...args),
        },
    };
});

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

let role = 'admin';
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 1, name: 'Cleverton', role } }),
}));

function makePatient(
    id = '108',
    overrides: Partial<PatientDetail> = {},
): PatientDetail {
    return {
        id,
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
        ...overrides,
    };
}

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
    return {
        id: '21',
        patientId: '108',
        patientName: 'QA Mobile',
        clinicUserId: '5',
        clinicUserName: 'Cleverton',
        title: 'Sessão de joelho',
        description: null,
        startsAt: '2026-10-22T14:00:00',
        endsAt: '2026-10-22T15:00:00',
        status: 'completed',
        location: 'Sala 1',
        source: 'system',
        ...overrides,
    };
}

function makeEvolution(
    overrides: Partial<PatientEvolution> = {},
): PatientEvolution {
    return {
        id: 11,
        patientId: 108,
        clinicUserId: 9,
        clinicUser: { id: 9, name: 'Outra fisio' },
        evolutionTemplateId: 1,
        template: { id: 1, name: 'Sessão padrão' },
        title: 'Lombar aguda',
        generatedText: 'Alongar cadeia posterior.',
        notes: 'Dor em 4/10.',
        checkedItems: [],
        status: 'signed',
        signedAt: '2026-10-20T10:00:00',
        createdAt: '2026-10-20T10:00:00',
        ...overrides,
    };
}

function makeAssessment(
    overrides: Partial<AssessmentSummary> = {},
): AssessmentSummary {
    return {
        id: 31,
        status: 'signed',
        signedAt: '2026-09-01T10:00:00',
        template: { id: 2, name: 'SF-36' },
        clinicUser: { id: 5, name: 'Cleverton' },
        ...overrides,
    };
}

function makeQuestionnaire(
    overrides: Partial<PatientQuestionnaire> = {},
): PatientQuestionnaire {
    return {
        id: 41,
        clinicId: 1,
        patientId: 108,
        clinicUserId: 5,
        clinicUser: { id: 5, name: 'Cleverton' },
        questionnaireTemplateId: 3,
        template: { id: 3, title: 'Dor lombar' },
        status: 'answered',
        modality: 'remoto',
        answeredAt: '2026-10-18T12:00:00',
        expiresAt: null,
        publicToken: '11111111-1111-4111-8111-111111111111',
        shareUrl:
            '/clinica-a/paciente/questionarios/11111111-1111-4111-8111-111111111111',
        createdAt: '2026-10-10T12:00:00',
        ...overrides,
    };
}

function makeQuestionnaireDetail(): PatientQuestionnaireDetail {
    return {
        ...makeQuestionnaire(),
        template: {
            id: 3,
            clinicId: 1,
            title: 'Dor lombar',
            description: null,
            isActive: true,
            sections: [
                {
                    id: 1,
                    title: 'Sintomas',
                    sortOrder: 1,
                    questions: [
                        {
                            id: 8,
                            label: 'Nível de dor',
                            type: 'scale',
                            options: null,
                            scaleMin: 0,
                            scaleMax: 10,
                            required: true,
                            sortOrder: 1,
                        },
                    ],
                },
            ],
        },
        answers: [{ id: 1, questionnaireQuestionId: 8, answer: '7' }],
    };
}

function makeFile(overrides: Partial<PatientFile> = {}): PatientFile {
    return {
        id: 51,
        patientId: 108,
        clinicUserId: 5,
        clinicUser: { id: 5, name: 'Cleverton' },
        originalName: 'raio-x.pdf',
        name: 'Raio-X lombar',
        cdnUrl: 'https://cdn.example/raio-x.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        createdAt: '2026-10-12T09:00:00',
        ...overrides,
    };
}

function makeProgram(overrides: Partial<Program> = {}): Program {
    return {
        id: '61',
        title: 'Programa em casa',
        patientId: '108',
        patientName: 'QA Mobile',
        patientPhotoUrl: null,
        patientPhone: null,
        patientEmail: null,
        shareUrl: null,
        professionalId: '5',
        professionalName: 'Cleverton',
        professionalPhotoUrl: null,
        exerciseCount: 4,
        startDate: '2026-10-01',
        endDate: null,
        message: '',
        groups: [],
        status: 'active',
        patientViewedAt: null,
        patientCompletedCount: 1,
        createdAt: '2026-10-01T08:00:00',
        ...overrides,
    };
}

function emptyProgramPage(items: Program[] = []) {
    return {
        items,
        total: items.length,
        lastPage: 1,
        perPage: 20,
        currentPage: 1,
    };
}

function LocationProbe() {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <>
            <output aria-label="url atual">
                {`${location.pathname}${location.search}`}
            </output>
            <button type="button" onClick={() => navigate(-1)}>
                voltar do navegador
            </button>
        </>
    );
}

function renderPage(url: string) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[url]} future={routerFutureFlags}>
                <Routes>
                    <Route
                        path="/clinica/pacientes/:id"
                        element={
                            <>
                                <PatientRecordPage />
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
                    <Route
                        path="*"
                        element={
                            <>
                                <p>Outra tela</p>
                                <LocationProbe />
                            </>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

function currentUrl() {
    return screen.getByRole('status', { name: 'url atual', hidden: true })
        .textContent;
}

beforeEach(() => {
    role = 'admin';
    getDetailById.mockResolvedValue(makePatient());
    listEvolutions.mockResolvedValue([]);
    listAssessments.mockResolvedValue([]);
    listQuestionnaires.mockResolvedValue([]);
    findQuestionnaire.mockResolvedValue(makeQuestionnaireDetail());
    listFiles.mockResolvedValue([]);
    listAppointments.mockResolvedValue([]);
    listPrograms.mockResolvedValue(emptyProgramPage());
    vi.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
});

describe('prontuário do paciente (painel B)', () => {
    it('ignora ?variant= e não mostra a barra de protótipo', async () => {
        renderPage('/clinica/pacientes/108?variant=B');

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });
        expect(
            screen.queryByRole('group', {
                name: 'Trocar variante do protótipo',
            }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText('Painel de acompanhamento'),
        ).not.toBeInTheDocument();
    });

    it('mostra o cabeçalho e volta para a lista', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/pacientes/108');

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });
        expect(screen.getByText('Em tratamento')).toBeInTheDocument();
        expect(screen.getByText(/31 anos/)).toBeInTheDocument();
        expect(screen.getByText(/Amil/)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: '(84) 97777-6666' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Editar cadastro' }),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: 'Voltar para pacientes' }),
        );
        expect(currentUrl()).toBe('/clinica/pacientes');
    });

    it('pede consultas e programas com o patientId da rota, sem filtrar no navegador', async () => {
        const user = userEvent.setup();
        listAppointments.mockResolvedValue([
            makeAppointment(),
            makeAppointment({
                id: '99',
                patientId: '999',
                title: 'Consulta de outra pessoa',
            }),
        ]);
        listPrograms.mockResolvedValue(
            emptyProgramPage([
                makeProgram(),
                makeProgram({
                    id: '77',
                    patientId: '999',
                    title: 'Programa de outra pessoa',
                }),
            ]),
        );

        renderPage('/clinica/pacientes/108');

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });
        expect(listAppointments).toHaveBeenCalledWith(
            expect.objectContaining({ patientId: '108' }),
        );
        expect(listPrograms).toHaveBeenCalledWith(
            expect.objectContaining({ patientId: '108' }),
        );

        await user.click(screen.getByRole('tab', { name: /Consultas/ }));
        expect(
            screen.getByText('Consulta de outra pessoa'),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('tab', { name: /Programas/ }));
        expect(
            screen.getByText('Programa de outra pessoa'),
        ).toBeInTheDocument();
    });

    it('fisioterapeuta vê o aviso dos números e a evolução de outro profissional', async () => {
        role = 'physiotherapist';
        listEvolutions.mockResolvedValue([makeEvolution()]);

        renderPage('/clinica/pacientes/108');

        await waitFor(() => {
            expect(screen.getByText('Lombar aguda')).toBeInTheDocument();
        });
        expect(
            screen.getByText(
                'Os números e o gráfico são das suas consultas com este paciente.',
            ),
        ).toBeInTheDocument();
    });

    it('?tab=arquivos abre Arquivos; tab da v1 cai em Clínico', async () => {
        listFiles.mockResolvedValue([makeFile()]);
        listEvolutions.mockResolvedValue([makeEvolution()]);

        const { unmount } = renderPage('/clinica/pacientes/108?tab=arquivos');

        await waitFor(() => {
            expect(screen.getByText('Raio-X lombar')).toBeInTheDocument();
        });
        expect(screen.getByRole('tab', { name: /Arquivos/ })).toHaveAttribute(
            'data-state',
            'active',
        );
        expect(screen.queryByText('Lombar aguda')).not.toBeInTheDocument();
        unmount();

        renderPage('/clinica/pacientes/108?tab=questionnaires');

        await waitFor(() => {
            expect(screen.getByText('Lombar aguda')).toBeInTheDocument();
        });
        expect(screen.getByRole('tab', { name: /Clínico/ })).toHaveAttribute(
            'data-state',
            'active',
        );
    });

    it('trocar de aba grava tab na URL', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/pacientes/108');

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        await user.click(screen.getByRole('tab', { name: /Arquivos/ }));
        expect(currentUrl()).toBe('/clinica/pacientes/108?tab=arquivos');
        expect(screen.getByRole('tab', { name: /Arquivos/ })).toHaveAttribute(
            'data-state',
            'active',
        );
        expect(
            screen.getByText(/Nenhum registro em arquivos/i),
        ).toBeInTheDocument();
    });

    it('a busca filtra evolução e não esconde consulta', async () => {
        const user = userEvent.setup();
        listEvolutions.mockResolvedValue([makeEvolution()]);
        listAppointments.mockResolvedValue([makeAppointment()]);

        renderPage('/clinica/pacientes/108');

        await waitFor(() => {
            expect(screen.getByText('Lombar aguda')).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText('Pesquisar registros'), 'joelho');
        expect(screen.queryByText('Lombar aguda')).not.toBeInTheDocument();

        await user.click(screen.getByRole('tab', { name: /Consultas/ }));
        expect(screen.getAllByText('Sessão de joelho').length).toBeGreaterThan(
            0,
        );
    });

    it('abrir um registro, um ponto do gráfico e um arquivo mostra os dados reais', async () => {
        const user = userEvent.setup();
        listEvolutions.mockResolvedValue([makeEvolution()]);
        listQuestionnaires.mockResolvedValue([makeQuestionnaire()]);
        listAppointments.mockResolvedValue([makeAppointment()]);
        listFiles.mockResolvedValue([makeFile()]);

        renderPage('/clinica/pacientes/108');

        await waitFor(() => {
            expect(screen.getByText('Lombar aguda')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Lombar aguda/ }));
        const evolutionDrawer = await screen.findByRole('dialog', {
            name: 'Lombar aguda',
        });
        expect(
            within(evolutionDrawer).getByText(/Dor em 4\/10/),
        ).toBeInTheDocument();
        expect(
            within(evolutionDrawer).getByText(/Alongar cadeia posterior/),
        ).toBeInTheDocument();
        await user.click(
            within(evolutionDrawer).getByRole('button', { name: 'Fechar' }),
        );

        await user.click(screen.getByRole('button', { name: /Dor lombar/ }));
        const questionnaireDrawer = await screen.findByRole('dialog', {
            name: 'Dor lombar',
        });
        await waitFor(() => {
            expect(
                within(questionnaireDrawer).getByText('Nível de dor'),
            ).toBeInTheDocument();
        });
        expect(within(questionnaireDrawer).getByText('7')).toBeInTheDocument();
        await user.click(
            within(questionnaireDrawer).getByRole('button', { name: 'Fechar' }),
        );

        await user.click(
            screen.getByRole('button', { name: /Sessão de joelho, / }),
        );
        expect(
            await screen.findByRole('dialog', { name: 'Sessão de joelho' }),
        ).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Fechar' }));

        await user.click(screen.getByRole('tab', { name: /Arquivos/ }));
        await user.click(screen.getByRole('button', { name: /Raio-X lombar/ }));
        const fileDrawer = await screen.findByRole('dialog', {
            name: 'Raio-X lombar',
        });
        await user.click(
            within(fileDrawer).getByRole('button', { name: 'Baixar' }),
        );
        expect(window.open).toHaveBeenCalledWith(
            'https://cdn.example/raio-x.pdf',
            '_blank',
        );
    });

    it('paciente inexistente ou de outra clínica mostra 404 sem vazar o id', async () => {
        getDetailById.mockResolvedValue(null);
        renderPage('/clinica/pacientes/108');

        await waitFor(() => {
            expect(
                screen.getByText('Paciente não encontrado'),
            ).toBeInTheDocument();
        });
        expect(
            screen.queryByRole('heading', { name: 'QA Mobile' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Voltar para pacientes' }),
        ).toBeInTheDocument();
    });

    it('erro de evoluções não esconde o cabeçalho nem as outras abas', async () => {
        listEvolutions.mockRejectedValue(new Error('falhou'));
        listAssessments.mockResolvedValue([makeAssessment()]);
        listFiles.mockResolvedValue([makeFile()]);

        const user = userEvent.setup();
        renderPage('/clinica/pacientes/108');

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(
                screen.getByText('Não foi possível carregar estes registros'),
            ).toBeInTheDocument();
        });

        await user.click(screen.getByRole('tab', { name: /Arquivos/ }));
        expect(screen.getByText('Raio-X lombar')).toBeInTheDocument();
        expect(
            screen.queryByText('Não foi possível carregar estes registros'),
        ).not.toBeInTheDocument();
    });

    it('paciente sem registro mostra os próximos passos', async () => {
        renderPage('/clinica/pacientes/108');

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Próximos passos' }),
            ).toBeInTheDocument();
        });
        expect(screen.getByText('Hora de reavaliar')).toBeInTheDocument();
        expect(
            screen.getByText('Sem programa de exercícios'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Nenhuma consulta marcada'),
        ).toBeInTheDocument();
    });

    it('os arquivos desta rota não importam PrototypeSwitcher, apiClient nem a v1', () => {
        const root = join(process.cwd(), 'resources/js/pages/clinic/patient');
        const files = [
            join(root, 'PatientRecordPage.tsx'),
            join(root, 'patient-record/PatientRecordScreen.tsx'),
            join(root, 'patient-record/VariantB.tsx'),
            join(root, 'patient-record/data.ts'),
            join(root, 'patient-record/parts.tsx'),
        ];
        const source = files.map((f) => readFileSync(f, 'utf8')).join('\n');
        expect(source).not.toMatch('PrototypeSwitcher');
        expect(source).not.toMatch('patient-record-prototype');
        expect(source).not.toMatch('apiClient');
        expect(source).not.toMatch('@/components/ui');
        expect(source).not.toMatch('PatientRecordOriginal');
        expect(source).not.toMatch(/filter\([^)]*patientId/);
    });
});
