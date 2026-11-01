import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FinancialTransaction } from '@/domain/clinic/finance';
import { TransactionAttachments } from '@/pages/clinic/finances/TransactionAttachments';
import { TransactionModal } from '@/pages/clinic/finances/TransactionModal';

const api = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
}));

vi.mock('@/infrastructure/api/client', () => ({ apiClient: api }));

const BASE = '/clinic/finances/transactions/42/attachments';

let stored: Array<Record<string, unknown>> = [];

function attachment(id: number, name: string, mime = 'application/pdf') {
    return {
        id,
        financial_transaction_id: 42,
        original_name: name,
        mime_type: mime,
        size: 250_000,
        created_at: '2026-10-15T12:00:00Z',
    };
}

function file(name: string, size = 1000, type = 'application/pdf') {
    const f = new File(['x'], name, { type });
    Object.defineProperty(f, 'size', { value: size });
    return f;
}

function validation(errors: Record<string, string[]>) {
    return Object.assign(new Error('422'), {
        response: { status: 422, data: { message: 'Erro.', errors } },
    });
}

function renderArea() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    render(
        <QueryClientProvider client={client}>
            <TransactionAttachments transactionId="42" />
        </QueryClientProvider>,
    );
    return { invalidate };
}

const area = () => screen.getByRole('region', { name: /Comprovantes/ });

beforeEach(() => {
    stored = [
        attachment(1, 'recibo.pdf'),
        attachment(2, 'foto.jpg', 'image/jpeg'),
    ];
    api.get.mockReset();
    api.post.mockReset();
    api.delete.mockReset();
    api.get.mockImplementation(async (url: string) => {
        if (url === BASE) return { data: { data: stored } };
        if (url === `${BASE}/1/url`)
            return {
                data: {
                    data: {
                        url: 'https://r2.example/assinado?X-Amz-Signature=abc',
                        expires_at: '2026-10-15T12:05:00Z',
                    },
                },
            };
        if (url === '/clinic/finances/categories')
            return { data: { data: [] } };
        if (url === '/clinic/finances/reports/category-breakdown')
            return { data: { data: [] } };
        throw new Error(`GET inesperado: ${url}`);
    });
});

afterEach(() => vi.restoreAllMocks());

describe('Comprovantes do lançamento', () => {
    it('lista os comprovantes com a contagem de 5', async () => {
        renderArea();

        expect(await screen.findByText('recibo.pdf')).toBeInTheDocument();
        expect(screen.getByText('foto.jpg')).toBeInTheDocument();
        expect(within(area()).getByText('2 de 5')).toBeInTheDocument();
    });

    it('envia os arquivos escolhidos em files[] e recarrega Finanças', async () => {
        api.post.mockImplementation(async () => {
            stored = [...stored, attachment(3, 'nota.png', 'image/png')];
            return { data: { data: [attachment(3, 'nota.png', 'image/png')] } };
        });
        const user = userEvent.setup();
        const { invalidate } = renderArea();
        await screen.findByText('recibo.pdf');

        await user.upload(
            screen.getByLabelText('Enviar arquivo'),
            file('nota.png', 2000, 'image/png'),
        );

        await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
        const [url, body] = api.post.mock.calls[0];
        expect(url).toBe(BASE);
        expect((body as FormData).getAll('files[]')).toHaveLength(1);
        expect(((body as FormData).get('files[]') as File).name).toBe(
            'nota.png',
        );
        await waitFor(() =>
            expect(invalidate).toHaveBeenCalledWith({ queryKey: ['finance'] }),
        );
        expect(await screen.findByText('nota.png')).toBeInTheDocument();
    });

    it('no celular há o botão de tirar foto, que abre a câmera', async () => {
        renderArea();
        await screen.findByText('recibo.pdf');

        const camera = screen.getByLabelText('Tirar foto');
        expect(camera).toHaveAttribute('capture', 'environment');
        expect(camera).toHaveAttribute('accept', 'image/*');
    });

    it('recusa na hora o tipo errado e o arquivo de mais de 10 MB, sem enviar', async () => {
        const user = userEvent.setup({ applyAccept: false });
        renderArea();
        await screen.findByText('recibo.pdf');

        await user.upload(screen.getByLabelText('Enviar arquivo'), [
            file('planilha.xlsx', 100, 'application/vnd.ms-excel'),
            file('grande.pdf', 10 * 1024 * 1024 + 1),
        ]);

        const alert = await within(area()).findByRole('alert');
        expect(alert).toHaveTextContent(
            '“planilha.xlsx” não é JPG, PNG, WEBP, HEIC ou PDF.',
        );
        expect(alert).toHaveTextContent('“grande.pdf” passa de 10 MB.');
        expect(api.post).not.toHaveBeenCalled();
    });

    it('com 5 comprovantes, esconde o envio e mostra o limite', async () => {
        stored = [1, 2, 3, 4, 5].map((i) => attachment(i, `r${i}.pdf`));
        renderArea();

        expect(await screen.findByText('r5.pdf')).toBeInTheDocument();
        expect(within(area()).getByText('5 de 5')).toBeInTheDocument();
        expect(
            within(area()).getByText(/Limite de 5 comprovantes/),
        ).toBeInTheDocument();
        expect(screen.queryByLabelText('Enviar arquivo')).toBeNull();
    });

    it('mostra a mensagem do servidor quando ele recusa (422)', async () => {
        api.post.mockRejectedValue(
            validation({
                files: [
                    'Cada lançamento aceita até 5 comprovantes. Dá para enviar só mais 1.',
                ],
            }),
        );
        const user = userEvent.setup();
        renderArea();
        await screen.findByText('recibo.pdf');

        await user.upload(
            screen.getByLabelText('Enviar arquivo'),
            file('a.pdf'),
        );

        expect(await within(area()).findByRole('alert')).toHaveTextContent(
            'Dá para enviar só mais 1.',
        );
    });

    it('abre o comprovante pelo link assinado numa aba nova', async () => {
        const tab = {
            opener: {},
            location: { href: '' },
            close: vi.fn(),
        };
        const open = vi
            .spyOn(window, 'open')
            .mockReturnValue(tab as unknown as Window);
        const user = userEvent.setup();
        renderArea();

        await user.click(
            await screen.findByRole('button', { name: 'Abrir recibo.pdf' }),
        );

        expect(open).toHaveBeenCalledWith('', '_blank');
        await waitFor(() =>
            expect(tab.location.href).toBe(
                'https://r2.example/assinado?X-Amz-Signature=abc',
            ),
        );
        expect(tab.opener).toBeNull();
        expect(api.get).toHaveBeenCalledWith(`${BASE}/1/url`);
    });

    it('remove depois de confirmar', async () => {
        api.delete.mockImplementation(async () => {
            stored = stored.filter((a) => a.id !== 1);
            return { data: null };
        });
        const user = userEvent.setup();
        renderArea();

        await user.click(
            await screen.findByRole('button', { name: 'Remover recibo.pdf' }),
        );
        expect(api.delete).not.toHaveBeenCalled();
        await user.click(
            screen.getByRole('button', {
                name: 'Confirmar remover recibo.pdf',
            }),
        );

        await waitFor(() =>
            expect(api.delete).toHaveBeenCalledWith(`${BASE}/1`),
        );
        await waitFor(() =>
            expect(screen.queryByText('recibo.pdf')).toBeNull(),
        );
        expect(screen.getByText('foto.jpg')).toBeInTheDocument();
    });
});

describe('Comprovantes no modal de lançamento', () => {
    const editing: FinancialTransaction = {
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
    };

    function renderModal(
        draft: Parameters<typeof TransactionModal>[0]['draft'],
    ) {
        const client = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        render(
            <QueryClientProvider client={client}>
                <TransactionModal
                    draft={draft}
                    period="2026-10"
                    onClose={vi.fn()}
                />
            </QueryClientProvider>,
        );
    }

    it('ao editar, mostra os comprovantes do lançamento', async () => {
        renderModal({ type: 'entrada', editing });

        expect(await screen.findByText('recibo.pdf')).toBeInTheDocument();
    });

    it('no lançamento novo, avisa que o comprovante entra depois de lançar', async () => {
        renderModal({ type: 'entrada' });

        expect(
            await screen.findByText(
                /Lance primeiro; depois, abra o lançamento para anexar/,
            ),
        ).toBeInTheDocument();
        expect(api.get).not.toHaveBeenCalledWith(BASE);
    });
});
