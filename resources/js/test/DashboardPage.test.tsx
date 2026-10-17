import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    formatToday,
    nextSessionTimingLabel,
} from '@/components/clinic/dashboard/dashboard-format';
import type { ClinicRole } from '@/domain/auth/session';
import type {
    DashboardSummary,
    OccupancyRate,
    PatientAcquisition,
} from '@/domain/clinic/dashboard';
import DashboardPage from '@/pages/clinic/DashboardPage';
import { routerFutureFlags } from '@/test/browser-router';

const authState = {
    user: {
        id: 1,
        name: 'Ana Admin',
        email: 'ana@clinic.test',
        role: 'admin' as ClinicRole,
        clinicId: 10,
    },
    logout: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => authState,
}));

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
}));

const useDashboardSummary = vi.fn();
const useOccupancyRate = vi.fn();
const usePatientAcquisition = vi.fn();
const useRecentActivities = vi.fn();

vi.mock('@/application/clinic/use-dashboard', () => ({
    useDashboardSummary: (...args: unknown[]) => useDashboardSummary(...args),
    useOccupancyRate: (...args: unknown[]) => useOccupancyRate(...args),
    usePatientAcquisition: (...args: unknown[]) =>
        usePatientAcquisition(...args),
    useRecentActivities: (...args: unknown[]) => useRecentActivities(...args),
}));

vi.mock('@/application/clinic/use-appointments', () => ({
    useClinicUsers: () => ({
        data: [
            { id: '1', name: 'Ana Admin' },
            { id: '2', name: 'Bruno Fisio' },
        ],
        isLoading: false,
        isError: false,
    }),
}));

function adminSummary(
    overrides: Partial<DashboardSummary> = {},
): DashboardSummary {
    return {
        viewer: {
            role: 'admin',
            canToggleScope: true,
            canChooseProfessional: true,
            canViewActivities: true,
            currentScope: 'clinic',
        },
        cards: {
            activePatients: 12,
            appointmentsToday: 3,
            activePrograms: 5,
            availableExercises: { count: 40, categoriesCount: 6 },
        },
        upcomingAppointments: [],
        birthdays: { total: 0, items: [] },
        ...overrides,
    };
}

function physioSummary(): DashboardSummary {
    return adminSummary({
        viewer: {
            role: 'physiotherapist',
            canToggleScope: false,
            canChooseProfessional: false,
            canViewActivities: false,
            currentScope: 'mine',
        },
    });
}

function idleQuery<T>(data: T) {
    return { data, isLoading: false, isError: false };
}

const occupancy: OccupancyRate = {
    clinicUserId: '1',
    granularity: 'daily',
    occupiedRate: 0.42,
    buckets: [
        { label: 'Seg', rate: 0.4 },
        { label: 'Ter', rate: 0 },
    ],
};

const acquisition: PatientAcquisition = {
    years: [2024, 2025, 2026],
    sources: [
        {
            source: 'indicacao_medica',
            perYear: { '2024': 2, '2025': 3, '2026': 5 },
            total: 10,
            percentTotal: 50,
        },
        {
            source: 'google',
            perYear: { '2024': 1, '2025': 2, '2026': 7 },
            total: 10,
            percentTotal: 50,
        },
    ],
    totalsPerYear: { '2024': 3, '2025': 5, '2026': 12 },
};

function renderPage(path = '/clinica') {
    return render(
        <MemoryRouter initialEntries={[path]} future={routerFutureFlags}>
            <DashboardPage />
        </MemoryRouter>,
    );
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
});

beforeEach(() => {
    vi.clearAllMocks();
    authState.user = {
        id: 1,
        name: 'Ana Admin',
        email: 'ana@clinic.test',
        role: 'admin',
        clinicId: 10,
    };
    useDashboardSummary.mockReturnValue(idleQuery(adminSummary()));
    useOccupancyRate.mockReturnValue(idleQuery(occupancy));
    usePatientAcquisition.mockReturnValue(idleQuery(acquisition));
    useRecentActivities.mockReturnValue(idleQuery([]));
});

describe('DashboardPage', () => {
    it('mostra o cumprimento, os KPIs e os atalhos para o admin', () => {
        renderPage();

        expect(
            screen.getByRole('heading', { name: 'Bem-vindo de volta, Ana' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Pacientes ativos')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('Consultas hoje')).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /Novo paciente/ }),
        ).toHaveAttribute('href', '/clinica/pacientes/novo');
        expect(
            screen.getByRole('link', { name: /Agendar consulta/ }),
        ).toHaveAttribute('href', '/clinica/agenda');
        expect(
            screen.getByRole('link', { name: /Criar programa/ }),
        ).toHaveAttribute('href', '/clinica/programas/novo');
        expect(
            screen.getByRole('link', { name: /Ver exercícios/ }),
        ).toHaveAttribute('href', '/clinica/exercicios');
        expect(
            screen.getByRole('button', { name: 'Toda a clínica' }),
        ).toBeInTheDocument();
        expect(screen.getByText('6 categorias')).toBeInTheDocument();
        expect(
            screen.getByText('6 categorias').closest('[data-trend]'),
        ).toBeNull();
    });

    it('pede o summary com scope=mine ao escolher Somente meus', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: 'Somente meus' }));

        expect(useDashboardSummary).toHaveBeenCalledWith('mine');
        expect(usePatientAcquisition).toHaveBeenCalledWith('mine');
    });

    it('fisioterapeuta não vê toggle, seletor de profissional nem o feed', () => {
        authState.user = {
            ...authState.user,
            name: 'Bruno Fisio',
            role: 'physiotherapist',
        };
        useDashboardSummary.mockReturnValue(idleQuery(physioSummary()));

        renderPage();

        expect(
            screen.queryByRole('button', { name: 'Toda a clínica' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Profissional')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: 'Atividade recente' }),
        ).not.toBeInTheDocument();
        expect(useRecentActivities).toHaveBeenCalledWith(false);
    });

    it('mostra o alerta da próxima sessão quando há consulta hoje', () => {
        useDashboardSummary.mockReturnValue(
            idleQuery(
                adminSummary({
                    upcomingAppointments: [
                        {
                            id: 'apt-1',
                            patientName: 'Paciente Um',
                            title: 'Retorno',
                            startsAt: new Date().toISOString(),
                            status: 'scheduled',
                        },
                    ],
                }),
            ),
        );

        renderPage();

        expect(
            screen.getByRole('heading', { name: 'Paciente Um' }),
        ).toBeInTheDocument();
        expect(screen.getAllByText('Retorno').length).toBeGreaterThan(0);
        expect(
            screen.getByRole('button', { name: 'Abrir agenda' }),
        ).toBeInTheDocument();
        expect(screen.getAllByText('Agendada').length).toBeGreaterThan(0);
        expect(screen.getByText(/Agora/)).toBeInTheDocument();
    });

    it('não diz Agora quando a próxima sessão ainda não começou', () => {
        const startsAt = new Date(
            Date.now() + 2 * 60 * 60 * 1000,
        ).toISOString();
        useDashboardSummary.mockReturnValue(
            idleQuery(
                adminSummary({
                    upcomingAppointments: [
                        {
                            id: 'apt-2',
                            patientName: 'Paciente Um',
                            title: 'Retorno',
                            startsAt,
                            status: 'scheduled',
                        },
                    ],
                }),
            ),
        );

        renderPage();

        expect(screen.queryByText(/Agora/)).not.toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Paciente Um' }),
        ).toBeInTheDocument();
    });

    it('esconde o alerta quando não há consulta hoje', () => {
        renderPage();

        expect(
            screen.queryByRole('button', { name: 'Abrir agenda' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText('Nenhuma consulta para hoje'),
        ).toBeInTheDocument();
    });

    it('liga o WhatsApp só quando o aniversariante tem telefone', () => {
        useDashboardSummary.mockReturnValue(
            idleQuery(
                adminSummary({
                    birthdays: {
                        total: 2,
                        items: [
                            {
                                patientId: 'p-1',
                                name: 'Paciente Dois',
                                day: 10,
                                phone: '11988887777',
                                canMessage: true,
                            },
                            {
                                patientId: 'p-2',
                                name: 'Paciente Três',
                                day: 12,
                                canMessage: false,
                            },
                        ],
                    },
                }),
            ),
        );

        renderPage();

        expect(screen.getByRole('link', { name: 'Mensagem' })).toHaveAttribute(
            'href',
            expect.stringContaining('https://wa.me/11988887777'),
        );
        expect(
            screen.getByRole('button', { name: 'Sem telefone' }),
        ).toBeDisabled();
    });

    it('mostra percentual e tooltip na ocupação e troca a granularidade', async () => {
        const user = userEvent.setup();
        renderPage();

        expect(
            screen.getByRole('button', { name: 'Seg · 40% ocupado' }),
        ).toBeInTheDocument();
        expect(screen.getByText('40%')).toBeInTheDocument();
        expect(screen.getByLabelText('Profissional')).toBeInTheDocument();

        await user.click(screen.getByRole('tab', { name: 'Semanal' }));

        expect(useOccupancyRate).toHaveBeenCalledWith('weekly', '1');
    });

    it('omite o percentual sobre a coluna quando há muitas barras', () => {
        useOccupancyRate.mockReturnValue(
            idleQuery({
                ...occupancy,
                buckets: Array.from({ length: 31 }, (_, index) => ({
                    label: String(index + 1),
                    rate: 0.1,
                })),
            }),
        );

        renderPage();

        expect(screen.queryByText('10%')).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: '1 · 10% ocupado' }),
        ).toBeInTheDocument();
    });

    it('mostra os três anos em cada origem da captação', () => {
        renderPage();

        const list = screen.getByRole('list', { name: 'Captação por origem' });
        expect(within(list).getByText('Indicação médica')).toBeInTheDocument();
        expect(within(list).getAllByText('2024')).toHaveLength(2);
        expect(within(list).getAllByText('2025')).toHaveLength(2);
        expect(within(list).getAllByText('2026')).toHaveLength(2);
    });

    it('mostra o feed de atividades para quem pode ver', () => {
        useRecentActivities.mockReturnValue(
            idleQuery([
                {
                    id: 'act-1',
                    type: 'patient_created',
                    description: 'Paciente cadastrado',
                    actorName: 'Ana Admin',
                    createdAt: new Date().toISOString(),
                },
            ]),
        );

        renderPage();

        expect(
            screen.getByRole('heading', { name: 'Atividade recente' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Paciente cadastrado')).toBeInTheDocument();
        expect(useRecentActivities).toHaveBeenCalledWith(true);
    });

    it('mostra o erro do summary sem o restante da página sumir', () => {
        useDashboardSummary.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        });

        renderPage();

        expect(
            screen.getByText('Não foi possível carregar o resumo'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Bem-vindo de volta, Ana' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /Novo paciente/ }),
        ).toBeInTheDocument();
    });

    it('ignora ?variant= e não mostra a barra de protótipo', () => {
        renderPage('/clinica?variant=B');

        expect(
            screen.queryByRole('group', {
                name: 'Trocar variante do protótipo',
            }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Bem-vindo de volta, Ana' }),
        ).toBeInTheDocument();
    });

    it('a agenda de produção não monta o protótipo', () => {
        const src = readFileSync(
            join(process.cwd(), 'resources/js/pages/clinic/AgendaPage.tsx'),
            'utf8',
        );
        expect(src).not.toMatch(/agenda-prototype/);
        expect(src).toMatch(/CalendarView/);
    });

    it('não importa shadcn nem Chart.js nos arquivos do dashboard', () => {
        const page = join(
            process.cwd(),
            'resources/js/pages/clinic/DashboardPage.tsx',
        );
        const dir = join(
            process.cwd(),
            'resources/js/components/clinic/dashboard',
        );
        const files = [
            page,
            ...readdirSync(dir)
                .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'))
                .map((name) => join(dir, name)),
        ];

        for (const file of files) {
            const src = readFileSync(file, 'utf8');
            expect(src, file).not.toMatch(/@\/components\/ui\b/);
            expect(src, file).not.toMatch(
                /chart\.js|react-chartjs-2|chart-setup/,
            );
        }
    });
});

describe('formatToday', () => {
    it('deixa a data em caixa normal', () => {
        const value = formatToday();
        expect(value.charAt(0)).toBe(value.charAt(0).toUpperCase());
        expect(value).not.toBe(value.toUpperCase());
    });
});

describe('nextSessionTimingLabel', () => {
    it('prefixa Agora só quando a sessão já começou', () => {
        const now = new Date('2026-10-17T12:00:00');
        expect(nextSessionTimingLabel('2026-10-17T11:30:00', now)).toMatch(
            /^Agora · /,
        );
        expect(nextSessionTimingLabel('2026-10-17T14:00:00', now)).not.toMatch(
            /Agora/,
        );
    });
});
