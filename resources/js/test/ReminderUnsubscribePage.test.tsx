import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type AxiosResponse } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import ReminderUnsubscribePage from '@/pages/patient/reminders/ReminderUnsubscribePage';

vi.mock('@/infrastructure/api/client', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/infrastructure/api/client')>()),
    apiClient: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: false,
        guard: null,
        user: null,
        isLoading: false,
        logout: vi.fn(),
    }),
}));

const TOKEN = `12.345.${'a1'.repeat(32)}`;

const mockPost = vi.mocked(apiClient.post);
const mockGet = vi.mocked(apiClient.get);

function renderPage(search: string) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[`/lembretes/sair${search}`]}>
                <Routes>
                    <Route
                        path="/lembretes/sair"
                        element={<ReminderUnsubscribePage />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

function httpError(status: number) {
    return new AxiosError('erro', String(status), undefined, undefined, {
        status,
        data: { message: 'Link inválido.' },
    } as AxiosResponse);
}

const PATIENT_DATA = /@|Ana|CPF|\(\d{2}\)/;

afterEach(() => {
    vi.clearAllMocks();
});

describe('ReminderUnsubscribePage', () => {
    it('abrir a página não descadastra; só o botão faz o POST', async () => {
        const user = userEvent.setup();
        mockPost.mockResolvedValue({ data: { data: { unsubscribed: true } } });

        renderPage(`?token=${TOKEN}`);

        expect(
            screen.getByRole('heading', {
                name: 'Não quer mais receber lembretes de consulta por e-mail?',
            }),
        ).toBeInTheDocument();
        expect(mockPost).not.toHaveBeenCalled();
        expect(mockGet).not.toHaveBeenCalled();

        await user.click(
            screen.getByRole('button', {
                name: 'Não quero mais receber lembretes',
            }),
        );

        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith('/email/reminders/unsubscribe', {
            token: TOKEN,
        });
    });

    it('mostra a confirmação depois que o pedido dá certo', async () => {
        const user = userEvent.setup();
        mockPost.mockResolvedValue({ data: { data: { unsubscribed: true } } });

        renderPage(`?token=${TOKEN}`);
        await user.click(
            screen.getByRole('button', {
                name: 'Não quero mais receber lembretes',
            }),
        );

        expect(
            await screen.findByRole('heading', { name: 'Pronto.' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Você não vai mais receber lembretes. Para voltar a receber, fale com a clínica.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', {
                name: 'Não quero mais receber lembretes',
            }),
        ).not.toBeInTheDocument();
    });

    it('mostra "Link inválido" quando o servidor recusa o token, sem dado do paciente', async () => {
        const user = userEvent.setup();
        mockPost.mockRejectedValue(httpError(404));

        const { container } = renderPage(`?token=${TOKEN}`);
        await user.click(
            screen.getByRole('button', {
                name: 'Não quero mais receber lembretes',
            }),
        );

        expect(await screen.findByText('Link inválido')).toBeInTheDocument();
        expect(container.textContent).not.toMatch(PATIENT_DATA);
    });

    it('mostra "Link inválido" sem chamar o servidor quando falta o token ou ele está malformado', async () => {
        const user = userEvent.setup();

        renderPage('');
        expect(await screen.findByText('Link inválido')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', {
                name: 'Não quero mais receber lembretes',
            }),
        ).not.toBeInTheDocument();

        renderPage('?token=abc');
        await user.click(
            screen.getByRole('button', {
                name: 'Não quero mais receber lembretes',
            }),
        );
        expect(await screen.findAllByText('Link inválido')).toHaveLength(2);
        expect(mockPost).not.toHaveBeenCalled();
    });

    it('avisa do erro de conexão e deixa tentar de novo', async () => {
        const user = userEvent.setup();
        mockPost
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockResolvedValueOnce({ data: { data: { unsubscribed: true } } });

        renderPage(`?token=${TOKEN}`);
        const button = screen.getByRole('button', {
            name: 'Não quero mais receber lembretes',
        });
        await user.click(button);

        expect(
            await screen.findByText(
                'Não foi possível concluir. Confira sua conexão e tente de novo.',
            ),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', {
                name: 'Não quero mais receber lembretes',
            }),
        );
        expect(
            await screen.findByRole('heading', { name: 'Pronto.' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Você não vai mais receber lembretes. Para voltar a receber, fale com a clínica.',
            ),
        ).toBeInTheDocument();
    });

    it('com muitas tentativas, pede para aguardar um minuto em vez de culpar a conexão', async () => {
        const user = userEvent.setup();
        mockPost.mockRejectedValue(httpError(429));

        renderPage(`?token=${TOKEN}`);
        await user.click(
            screen.getByRole('button', {
                name: 'Não quero mais receber lembretes',
            }),
        );

        expect(
            await screen.findByText(
                'Muitas tentativas. Aguarde um minuto e tente de novo.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(/Confira sua conexão/),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: 'Não quero mais receber lembretes',
            }),
        ).toBeEnabled();
    });
});
