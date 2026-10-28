import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
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

import type {
    Appointment,
    EvolutionTemplate,
    PatientEvolution,
    Program,
} from '@/domain/clinic';
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
const listEvolutionTemplates = vi.fn();
const createEvolution = vi.fn();
const updateEvolution = vi.fn();
const signEvolution = vi.fn();
const destroyEvolution = vi.fn();
const listAssessments = vi.fn();
const listQuestionnaires = vi.fn();
const findQuestionnaire = vi.fn();
const storeQuestionnaire = vi.fn();
const destroyQuestionnaire = vi.fn();
const listQuestionnaireTemplates = vi.fn();
const listFiles = vi.fn();
const storeFile = vi.fn();
const destroyFile = vi.fn();
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
        listTemplates: (...args: unknown[]) => listEvolutionTemplates(...args),
        create: (...args: unknown[]) => createEvolution(...args),
        update: (...args: unknown[]) => updateEvolution(...args),
        sign: (...args: unknown[]) => signEvolution(...args),
        destroy: (...args: unknown[]) => destroyEvolution(...args),
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
            store: (...args: unknown[]) => storeQuestionnaire(...args),
            destroy: (...args: unknown[]) => destroyQuestionnaire(...args),
        },
    }),
);

vi.mock(
    '@/infrastructure/repositories/api-clinic-questionnaire-templates',
    () => ({
        apiClinicQuestionnaireTemplatesRepository: {
            list: (...args: unknown[]) => listQuestionnaireTemplates(...args),
        },
    }),
);

vi.mock('@/infrastructure/repositories/api-clinic-patient-files', () => ({
    apiClinicPatientFilesRepository: {
        listByPatient: (...args: unknown[]) => listFiles(...args),
        store: (...args: unknown[]) => storeFile(...args),
        destroy: (...args: unknown[]) => destroyFile(...args),
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

function makeEvolutionTemplate(
    overrides: Partial<EvolutionTemplate> = {},
): EvolutionTemplate {
    return {
        id: 1,
        clinicId: 1,
        name: 'Sessão padrão',
        description: null,
        isSystem: false,
        isActive: true,
        sections: [
            {
                id: 10,
                title: 'Conduta',
                sortOrder: 1,
                items: [
                    {
                        id: 20,
                        label: 'Aquecer',
                        printText: 'Aquecimento global',
                        hasFreeText: false,
                        freeTextPlaceholder: null,
                        sortOrder: 1,
                    },
                ],
            },
        ],
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
    const state = location.state as {
        openNewAppointment?: boolean;
        from?: string;
    } | null;
    return (
        <>
            <output aria-label="url atual">
                {`${location.pathname}${location.search}`}
            </output>
            <output aria-label="estado da navegação">
                {state?.openNewAppointment ? 'openNewAppointment' : ''}
            </output>
            <output aria-label="origem">{state?.from ?? ''}</output>
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
    listEvolutionTemplates.mockResolvedValue([]);
    createEvolution.mockResolvedValue(makeEvolution({ status: 'draft' }));
    updateEvolution.mockResolvedValue(makeEvolution({ status: 'draft' }));
    signEvolution.mockResolvedValue(makeEvolution());
    destroyEvolution.mockResolvedValue(undefined);
    listAssessments.mockResolvedValue([]);
    listQuestionnaires.mockResolvedValue([]);
    findQuestionnaire.mockResolvedValue(makeQuestionnaireDetail());
    storeQuestionnaire.mockResolvedValue(
        makeQuestionnaire({
            status: 'pending',
            answeredAt: null,
        }),
    );
    destroyQuestionnaire.mockResolvedValue(undefined);
    listQuestionnaireTemplates.mockResolvedValue([
        {
            id: 1,
            clinicId: 1,
            title: 'Anamnese lombar',
            description: null,
            isActive: true,
            sections: [],
        },
    ]);
    listFiles.mockResolvedValue([]);
    storeFile.mockResolvedValue(makeFile());
    destroyFile.mockResolvedValue(undefined);
    listAppointments.mockResolvedValue([]);
    listPrograms.mockResolvedValue(emptyProgramPage());
    vi.spyOn(window, 'open').mockImplementation(() => null);
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
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
            join(root, 'patient-record/share.ts'),
        ];
        const source = files.map((f) => readFileSync(f, 'utf8')).join('\n');
        expect(source).not.toMatch('PrototypeSwitcher');
        expect(source).not.toMatch('patient-record-prototype');
        expect(source).not.toMatch('apiClient');
        expect(source).not.toMatch('PatientRecordOriginal');
        expect(source).not.toMatch(/filter\([^)]*patientId/);
        expect(source).not.toMatch('stub do protótipo');
        expect(source).not.toMatch('EvolutionFormDrawer');
        const panel = [
            join(root, 'patient-record/VariantB.tsx'),
            join(root, 'patient-record/data.ts'),
            join(root, 'patient-record/parts.tsx'),
        ]
            .map((f) => readFileSync(f, 'utf8'))
            .join('\n');
        expect(panel).not.toMatch('@/components/ui');
        expect(source).not.toMatch('PatientFileUploadModal');
        expect(source).not.toMatch('QuestionnaireFormSheet');
    });

    it('nova evolução abre a Folha, grava e aparece em Clínico', async () => {
        const user = userEvent.setup();
        const created = makeEvolution({
            id: 77,
            title: 'Sessão de quadril',
            status: 'draft',
            signedAt: null,
            notes: null,
            generatedText: 'Alongar e fortalecer.',
        });
        createEvolution.mockImplementation(async (patientId, dto) => {
            listEvolutions.mockResolvedValue([created]);
            return { ...created, ...(dto as object) };
        });

        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Nova evolução' }));
        expect(
            await screen.findByRole('heading', { name: 'Nova evolução' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('article', { name: 'Folha da evolução' }),
        ).toBeInTheDocument();
        expect(screen.queryByText(/protótipo/i)).not.toBeInTheDocument();

        await user.click(screen.getByRole('radio', { name: 'Texto livre' }));
        const title = screen.getByLabelText(/título da sessão/i);
        await user.clear(title);
        await user.type(title, 'Sessão de quadril');
        await user.type(
            screen.getByLabelText(/texto da evolução/i),
            'Alongar e fortalecer.',
        );
        await user.click(
            screen.getByRole('button', { name: 'Salvar rascunho' }),
        );

        await waitFor(() => {
            expect(createEvolution).toHaveBeenCalled();
        });
        const dto = createEvolution.mock.calls[0]?.[1] as {
            title: string;
            generatedText: string;
            evolutionTemplateId: number | null;
        };
        expect(dto.title).toBe('Sessão de quadril');
        expect(dto.generatedText).toBe('Alongar e fortalecer.');
        expect(dto.evolutionTemplateId).toBeNull();
        expect(
            await screen.findByRole('button', { name: /Sessão de quadril/ }),
        ).toBeInTheDocument();
    });

    it('assinar e salvar chama o sign depois de criar', async () => {
        const user = userEvent.setup();
        const created = makeEvolution({
            id: 81,
            title: 'Sessão assinada',
            status: 'draft',
            signedAt: null,
            generatedText: 'Fortalecer.',
        });
        createEvolution.mockResolvedValue(created);
        signEvolution.mockResolvedValue({
            ...created,
            status: 'signed' as const,
            signedAt: '2026-10-23T12:00:00',
        });

        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Nova evolução' }));
        await user.click(screen.getByRole('radio', { name: 'Texto livre' }));
        const title = screen.getByLabelText(/título da sessão/i);
        await user.clear(title);
        await user.type(title, 'Sessão assinada');
        await user.type(
            screen.getByLabelText(/texto da evolução/i),
            'Fortalecer.',
        );
        await user.click(
            screen.getByRole('button', { name: 'Assinar e salvar' }),
        );

        await waitFor(() => {
            expect(signEvolution).toHaveBeenCalledWith('81');
        });
        expect(createEvolution).toHaveBeenCalled();
    });

    it('enviar arquivo abre a Foto do documento, grava com o tipo no nome e aparece em Arquivos', async () => {
        const user = userEvent.setup();
        const created = makeFile({
            id: 88,
            name: 'Laudo: Laudo',
            originalName: 'laudo.pdf',
        });
        storeFile.mockImplementation(async (_patientId, _file, options) => {
            const name =
                (options as { name?: string } | undefined)?.name ??
                created.name;
            const stored = { ...created, name };
            listFiles.mockResolvedValue([stored]);
            return stored;
        });

        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        await user.click(
            screen.getByRole('button', { name: 'Enviar arquivo' }),
        );
        expect(
            await screen.findByRole('heading', {
                name: 'Adicionar ao prontuário',
            }),
        ).toBeInTheDocument();
        expect(screen.getByText('Fotografar')).toBeInTheDocument();

        const file = new File(['laudo'], 'laudo.pdf', {
            type: 'application/pdf',
        });
        await user.upload(
            screen.getByLabelText('Escolher arquivo do computador', {
                selector: 'input',
            }),
            file,
        );
        await user.click(screen.getByRole('button', { name: 'Laudo' }));
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        await waitFor(() => {
            expect(storeFile).toHaveBeenCalled();
        });
        const options = storeFile.mock.calls[0]?.[2] as { name?: string };
        expect(options.name).toMatch(/^Laudo:/);
        await user.click(screen.getByRole('button', { name: 'Concluir' }));
        await user.click(screen.getByRole('tab', { name: /Arquivos/ }));
        expect(await screen.findByText(/^Laudo:/)).toBeInTheDocument();
    });

    it('arquivo de tipo inválido recusa antes do envio', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        await user.click(
            screen.getByRole('button', { name: 'Enviar arquivo' }),
        );
        const bad = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
        Object.defineProperty(bad, 'size', { value: 21 * 1024 * 1024 });
        await user.upload(
            screen.getByLabelText('Escolher arquivo do computador', {
                selector: 'input',
            }),
            bad,
        );
        expect(
            screen.getByText(/não pode ultrapassar 20 mb/i),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
        expect(storeFile).not.toHaveBeenCalled();
    });

    it('enviar questionário cria o envio remoto e o passo Pronto mostra o shareUrl com token', async () => {
        const user = userEvent.setup();
        const token = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
        const created = makeQuestionnaire({
            id: 12,
            status: 'pending',
            answeredAt: null,
            publicToken: token,
            shareUrl: `/clinica-a/paciente/questionarios/${token}`,
        });
        storeQuestionnaire.mockImplementation(async () => {
            listQuestionnaires.mockResolvedValue([created]);
            return created;
        });
        getDetailById.mockResolvedValue(
            makePatient('108', { email: 'paciente@example.com' }),
        );

        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        await user.click(
            screen.getByRole('button', { name: 'Enviar questionário' }),
        );
        await user.click(screen.getByText('Anamnese lombar'));
        expect(screen.queryByText('Aqui na clínica')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /^enviar$/i }));

        await waitFor(() => {
            expect(storeQuestionnaire).toHaveBeenCalled();
        });
        const dto = storeQuestionnaire.mock.calls[0]?.[1] as {
            modality: string;
        };
        expect(dto.modality).toBe('remoto');

        expect(
            await screen.findByRole('heading', { name: 'Pronto' }),
        ).toBeInTheDocument();
        expect(screen.getByText(created.shareUrl!)).toBeInTheDocument();
        expect(
            screen.queryByText(/\/questionarios\/12\b/),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText(/\/questionnaires\/12\b/),
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole('button', { name: /copiar link/i }),
        ).toBeEnabled();
        expect(screen.getByRole('button', { name: /whatsapp/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /e-mail/i })).toBeEnabled();
        fireEvent.click(screen.getByRole('button', { name: /whatsapp/i }));
        expect(window.open).toHaveBeenCalledWith(
            expect.stringContaining(`https://wa.me/84977776666?text=`),
            '_blank',
            'noopener,noreferrer',
        );
        expect(window.open).toHaveBeenCalledWith(
            expect.stringContaining(token),
            '_blank',
            'noopener,noreferrer',
        );
    });

    it('sem telefone e e-mail, WhatsApp e E-mail ficam desabilitados; Copiar continua', async () => {
        const user = userEvent.setup();
        const token = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
        const created = makeQuestionnaire({
            id: 13,
            status: 'pending',
            answeredAt: null,
            publicToken: token,
            shareUrl: `/clinica-a/paciente/questionarios/${token}`,
        });
        storeQuestionnaire.mockImplementation(async () => {
            listQuestionnaires.mockResolvedValue([created]);
            return created;
        });
        getDetailById.mockResolvedValue(
            makePatient('108', { phone: undefined, email: undefined }),
        );

        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        await user.click(
            screen.getByRole('button', { name: 'Enviar questionário' }),
        );
        await user.click(screen.getByText('Anamnese lombar'));
        await user.click(screen.getByRole('button', { name: /^enviar$/i }));

        expect(
            await screen.findByRole('heading', { name: 'Pronto' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /copiar link/i }),
        ).toBeEnabled();
        expect(
            screen.getByRole('button', { name: /whatsapp/i }),
        ).toBeDisabled();
        expect(screen.getByRole('button', { name: /e-mail/i })).toBeDisabled();
    });

    it('secretária vê evolução e avaliação aria-disabled; clique e Enter não abrem', async () => {
        const user = userEvent.setup();
        role = 'secretary';
        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        const evolution = screen.getByRole('button', { name: 'Nova evolução' });
        const assessment = screen.getByRole('button', {
            name: 'Nova avaliação',
        });
        expect(evolution).toHaveAttribute('aria-disabled', 'true');
        expect(assessment).toHaveAttribute('aria-disabled', 'true');

        evolution.focus();
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
            'Apenas admin ou fisioterapeuta',
        );
        await user.click(evolution);
        expect(
            screen.queryByRole('heading', { name: 'Nova evolução' }),
        ).not.toBeInTheDocument();

        assessment.focus();
        await user.keyboard('{Enter}');
        expect(currentUrl()).toBe('/clinica/pacientes/108');
        expect(screen.queryByText('Outra tela')).not.toBeInTheDocument();
    });

    it('agendar navega para a agenda com patientId e openNewAppointment', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Agendar' }));
        expect(currentUrl()).toBe('/clinica/agenda?patientId=108');
        expect(
            screen.getByRole('status', { name: 'estado da navegação' }),
        ).toHaveTextContent('openNewAppointment');
    });

    it('novo programa e prescrever navegam com patientId', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Prescrever' }));
        expect(currentUrl()).toBe('/clinica/programas/novo?patientId=108');
    });

    it('WhatsApp do cabeçalho abre wa.me com os dígitos; sem telefone fica desabilitado', async () => {
        const user = userEvent.setup();
        const { unmount } = renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });

        await user.click(
            screen.getByRole('button', { name: 'Chamar no WhatsApp' }),
        );
        expect(window.open).toHaveBeenCalledWith(
            'https://wa.me/84977776666',
            '_blank',
            'noopener,noreferrer',
        );
        unmount();

        getDetailById.mockResolvedValue(
            makePatient('108', { phone: undefined }),
        );
        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'QA Mobile' }),
            ).toBeInTheDocument();
        });
        const whatsapp = screen.getByRole('button', {
            name: 'Chamar no WhatsApp',
        });
        expect(whatsapp).toHaveAttribute('aria-disabled', 'true');
        await user.click(whatsapp);
        expect(window.open).toHaveBeenCalledTimes(1);
    });

    it('drawer pendente tem os três botões; o respondido mostra respostas e não tem formulário', async () => {
        const user = userEvent.setup();
        listQuestionnaires.mockResolvedValue([
            makeQuestionnaire({
                id: 41,
                status: 'pending',
                answeredAt: null,
                template: { id: 3, title: 'Dor lombar' },
            }),
            makeQuestionnaire({
                id: 42,
                status: 'answered',
                template: { id: 3, title: 'SF-36' },
            }),
        ]);
        findQuestionnaire.mockImplementation(async (_patientId, qid) => {
            if (String(qid) === '42') {
                return {
                    ...makeQuestionnaireDetail(),
                    id: 42,
                    template: {
                        ...makeQuestionnaireDetail().template,
                        title: 'SF-36',
                    },
                };
            }
            return makeQuestionnaire({
                id: 41,
                status: 'pending',
                answeredAt: null,
            });
        });
        getDetailById.mockResolvedValue(
            makePatient('108', { email: 'paciente@example.com' }),
        );

        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: /Dor lombar/ }),
            ).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Dor lombar/ }));
        const pending = await screen.findByRole('dialog', {
            name: 'Dor lombar',
        });
        expect(
            within(pending).getByRole('button', { name: 'Copiar link' }),
        ).toBeInTheDocument();
        expect(
            within(pending).getByRole('button', { name: 'WhatsApp' }),
        ).toBeInTheDocument();
        expect(
            within(pending).getByRole('button', { name: 'E-mail' }),
        ).toBeInTheDocument();
        expect(
            within(pending).queryByRole('button', { name: /responder/i }),
        ).not.toBeInTheDocument();
        await user.click(
            within(pending).getByRole('button', { name: 'Fechar' }),
        );

        await user.click(screen.getByRole('button', { name: /SF-36/ }));
        const answered = await screen.findByRole('dialog', { name: 'SF-36' });
        await waitFor(() => {
            expect(
                within(answered).getByText('Nível de dor'),
            ).toBeInTheDocument();
        });
        expect(within(answered).getByText('7')).toBeInTheDocument();
        expect(
            within(answered).queryByRole('button', { name: 'Copiar link' }),
        ).not.toBeInTheDocument();
        expect(within(answered).queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('editar rascunho abre a gaveta; excluir pede DsModal e some da lista', async () => {
        const user = userEvent.setup();
        const draft = makeEvolution({
            id: 11,
            title: 'Rascunho lombar',
            status: 'draft',
            signedAt: null,
        });
        listEvolutions.mockResolvedValue([draft]);
        destroyEvolution.mockImplementation(async () => {
            listEvolutions.mockResolvedValue([]);
        });

        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: /Rascunho lombar/ }),
            ).toBeInTheDocument();
        });

        await user.click(
            screen.getByRole('button', { name: /Rascunho lombar/ }),
        );
        const drawer = await screen.findByRole('dialog', {
            name: 'Rascunho lombar',
        });
        await user.click(
            within(drawer).getByRole('button', { name: 'Editar rascunho' }),
        );
        expect(
            await screen.findByRole('heading', { name: 'Editar evolução' }),
        ).toBeInTheDocument();
        const sheet = screen.getByRole('article', {
            name: 'Folha da evolução',
        });
        expect(sheet).toBeInTheDocument();
        expect(sheet).toHaveTextContent('Alongar cadeia posterior.');
        expect(screen.getByLabelText(/título da sessão/i)).toHaveValue(
            'Rascunho lombar',
        );
        await user.keyboard('{Escape}');

        await user.click(
            screen.getByRole('button', { name: /Rascunho lombar/ }),
        );
        const again = await screen.findByRole('dialog', {
            name: 'Rascunho lombar',
        });
        await user.click(
            within(again).getByRole('button', { name: 'Excluir rascunho' }),
        );
        const confirm = await screen.findByRole('dialog', {
            name: 'Excluir rascunho de evolução',
        });
        await user.click(
            within(confirm).getByRole('button', { name: 'Excluir' }),
        );

        await waitFor(() => {
            expect(destroyEvolution).toHaveBeenCalledWith('11');
        });
        await waitFor(() => {
            expect(
                screen.queryByRole('button', { name: /Rascunho lombar/ }),
            ).not.toBeInTheDocument();
        });
    });

    it('com modelo carregado, desmarcar tudo não regrava o texto antigo', async () => {
        const user = userEvent.setup();
        listEvolutionTemplates.mockResolvedValue([makeEvolutionTemplate()]);
        const draft = makeEvolution({
            id: 11,
            title: 'Rascunho lombar',
            status: 'draft',
            signedAt: null,
            evolutionTemplateId: 1,
            checkedItems: [{ itemId: 20, freeTextValue: null }],
            generatedText: 'Alongar cadeia posterior.',
        });
        listEvolutions.mockResolvedValue([draft]);
        updateEvolution.mockResolvedValue(draft);

        renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: /Rascunho lombar/ }),
            ).toBeInTheDocument();
        });

        await user.click(
            screen.getByRole('button', { name: /Rascunho lombar/ }),
        );
        const drawer = await screen.findByRole('dialog', {
            name: 'Rascunho lombar',
        });
        await user.click(
            within(drawer).getByRole('button', { name: 'Editar rascunho' }),
        );
        expect(
            await screen.findByRole('heading', { name: 'Editar evolução' }),
        ).toBeInTheDocument();

        const sheet = screen.getByRole('article', {
            name: 'Folha da evolução',
        });
        expect(
            await screen.findByRole('checkbox', { name: 'Aquecer' }),
        ).toBeChecked();
        expect(sheet).toHaveTextContent('Aquecimento global');

        await user.click(screen.getByRole('checkbox', { name: 'Aquecer' }));
        expect(sheet).not.toHaveTextContent('Alongar cadeia posterior.');
        expect(sheet).not.toHaveTextContent('Aquecimento global');
        expect(sheet).toHaveTextContent(
            'Os procedimentos marcados aparecem aqui.',
        );

        await user.click(
            screen.getByRole('button', { name: 'Salvar rascunho' }),
        );
        await waitFor(() => {
            expect(updateEvolution).toHaveBeenCalled();
        });
        const dto = updateEvolution.mock.calls[0]?.[1] as {
            generatedText: string | null;
            checkedItemIds: number[];
        };
        expect(dto.generatedText).toBeNull();
        expect(dto.checkedItemIds).toEqual([]);
    });

    it('fisioterapeuta não exclui evolução; secretária não exclui arquivo de outro', async () => {
        const user = userEvent.setup();
        role = 'physiotherapist';
        listEvolutions.mockResolvedValue([
            makeEvolution({
                id: 11,
                title: 'Rascunho lombar',
                status: 'draft',
                signedAt: null,
                clinicUserId: 1,
            }),
        ]);

        const { unmount } = renderPage('/clinica/pacientes/108');
        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: /Rascunho lombar/ }),
            ).toBeInTheDocument();
        });
        await user.click(
            screen.getByRole('button', { name: /Rascunho lombar/ }),
        );
        const evoDrawer = await screen.findByRole('dialog', {
            name: 'Rascunho lombar',
        });
        const deleteEvo = within(evoDrawer).getByRole('button', {
            name: 'Excluir rascunho',
        });
        expect(deleteEvo).toHaveAttribute('aria-disabled', 'true');
        await user.click(deleteEvo);
        expect(
            screen.queryByRole('dialog', {
                name: 'Excluir rascunho de evolução',
            }),
        ).not.toBeInTheDocument();
        unmount();

        role = 'secretary';
        listEvolutions.mockResolvedValue([]);
        listFiles.mockResolvedValue([
            makeFile({ clinicUserId: 5, name: 'Raio-X lombar' }),
        ]);
        listQuestionnaires.mockResolvedValue([
            makeQuestionnaire({
                clinicUserId: 5,
                status: 'pending',
                answeredAt: null,
            }),
        ]);
        renderPage('/clinica/pacientes/108?tab=arquivos');
        await waitFor(() => {
            expect(screen.getByText('Raio-X lombar')).toBeInTheDocument();
        });
        await user.click(screen.getByRole('button', { name: /Raio-X lombar/ }));
        const fileDrawer = await screen.findByRole('dialog', {
            name: 'Raio-X lombar',
        });
        const deleteFileBtn = within(fileDrawer).getByRole('button', {
            name: 'Excluir arquivo',
        });
        expect(deleteFileBtn).toHaveAttribute('aria-disabled', 'true');
        await user.click(deleteFileBtn);
        expect(
            screen.queryByRole('dialog', { name: 'Excluir arquivo' }),
        ).not.toBeInTheDocument();
        await user.click(
            within(fileDrawer).getByRole('button', { name: 'Fechar' }),
        );

        await user.click(screen.getByRole('tab', { name: /Clínico/ }));
        await user.click(screen.getByRole('button', { name: /Dor lombar/ }));
        const qDrawer = await screen.findByRole('dialog', {
            name: 'Dor lombar',
        });
        const deleteQ = within(qDrawer).getByRole('button', {
            name: 'Excluir questionário',
        });
        expect(deleteQ).toHaveAttribute('aria-disabled', 'true');
        await user.click(deleteQ);
        expect(
            screen.queryByRole('dialog', { name: 'Excluir questionário' }),
        ).not.toBeInTheDocument();
    });

    it('"Abrir programa" na gaveta abre o painel do programa levando o prontuário como origem', async () => {
        const user = userEvent.setup();
        listPrograms.mockResolvedValue(emptyProgramPage([makeProgram()]));

        renderPage('/clinica/pacientes/108');

        await user.click(await screen.findByRole('tab', { name: /Programas/ }));
        await user.click(
            await screen.findByRole('button', { name: /Programa em casa/ }),
        );
        const drawer = await screen.findByRole('dialog', {
            name: 'Programa em casa',
        });
        await user.click(
            within(drawer).getByRole('button', { name: 'Abrir programa' }),
        );

        expect(currentUrl()).toBe('/clinica/programas/61');
        expect(
            screen.getByRole('status', { name: 'origem', hidden: true })
                .textContent,
        ).toMatch(/^\/clinica\/pacientes\/108/);
    });
});
