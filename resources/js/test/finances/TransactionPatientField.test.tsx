import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FinancialTransaction } from '@/domain/clinic/finance';
import { TransactionRow } from '@/pages/clinic/finances/finance-parts';
import { PendingList } from '@/pages/clinic/finances/PendingList';
import {
    TransactionModal,
    type Draft,
} from '@/pages/clinic/finances/TransactionModal';

const api = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
}));

vi.mock('@/infrastructure/api/client', () => ({ apiClient: api }));

const CATEGORIES = [
    {
        id: 1,
        name: 'Sessões',
        type: 'entrada',
        origin: 'system',
        active: true,
        display_order: 1,
    },
    {
        id: 10,
        name: 'Aluguel',
        type: 'saida',
        origin: 'system',
        active: true,
        display_order: 1,
    },
];

const PATIENTS = [
    { id: 7, name: 'Maria Souza' },
    { id: 8, name: 'Mariana Lima' },
];

const APPOINTMENTS: Record<number, unknown[]> = {
    7: [
        {
            id: 30,
            starts_at: '2026-10-15T09:00:00-03:00',
            title: 'Sessão de RPG',
        },
        {
            id: 31,
            starts_at: '2026-10-01T14:30:00-03:00',
            title: 'Avaliação inicial',
        },
    ],
};

function existing(
    overrides: Partial<FinancialTransaction> = {},
): FinancialTransaction {
    return {
        id: '42',
        date: '2026-10-10',
        description: 'Sessão — João',
        category: {
            id: '1',
            name: 'Sessões',
            type: 'entrada',
            origin: 'system',
            active: true,
            displayOrder: 1,
        },
        type: 'entrada',
        status: 'recebido',
        paymentMethod: 'pix',
        grossAmount: 150,
        feeAmount: 0,
        netAmount: 150,
        notes: null,
        ...overrides,
    };
}

function saved(overrides: Record<string, unknown> = {}) {
    return {
        id: 99,
        date: '2026-10-15',
        description: 'Sessão',
        category: CATEGORIES[0],
        type: 'entrada',
        status: 'recebido',
        payment_method: 'pix',
        gross_amount: '100.00',
        fee_amount: '0.00',
        net_amount: '100.00',
        ...overrides,
    };
}

function renderModal(draft: Draft, onClose = vi.fn()) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <TransactionModal
                draft={draft}
                period="2026-10"
                onClose={onClose}
            />
        </QueryClientProvider>,
    );
    return { onClose };
}

function validation(errors: Record<string, string[]>) {
    return Object.assign(new Error('422'), {
        response: { status: 422, data: { message: 'Erro.', errors } },
    });
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15, 12, 0));
    api.get.mockReset();
    api.post.mockReset();
    api.put.mockReset();
    api.get.mockImplementation(
        async (url: string, config?: { params?: Record<string, unknown> }) => {
            if (url === '/clinic/finances/categories') {
                const type = config?.params?.type;
                return {
                    data: {
                        data: CATEGORIES.filter(
                            (c) => !type || c.type === type,
                        ),
                    },
                };
            }
            if (url === '/clinic/finances/reports/category-breakdown') {
                return { data: { data: [] } };
            }
            if (url === '/clinic/finances/patients') {
                const q = String(config?.params?.q ?? '').toLowerCase();
                return {
                    data: {
                        data: PATIENTS.filter((p) =>
                            p.name.toLowerCase().includes(q),
                        ),
                    },
                };
            }
            const m = url.match(
                /^\/clinic\/finances\/patients\/(\d+)\/appointments$/,
            );
            if (m) return { data: { data: APPOINTMENTS[Number(m[1])] ?? [] } };
            if (url === '/clinic/finances/transactions') {
                return {
                    data: {
                        data: [
                            saved({
                                status: 'pendente',
                                description: 'Pacote de 10',
                                patient: { id: 7, name: 'Maria Souza' },
                                appointment: null,
                            }),
                        ],
                        meta: { page: 1, perPage: 25, total: 1, netTotal: 100 },
                    },
                };
            }
            throw new Error(`GET inesperado: ${url}`);
        },
    );
});

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('Valor'), '10000');
    await user.type(screen.getByLabelText('Descrição'), 'Sessão');
    await user.click(screen.getByLabelText('Todas as categorias'));
    await user.click(await screen.findByRole('option', { name: 'Sessões' }));
}

async function choosePatient(
    user: ReturnType<typeof userEvent.setup>,
    term: string,
    name: string,
) {
    await user.click(screen.getByRole('button', { name: /^Paciente/ }));
    await user.type(screen.getByLabelText('Procurar paciente'), term);
    await user.click(await screen.findByRole('option', { name }));
}

describe('Paciente e atendimento no lançamento de entrada', () => {
    it('escolhe o paciente pela busca no servidor e depois um atendimento dele', async () => {
        api.post.mockResolvedValue({ data: { data: saved() } });
        const user = userEvent.setup();
        const { onClose } = renderModal({ type: 'entrada' });

        await fillBasics(user);
        expect(
            screen.queryByRole('button', { name: /^Atendimento na agenda/ }),
        ).not.toBeInTheDocument();

        await choosePatient(user, 'mari', 'Maria Souza');
        expect(api.get).toHaveBeenCalledWith('/clinic/finances/patients', {
            params: { q: 'mari' },
        });
        expect(
            screen.getByRole('button', { name: /^Paciente/ }),
        ).toHaveTextContent('Maria Souza');

        await user.click(
            await screen.findByRole('button', {
                name: /^Atendimento na agenda/,
            }),
        );
        await user.click(
            await screen.findByRole('option', {
                name: /15\/10\/2026 09:00 · Sessão de RPG/,
            }),
        );

        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        await waitFor(() =>
            expect(api.post).toHaveBeenCalledWith(
                '/clinic/finances/transactions',
                expect.objectContaining({ patient_id: 7, appointment_id: 30 }),
            ),
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('sem paciente, a entrada não manda os campos; na saída o seletor não aparece', async () => {
        api.post.mockResolvedValue({ data: { data: saved() } });
        const user = userEvent.setup();
        renderModal({ type: 'entrada' });

        expect(
            screen.getByRole('button', { name: /^Paciente/ }),
        ).toBeInTheDocument();
        await user.click(screen.getByRole('radio', { name: /Saída/ }));
        expect(
            screen.queryByRole('button', { name: /^Paciente/ }),
        ).not.toBeInTheDocument();

        await user.click(screen.getByRole('radio', { name: /Entrada/ }));
        await fillBasics(user);
        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
        const body = api.post.mock.calls[0][1];
        expect(body).not.toHaveProperty('patient_id');
        expect(body).not.toHaveProperty('appointment_id');
    });

    it('editando, mostra o paciente; tirar o paciente manda null', async () => {
        api.put.mockResolvedValue({ data: { data: saved({ id: 42 }) } });
        const user = userEvent.setup();
        renderModal({
            type: 'entrada',
            editing: existing({
                patient: { id: '7', name: 'Maria Souza' },
                appointment: {
                    id: '30',
                    startsAt: '2026-10-15T09:00:00-03:00',
                },
            }),
        });

        expect(
            screen.getByRole('button', { name: /^Paciente/ }),
        ).toHaveTextContent('Maria Souza');
        expect(
            await screen.findByRole('button', {
                name: /^Atendimento na agenda/,
            }),
        ).toHaveTextContent(/15\/10\/2026 09:00/);

        await user.click(
            screen.getByRole('button', { name: 'Tirar paciente' }),
        );
        expect(
            screen.queryByRole('button', { name: /^Atendimento na agenda/ }),
        ).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        await waitFor(() =>
            expect(api.put).toHaveBeenCalledWith(
                '/clinic/finances/transactions/42',
                expect.objectContaining({
                    patient_id: null,
                    appointment_id: null,
                }),
            ),
        );
    });

    it('o 422 do paciente aparece embaixo do campo', async () => {
        api.post.mockRejectedValue(
            validation({ patient_id: ['Paciente não encontrado.'] }),
        );
        const user = userEvent.setup();
        renderModal({ type: 'entrada' });

        await fillBasics(user);
        await choosePatient(user, 'mari', 'Mariana Lima');
        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        expect(
            await screen.findByText('Paciente não encontrado.'),
        ).toBeInTheDocument();
    });
});

describe('Nome do paciente na lista', () => {
    it('a linha do lançamento mostra quem pagou', () => {
        render(
            <TransactionRow
                t={existing({ patient: { id: '7', name: 'Maria Souza' } })}
                hidden={false}
                onOpen={vi.fn()}
            />,
        );
        const row = screen.getByRole('button');
        expect(within(row).getByText(/Maria Souza/)).toBeInTheDocument();
    });

    it('a pendência mostra quem vai pagar', async () => {
        const client = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        render(
            <QueryClientProvider client={client}>
                <PendingList
                    type="entrada"
                    period="2026-10"
                    todayKey="2026-10-15"
                    hidden={false}
                    onOpen={vi.fn()}
                />
            </QueryClientProvider>,
        );
        const item = await screen.findByRole('button', {
            name: /Pacote de 10/,
        });
        expect(item).toHaveTextContent('Maria Souza');
    });
});
