import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AgendaView } from '@/components/clinic/agenda/AgendaView';

const completeConnection = vi.fn();
const getStatus = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('@/infrastructure/repositories/api-google-calendar', () => ({
    apiGoogleCalendarRepository: {
        getStatus: (...args: unknown[]) => getStatus(...args),
        completeConnection: (...args: unknown[]) => completeConnection(...args),
        getAuthUrl: vi.fn(),
        pullNow: vi.fn(),
        disconnect: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        error: (...args: unknown[]) => toastError(...args),
    },
}));

let connected = false;

function renderAgenda(search: string) {
    window.history.pushState({}, '', `/clinica/agenda${search}`);
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <AgendaView
                appointments={[]}
                clinicUsers={[]}
                showUserFilter={false}
                view="timeGridWeek"
                onViewChange={vi.fn()}
                showWeekends
                onShowWeekendsChange={vi.fn()}
                calendarKey="k"
                onEventClick={vi.fn()}
                onDateClick={vi.fn()}
                onEventDrop={vi.fn()}
                onEventResize={vi.fn()}
                onNewConsulta={vi.fn()}
            />
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    connected = false;
    getStatus.mockImplementation(() =>
        Promise.resolve({
            connected,
            googleCalendarId: connected ? 'primary' : null,
            connectedAt: null,
        }),
    );
});

afterEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
});

describe('agenda: volta do Google', () => {
    it('com ?google_ticket= conclui pela API, avisa, limpa a URL e mostra conectado', async () => {
        completeConnection.mockImplementation(() => {
            connected = true;
            return Promise.resolve();
        });

        renderAgenda('?google_ticket=ticket-do-usuario');

        await vi.waitFor(() =>
            expect(toastSuccess).toHaveBeenCalledWith(
                'Google Calendar conectado com sucesso!',
            ),
        );
        expect(completeConnection).toHaveBeenCalledTimes(1);
        expect(completeConnection).toHaveBeenCalledWith('ticket-do-usuario');
        expect(window.location.search).toBe('');
        expect(
            (
                await screen.findAllByRole('button', {
                    name: /Desconectar Google/,
                })
            ).length,
        ).toBeGreaterThan(0);
    });

    it('ticket recusado pelo servidor avisa o erro e continua desconectado', async () => {
        completeConnection.mockRejectedValue(new Error('403'));

        renderAgenda('?google_ticket=ticket-de-outro-usuario');

        await vi.waitFor(() =>
            expect(toastError).toHaveBeenCalledWith(
                'Não foi possível conectar o Google Calendar.',
            ),
        );
        expect(toastSuccess).not.toHaveBeenCalled();
        expect(window.location.search).toBe('');
        expect(
            (
                await screen.findAllByRole('button', {
                    name: /Conectar com Google/,
                })
            ).length,
        ).toBeGreaterThan(0);
    });

    it('?google=error avisa o erro sem chamar a API', async () => {
        renderAgenda('?google=error');

        await vi.waitFor(() =>
            expect(toastError).toHaveBeenCalledWith(
                'Não foi possível conectar o Google Calendar.',
            ),
        );
        expect(completeConnection).not.toHaveBeenCalled();
        expect(window.location.search).toBe('');
    });

    it('?google=connected na URL não avisa conexão nem chama a API', async () => {
        renderAgenda('?google=connected&patientId=5');

        await screen.findAllByRole('button', { name: /Conectar com Google/ });
        expect(toastSuccess).not.toHaveBeenCalled();
        expect(completeConnection).not.toHaveBeenCalled();
        expect(window.location.search).toBe('?patientId=5');
    });

    it('sem nada da volta do Google não chama a API nem mexe na URL', async () => {
        renderAgenda('?patientId=5');

        await screen.findAllByRole('button', { name: /Conectar com Google/ });
        expect(completeConnection).not.toHaveBeenCalled();
        expect(toastError).not.toHaveBeenCalled();
        expect(window.location.search).toBe('?patientId=5');
    });
});
