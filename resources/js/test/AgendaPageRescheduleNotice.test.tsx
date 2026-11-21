import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Appointment } from '@/domain/clinic';
import AgendaPage from '@/pages/clinic/AgendaPage';

const appointmentsRepo = vi.hoisted(() => ({
    list: vi.fn(),
    getClinicUsers: vi.fn(),
    getAgendaPatients: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    cancel: vi.fn(),
    patientHistory: vi.fn(),
    sendEmail: vi.fn(),
}));

vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@/infrastructure/repositories')>();
    return {
        ...actual,
        apiClinicAppointmentsRepository: appointmentsRepo,
        apiClinicAgendaPreferencesRepository: {
            get: vi.fn().mockResolvedValue({}),
            save: vi.fn().mockResolvedValue(undefined),
        },
        apiClinicServiceTypesRepository: {
            list: vi.fn().mockResolvedValue([]),
            replace: vi.fn(),
        },
    };
});

vi.mock('@/components/clinic/agenda/AgendaView', () => ({
    AgendaView: ({
        appointments,
        onEventClick,
        onEventDrop,
        onEventResize,
    }: {
        appointments: Appointment[];
        onEventClick: (apt: Appointment) => void;
        onEventDrop: (id: string, start: string, end: string) => Promise<void>;
        onEventResize: (
            id: string,
            start: string,
            end: string,
        ) => Promise<void>;
    }) => (
        <div>
            {appointments.map((apt) => {
                const start = new Date(apt.startsAt);
                const end = new Date(apt.endsAt);
                const nextDay = (d: Date) =>
                    new Date(d.getTime() + 24 * 60 * 60 * 1000).toISOString();
                const later = new Date(
                    end.getTime() + 30 * 60 * 1000,
                ).toISOString();
                return (
                    <div key={apt.id}>
                        <button type="button" onClick={() => onEventClick(apt)}>
                            abrir {apt.id}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                void onEventDrop(
                                    apt.id,
                                    nextDay(start),
                                    nextDay(end),
                                ).catch(() => undefined)
                            }
                        >
                            arrastar {apt.id}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                void onEventResize(
                                    apt.id,
                                    start.toISOString(),
                                    later,
                                ).catch(() => undefined)
                            }
                        >
                            esticar {apt.id}
                        </button>
                    </div>
                );
            })}
        </div>
    ),
}));

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 5,
            name: 'Rafael Lima',
            type: 'clinic',
            role: 'physiotherapist',
        },
        token: 'fake',
    }),
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

const NOTICE = 'Avisar o paciente?';

function inDays(days: number, hour: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date;
}

function appointment(overrides: Partial<Appointment> = {}): Appointment {
    return {
        id: '80',
        patientId: '3',
        patientName: 'João Pereira',
        patientEmail: 'joao@example.test',
        patientPhone: '(11) 98888-7777',
        clinicUserId: '5',
        clinicUserName: 'Rafael Lima',
        title: null,
        description: null,
        startsAt: inDays(3, 14).toISOString(),
        endsAt: inDays(3, 15).toISOString(),
        status: 'scheduled',
        location: 'Clínica',
        source: 'system',
        ...overrides,
    };
}

function renderAgenda() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/clinica/agenda']}>
                <AgendaPage />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

async function openAppointment(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('button', { name: 'abrir 80' }));
    return screen.findByRole('dialog', { name: 'Consulta' });
}

const NOTICE_TEXT = {
    rescheduled: {
        description: 'A consulta mudou de horário.',
        whatsapp: 'Sua consulta foi remarcada para',
    },
    cancelled: {
        description: 'A consulta foi cancelada.',
        whatsapp: 'foi cancelada.',
    },
} as const;

async function expectNoticeAndSend(
    user: ReturnType<typeof userEvent.setup>,
    kind: keyof typeof NOTICE_TEXT,
) {
    const dialog = await screen.findByRole('dialog', { name: NOTICE });
    expect(
        within(dialog).getByText(NOTICE_TEXT[kind].description, {
            exact: false,
        }),
    ).toBeInTheDocument();

    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await user.click(within(dialog).getByRole('button', { name: 'Abrir' }));
    const opened = new URL(String(open.mock.calls[0]?.[0]));
    expect(opened.searchParams.get('text')).toContain(
        NOTICE_TEXT[kind].whatsapp,
    );
    open.mockRestore();

    await user.click(within(dialog).getByRole('button', { name: 'Enviar' }));
    await waitFor(() =>
        expect(appointmentsRepo.sendEmail).toHaveBeenCalledWith('80', kind),
    );
}

beforeEach(() => {
    appointmentsRepo.getClinicUsers.mockResolvedValue([
        { id: '5', name: 'Rafael Lima' },
    ]);
    appointmentsRepo.getAgendaPatients.mockResolvedValue([
        { id: '3', name: 'João Pereira' },
    ]);
    appointmentsRepo.patientHistory.mockResolvedValue(null);
    appointmentsRepo.sendEmail.mockResolvedValue(undefined);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('agenda: avisar o paciente ao remarcar', () => {
    it('arrastar uma consulta com paciente para outro dia abre o aviso de remarcada', async () => {
        appointmentsRepo.list.mockResolvedValue([appointment()]);
        appointmentsRepo.update.mockImplementation(
            (_id: string, dto: { startsAt: string; endsAt: string }) =>
                Promise.resolve(
                    appointment({ startsAt: dto.startsAt, endsAt: dto.endsAt }),
                ),
        );
        const user = userEvent.setup();

        renderAgenda();
        await user.click(
            await screen.findByRole('button', { name: 'arrastar 80' }),
        );

        await expectNoticeAndSend(user, 'rescheduled');
    });

    it('esticar a consulta também abre o aviso de remarcada', async () => {
        appointmentsRepo.list.mockResolvedValue([appointment()]);
        appointmentsRepo.update.mockImplementation(
            (_id: string, dto: { startsAt: string; endsAt: string }) =>
                Promise.resolve(
                    appointment({ startsAt: dto.startsAt, endsAt: dto.endsAt }),
                ),
        );
        const user = userEvent.setup();

        renderAgenda();
        await user.click(
            await screen.findByRole('button', { name: 'esticar 80' }),
        );

        await expectNoticeAndSend(user, 'rescheduled');
    });

    it('arrastar uma consulta sem paciente não abre o aviso', async () => {
        const noPatient = appointment({
            patientId: '',
            patientName: '',
            patientEmail: null,
            patientPhone: null,
            source: 'google',
        });
        appointmentsRepo.list.mockResolvedValue([noPatient]);
        appointmentsRepo.update.mockImplementation(
            (_id: string, dto: { startsAt: string; endsAt: string }) =>
                Promise.resolve({
                    ...noPatient,
                    startsAt: dto.startsAt,
                    endsAt: dto.endsAt,
                }),
        );
        const user = userEvent.setup();

        renderAgenda();
        await user.click(
            await screen.findByRole('button', { name: 'arrastar 80' }),
        );

        await waitFor(() =>
            expect(appointmentsRepo.update).toHaveBeenCalledTimes(1),
        );
        expect(
            screen.queryByRole('dialog', { name: NOTICE }),
        ).not.toBeInTheDocument();
    });

    it('salvar a edição só com a observação nova não abre o aviso', async () => {
        appointmentsRepo.list.mockResolvedValue([appointment()]);
        appointmentsRepo.update.mockResolvedValue(
            appointment({ description: 'Trazer exames' }),
        );
        const user = userEvent.setup();

        renderAgenda();
        const consulta = await openAppointment(user);
        await user.click(within(consulta).getByRole('tab', { name: 'Editar' }));
        await user.type(
            within(consulta).getByLabelText('Observações'),
            'Trazer exames',
        );
        await user.click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        await waitFor(() =>
            expect(appointmentsRepo.update).toHaveBeenCalledTimes(1),
        );
        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', { name: 'Consulta' }),
            ).not.toBeInTheDocument(),
        );
        expect(
            screen.queryByRole('dialog', { name: NOTICE }),
        ).not.toBeInTheDocument();
    });

    it('salvar a edição com horário novo abre o aviso de remarcada', async () => {
        appointmentsRepo.list.mockResolvedValue([appointment()]);
        appointmentsRepo.update.mockResolvedValue(
            appointment({
                startsAt: inDays(4, 9).toISOString(),
                endsAt: inDays(4, 10).toISOString(),
            }),
        );
        const user = userEvent.setup();

        renderAgenda();
        const consulta = await openAppointment(user);
        await user.click(within(consulta).getByRole('tab', { name: 'Editar' }));
        await user.click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        await expectNoticeAndSend(user, 'rescheduled');
    });

    it.each(['completed', 'no_show'] as const)(
        'mudar o horário de uma consulta %s pelo modal não abre o aviso',
        async (status) => {
            const past = appointment({
                status,
                startsAt: inDays(-1, 14).toISOString(),
                endsAt: inDays(-1, 15).toISOString(),
            });
            appointmentsRepo.list.mockResolvedValue([past]);
            appointmentsRepo.update.mockResolvedValue({
                ...past,
                startsAt: inDays(-1, 16).toISOString(),
                endsAt: inDays(-1, 17).toISOString(),
            });
            const user = userEvent.setup();

            renderAgenda();
            const consulta = await openAppointment(user);
            await user.click(
                within(consulta).getByRole('tab', { name: 'Editar' }),
            );
            await user.click(
                screen.getByRole('button', { name: 'Salvar alterações' }),
            );

            await waitFor(() =>
                expect(appointmentsRepo.update).toHaveBeenCalledTimes(1),
            );
            await waitFor(() =>
                expect(
                    screen.queryByRole('dialog', { name: 'Consulta' }),
                ).not.toBeInTheDocument(),
            );
            expect(
                screen.queryByRole('dialog', { name: NOTICE }),
            ).not.toBeInTheDocument();
        },
    );
});

describe('agenda: avisar o paciente ao cancelar', () => {
    it('cancelar uma consulta com paciente abre o aviso de cancelada', async () => {
        appointmentsRepo.list.mockResolvedValue([appointment()]);
        appointmentsRepo.cancel.mockResolvedValue(
            appointment({ status: 'cancelled' }),
        );
        const user = userEvent.setup();

        renderAgenda();
        const consulta = await openAppointment(user);
        await user.click(
            within(consulta).getByRole('button', { name: 'Cancelar consulta' }),
        );

        await screen.findByRole('dialog', { name: NOTICE });
        expect(
            screen.queryByRole('dialog', { name: 'Consulta' }),
        ).not.toBeInTheDocument();
        await expectNoticeAndSend(user, 'cancelled');
    });

    it.each([
        ['Concluída', 'completed'],
        ['Falta', 'no_show'],
    ] as const)('marcar como %s não abre o aviso', async (label, status) => {
        const past = appointment({
            startsAt: inDays(-1, 14).toISOString(),
            endsAt: inDays(-1, 15).toISOString(),
        });
        appointmentsRepo.list.mockResolvedValue([past]);
        appointmentsRepo.updateStatus.mockImplementation(
            (_id: string, next: Appointment['status']) =>
                Promise.resolve({ ...past, status: next }),
        );
        const user = userEvent.setup();

        renderAgenda();
        const consulta = await openAppointment(user);
        await user.click(within(consulta).getByRole('button', { name: label }));

        await waitFor(() =>
            expect(appointmentsRepo.updateStatus).toHaveBeenCalledWith(
                '80',
                status,
            ),
        );
        expect(
            screen.queryByRole('dialog', { name: NOTICE }),
        ).not.toBeInTheDocument();
        expect(appointmentsRepo.sendEmail).not.toHaveBeenCalled();
    });
});
