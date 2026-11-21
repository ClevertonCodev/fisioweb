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
        apiGoogleCalendarRepository: {
            getStatus: vi.fn().mockResolvedValue({
                connected: false,
                googleCalendarId: null,
                connectedAt: null,
            }),
            completeConnection: vi.fn(),
            getAuthUrl: vi.fn(),
            pullNow: vi.fn(),
            disconnect: vi.fn(),
        },
    };
});

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

function inDays(days: number, hour: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date;
}

function createdAppointment(overrides: Partial<Appointment> = {}): Appointment {
    return {
        id: '70',
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

function renderAgenda(search = '?patientId=3') {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: '/clinica/agenda',
                        search,
                        state: { openNewAppointment: true },
                    },
                ]}
            >
                <AgendaPage />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

async function scheduleFromNewAppointmentModal() {
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: 'Agendar' });
    await user.click(button);
    return user;
}

beforeEach(() => {
    appointmentsRepo.list.mockResolvedValue([]);
    appointmentsRepo.getClinicUsers.mockResolvedValue([
        { id: '5', name: 'Rafael Lima' },
    ]);
    appointmentsRepo.getAgendaPatients.mockResolvedValue([
        { id: '3', name: 'João Pereira' },
    ]);
    appointmentsRepo.sendEmail.mockResolvedValue(undefined);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('agenda: avisar o paciente ao marcar', () => {
    it('marcar uma consulta com paciente abre "Avisar o paciente?" com e-mail e WhatsApp, sem link', async () => {
        appointmentsRepo.create.mockResolvedValue(createdAppointment());

        renderAgenda();
        await scheduleFromNewAppointmentModal();

        const dialog = await screen.findByRole('dialog', {
            name: 'Avisar o paciente?',
        });
        expect(appointmentsRepo.create).toHaveBeenCalledTimes(1);
        expect(
            within(dialog).getByText('joao@example.test'),
        ).toBeInTheDocument();
        expect(within(dialog).getByText('(11) 98888-7777')).toBeInTheDocument();
        expect(within(dialog).queryByText('Link')).not.toBeInTheDocument();
        expect(
            within(dialog).getByRole('button', { name: 'Não avisar' }),
        ).toBeInTheDocument();
    });

    it('enviar por e-mail chama a API com o tipo "scheduled"', async () => {
        appointmentsRepo.create.mockResolvedValue(createdAppointment());

        renderAgenda();
        const user = await scheduleFromNewAppointmentModal();

        const dialog = await screen.findByRole('dialog', {
            name: 'Avisar o paciente?',
        });
        await user.click(
            within(dialog).getByRole('button', { name: 'Enviar' }),
        );

        await waitFor(() =>
            expect(appointmentsRepo.sendEmail).toHaveBeenCalledWith(
                '70',
                'scheduled',
            ),
        );
    });

    it('"Não avisar" fecha sem chamar a API de e-mail', async () => {
        appointmentsRepo.create.mockResolvedValue(createdAppointment());

        renderAgenda();
        const user = await scheduleFromNewAppointmentModal();

        const dialog = await screen.findByRole('dialog', {
            name: 'Avisar o paciente?',
        });
        await user.click(
            within(dialog).getByRole('button', { name: 'Não avisar' }),
        );

        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', { name: 'Avisar o paciente?' }),
            ).not.toBeInTheDocument(),
        );
        expect(appointmentsRepo.sendEmail).not.toHaveBeenCalled();
    });

    it('marcar uma consulta sem paciente não abre o aviso', async () => {
        appointmentsRepo.create.mockResolvedValue(
            createdAppointment({
                patientId: '',
                patientName: '',
                patientEmail: null,
                patientPhone: null,
            }),
        );

        renderAgenda();
        await scheduleFromNewAppointmentModal();

        await waitFor(() =>
            expect(appointmentsRepo.create).toHaveBeenCalledTimes(1),
        );
        await waitFor(() =>
            expect(
                screen.queryByRole('button', { name: 'Agendar' }),
            ).not.toBeInTheDocument(),
        );
        expect(
            screen.queryByRole('dialog', { name: 'Avisar o paciente?' }),
        ).not.toBeInTheDocument();
    });
});
