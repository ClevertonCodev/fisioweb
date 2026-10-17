import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    dayKey,
    formatToday,
    monthName,
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
const refreshDashboard = vi.fn();

vi.mock('@/application/clinic/use-dashboard', () => ({
    useDashboardSummary: (...args: unknown[]) => useDashboardSummary(...args),
    useOccupancyRate: (...args: unknown[]) => useOccupancyRate(...args),
    usePatientAcquisition: (...args: unknown[]) =>
        usePatientAcquisition(...args),
    useRecentActivities: (...args: unknown[]) => useRecentActivities(...args),
    useRefreshDashboard: () => refreshDashboard,
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
    it('atualiza os dados do dashboard pelo botão', async () => {
        refreshDashboard.mockResolvedValue(undefined);
        const user = userEvent.setup();
        renderPage();

        await user.click(
            screen.getByRole('button', { name: 'Atualizar dados' }),
        );

        expect(refreshDashboard).toHaveBeenCalledTimes(1);
    });

    it('desabilita o botão enquanto atualiza', async () => {
        let finish: () => void = () => undefined;
        refreshDashboard.mockReturnValue(
            new Promise<void>((resolve) => {
                finish = resolve;
            }),
        );
        const user = userEvent.setup();
        renderPage();
        const button = screen.getByRole('button', { name: 'Atualizar dados' });

        await user.click(button);
        expect(button).toBeDisabled();

        await act(async () => finish());
        expect(button).toBeEnabled();
    });

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

    it('cumprimenta pelo nome, não pelo título', () => {
        authState.user = { ...authState.user, name: 'Dra. Ana Paula' };

        renderPage();

        expect(
            screen.getByRole('heading', { name: 'Bem-vindo de volta, Ana' }),
        ).toBeInTheDocument();
    });

    it('pede o summary com scope=mine ao escolher Somente meus', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: 'Somente meus' }));

        expect(useDashboardSummary).toHaveBeenCalledWith(
            'mine',
            expect.any(String),
        );
        expect(usePatientAcquisition).toHaveBeenCalledWith('mine');
    });

    it('mantém o toggle quando o summary de Somente meus falha', async () => {
        useDashboardSummary.mockImplementation((scope: string) =>
            scope === 'mine'
                ? { data: undefined, isLoading: false, isError: true }
                : idleQuery(adminSummary()),
        );
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: 'Somente meus' }));

        expect(
            screen.getByText('Não foi possível carregar o resumo'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Profissional')).toBeInTheDocument();
        expect(useRecentActivities).toHaveBeenLastCalledWith(true);

        await user.click(
            screen.getByRole('button', { name: 'Toda a clínica' }),
        );

        expect(useDashboardSummary).toHaveBeenLastCalledWith(
            'clinic',
            expect.any(String),
        );
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
        expect(useOccupancyRate).toHaveBeenLastCalledWith('daily', undefined);
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

    it('pula a sessão já concluída e mostra a seguinte no alerta', () => {
        const hour = 60 * 60 * 1000;
        useDashboardSummary.mockReturnValue(
            idleQuery(
                adminSummary({
                    upcomingAppointments: [
                        {
                            id: 'apt-manha',
                            patientName: 'Paciente Manhã',
                            title: 'Avaliação',
                            startsAt: new Date(
                                Date.now() - 8 * hour,
                            ).toISOString(),
                            status: 'completed',
                        },
                        {
                            id: 'apt-tarde',
                            patientName: 'Paciente Tarde',
                            title: 'Retorno',
                            startsAt: new Date(Date.now() + hour).toISOString(),
                            status: 'confirmed',
                        },
                    ],
                }),
            ),
        );

        renderPage();

        expect(
            screen.getByRole('heading', { name: 'Paciente Tarde' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: 'Paciente Manhã' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/Agora/)).not.toBeInTheDocument();
    });

    it('esconde o alerta quando a única sessão do dia começou há horas', () => {
        useDashboardSummary.mockReturnValue(
            idleQuery(
                adminSummary({
                    upcomingAppointments: [
                        {
                            id: 'apt-antiga',
                            patientName: 'Paciente Manhã',
                            title: 'Avaliação',
                            startsAt: new Date(
                                Date.now() - 3 * 60 * 60 * 1000,
                            ).toISOString(),
                            status: 'scheduled',
                        },
                    ],
                }),
            ),
        );

        renderPage();

        expect(
            screen.queryByRole('button', { name: 'Abrir agenda' }),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Paciente Manhã')).toBeInTheDocument();
    });

    it('pula a falta recente e mostra a sessão pendente seguinte', () => {
        const minute = 60 * 1000;
        useDashboardSummary.mockReturnValue(
            idleQuery(
                adminSummary({
                    upcomingAppointments: [
                        {
                            id: 'apt-falta',
                            patientName: 'Paciente Falta',
                            title: 'Avaliação',
                            startsAt: new Date(
                                Date.now() - 20 * minute,
                            ).toISOString(),
                            status: 'no_show',
                        },
                        {
                            id: 'apt-seguinte',
                            patientName: 'Paciente Seguinte',
                            title: 'Retorno',
                            startsAt: new Date(
                                Date.now() + 60 * minute,
                            ).toISOString(),
                            status: 'confirmed',
                        },
                    ],
                }),
            ),
        );

        renderPage();

        expect(
            screen.getByRole('heading', { name: 'Paciente Seguinte' }),
        ).toBeInTheDocument();
        expect(screen.queryByText(/Agora/)).not.toBeInTheDocument();
    });

    it('esconde o alerta quando a única sessão futura já foi concluída', () => {
        useDashboardSummary.mockReturnValue(
            idleQuery(
                adminSummary({
                    upcomingAppointments: [
                        {
                            id: 'apt-antecipada',
                            patientName: 'Paciente Antecipada',
                            title: 'Retorno',
                            startsAt: new Date(
                                Date.now() + 30 * 60 * 1000,
                            ).toISOString(),
                            status: 'completed',
                        },
                    ],
                }),
            ),
        );

        renderPage();

        expect(
            screen.queryByRole('button', { name: 'Abrir agenda' }),
        ).not.toBeInTheDocument();
    });

    it('o alerta acompanha o relógio com a página aberta', () => {
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        try {
            const minute = 60 * 1000;
            useDashboardSummary.mockReturnValue(
                idleQuery(
                    adminSummary({
                        upcomingAppointments: [
                            {
                                id: 'apt-relogio',
                                patientName: 'Paciente Relógio',
                                title: 'Retorno',
                                startsAt: new Date(
                                    Date.now() + 30 * minute,
                                ).toISOString(),
                                status: 'scheduled',
                            },
                        ],
                    }),
                ),
            );

            renderPage();
            expect(
                screen.getByRole('heading', { name: 'Paciente Relógio' }),
            ).toBeInTheDocument();
            expect(screen.queryByText(/Agora/)).not.toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(45 * minute);
            });
            expect(screen.getByText(/Agora/)).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(60 * minute);
            });
            expect(
                screen.queryByRole('heading', { name: 'Paciente Relógio' }),
            ).not.toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });

    it('pede o summary do dia novo quando a página atravessa a meia-noite', () => {
        const today = new Date();
        const lastDay = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
            23,
            50,
        );
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        vi.setSystemTime(lastDay);
        try {
            const dayOf = (date: Date) => formatToday(date);
            const nextDay = new Date(lastDay.getTime() + 15 * 60 * 1000);
            const firstKey = dayKey(lastDay);
            useDashboardSummary.mockImplementation(
                (_scope: string, day: string) =>
                    day === firstKey
                        ? idleQuery(
                              adminSummary({
                                  birthdays: {
                                      total: 1,
                                      items: [
                                          {
                                              patientId: 'p-fim',
                                              name: 'Paciente Fim do Mês',
                                              day: lastDay.getDate(),
                                              canMessage: false,
                                          },
                                      ],
                                  },
                              }),
                          )
                        : { data: undefined, isLoading: true, isError: false },
            );

            renderPage();
            expect(screen.getByText(dayOf(lastDay))).toBeInTheDocument();
            expect(screen.getByText('Paciente Fim do Mês')).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(15 * 60 * 1000);
            });

            expect(useDashboardSummary).toHaveBeenLastCalledWith(
                'clinic',
                dayKey(nextDay),
            );
            expect(screen.getByText(dayOf(nextDay))).toBeInTheDocument();
            expect(
                screen.getByText(`Em ${monthName(nextDay)}`),
            ).toBeInTheDocument();
            expect(
                screen.queryByText('Paciente Fim do Mês'),
            ).not.toBeInTheDocument();
            expect(
                screen.queryByText(
                    `${lastDay.getDate()} de ${monthName(nextDay)}`,
                ),
            ).not.toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
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

    it('preenche o profissional da ocupação quando a sessão hidrata depois', () => {
        const sessionUser = authState.user;
        (authState as { user: typeof sessionUser | null }).user = null;
        const { rerender } = renderPage();

        authState.user = sessionUser;
        rerender(
            <MemoryRouter
                initialEntries={['/clinica']}
                future={routerFutureFlags}
            >
                <DashboardPage />
            </MemoryRouter>,
        );

        expect(useOccupancyRate).toHaveBeenLastCalledWith('daily', '1');
    });

    it('preenche o profissional da ocupação quando o summary chega depois', () => {
        useDashboardSummary.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        });
        const { rerender } = renderPage();
        expect(useOccupancyRate).toHaveBeenLastCalledWith('daily', undefined);

        useDashboardSummary.mockReturnValue(idleQuery(adminSummary()));
        rerender(
            <MemoryRouter
                initialEntries={['/clinica']}
                future={routerFutureFlags}
            >
                <DashboardPage />
            </MemoryRouter>,
        );

        expect(useOccupancyRate).toHaveBeenLastCalledWith('daily', '1');
    });

    it('limita a altura da coluna a 100% quando a agenda passa do horário', () => {
        useOccupancyRate.mockReturnValue(
            idleQuery({
                ...occupancy,
                buckets: [{ label: 'Seg', rate: 1.5 }],
            }),
        );

        renderPage();

        const column = screen.getByRole('button', {
            name: 'Seg · 150% ocupado',
        });
        const bar = column.querySelector<HTMLElement>('[style]');
        expect(bar?.style.height).toBe('100%');
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
        const value = formatToday(new Date());
        expect(value.charAt(0)).toBe(value.charAt(0).toUpperCase());
        expect(value).not.toBe(value.toUpperCase());
    });
});

describe('nextSessionTimingLabel', () => {
    it('prefixa Agora só quando a sessão já começou', () => {
        const now = new Date();
        const minutes = (n: number) =>
            new Date(now.getTime() + n * 60 * 1000).toISOString();
        expect(nextSessionTimingLabel(minutes(-30), now)).toMatch(/^Agora · /);
        expect(nextSessionTimingLabel(minutes(120), now)).not.toMatch(/Agora/);
    });
});
