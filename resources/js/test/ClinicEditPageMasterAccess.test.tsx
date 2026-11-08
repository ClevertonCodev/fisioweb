import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Clinic, MasterAccess } from '@/domain/admin';
import ClinicEditPage from '@/pages/admin/clinic/ClinicEditPage';
import { routerFutureFlags } from '@/test/browser-router';

const getById = vi.fn();
const generateFirstAccessLink = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    apiClinicsRepository: {
        getById: (...args: unknown[]) => getById(...args),
        getPlansOptions: () => Promise.resolve([]),
        generateFirstAccessLink: (...args: unknown[]) =>
            generateFirstAccessLink(...args),
    },
}));

vi.mock('@/components/admin/AdminLayout', () => ({
    AdminLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

beforeEach(() => {
    vi.stubEnv('TZ', 'America/Sao_Paulo');
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
});

function makeClinic(masterAccess: MasterAccess | null): Clinic {
    return {
        id: 12,
        name: 'Clínica Exemplo',
        document: '11222333000181',
        typePerson: 'PJ',
        status: 1,
        email: 'contato@clinica.test',
        phone: null,
        slug: 'clinica-exemplo',
        zipCode: null,
        address: null,
        number: null,
        city: null,
        state: null,
        planId: null,
        planName: null,
        createdAt: '2026-11-01T10:00:00Z',
        masterAccess,
    };
}

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={['/admin/clinicas/12/editar']}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/admin/clinicas/:id/editar"
                        element={<ClinicEditPage />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
    return { queryClient };
}

const clinicQueryKey = ['admin', 'clinic', 12];
const generatedLink = {
    url: 'https://app.test/clinica/primeiro-acesso?token=abc123',
    createdAt: '2026-11-08T14:00:00-03:00',
};

async function generateLink(buttonName = 'Gerar link de primeiro acesso') {
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: buttonName }));
    await screen.findByRole('textbox', { name: /^Link de/ });
    return user;
}

describe('ClinicEditPage · Acesso do mestre', () => {
    it('mostra que o mestre ainda não definiu a senha e a data do último link', async () => {
        getById.mockResolvedValueOnce(
            makeClinic({
                passwordDefined: false,
                lastLinkCreatedAt: '2026-11-08T13:45:00-03:00',
            }),
        );

        renderPage();

        const section = await screen.findByRole('region', {
            name: 'Acesso do mestre',
        });
        expect(section).toHaveTextContent('Aguardando o primeiro acesso');
        expect(section).toHaveTextContent(
            'Último link gerado em 08/11/2026 às 13:45',
        );
        expect(
            screen.getByRole('button', {
                name: 'Gerar link de primeiro acesso',
            }),
        ).toBeInTheDocument();
    });

    it('mostra a senha definida e oferece o link de nova senha', async () => {
        getById.mockResolvedValueOnce(
            makeClinic({ passwordDefined: true, lastLinkCreatedAt: null }),
        );

        renderPage();

        const section = await screen.findByRole('region', {
            name: 'Acesso do mestre',
        });
        expect(section).toHaveTextContent('Senha definida');
        expect(section).not.toHaveTextContent('Último link gerado');
        expect(
            screen.getByRole('button', { name: 'Gerar link de nova senha' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', {
                name: 'Gerar link de primeiro acesso',
            }),
        ).not.toBeInTheDocument();
    });

    it('esconde o bloco quando a API não informa o estado do mestre', async () => {
        getById.mockResolvedValueOnce(makeClinic(null));

        renderPage();

        await screen.findByRole('heading', { name: 'Editar Clínica' });
        expect(
            screen.queryByRole('region', { name: 'Acesso do mestre' }),
        ).not.toBeInTheDocument();
    });

    it('gera o link, mostra uma vez com o aviso e copia com um clique', async () => {
        const user = userEvent.setup();
        getById.mockResolvedValue(
            makeClinic({ passwordDefined: false, lastLinkCreatedAt: null }),
        );
        generateFirstAccessLink.mockResolvedValueOnce({
            url: 'https://app.test/clinica/primeiro-acesso?token=abc123',
            createdAt: '2026-11-08T14:00:00-03:00',
        });

        renderPage();

        expect(
            await screen.findByRole('button', {
                name: 'Gerar link de primeiro acesso',
            }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('textbox', { name: 'Link de primeiro acesso' }),
        ).not.toBeInTheDocument();

        await user.click(
            screen.getByRole('button', {
                name: 'Gerar link de primeiro acesso',
            }),
        );

        const link = await screen.findByRole('textbox', {
            name: 'Link de primeiro acesso',
        });
        expect(generateFirstAccessLink).toHaveBeenCalledWith(12);
        expect(link).toHaveValue(
            'https://app.test/clinica/primeiro-acesso?token=abc123',
        );
        expect(
            screen.getByRole('region', { name: 'Acesso do mestre' }),
        ).toHaveTextContent(
            'Copie agora: o link não aparece de novo. Gerar outro link invalida este.',
        );

        await user.click(screen.getByRole('button', { name: 'Copiar link' }));

        await waitFor(async () =>
            expect(await navigator.clipboard.readText()).toBe(
                'https://app.test/clinica/primeiro-acesso?token=abc123',
            ),
        );
        expect(toast.success).toHaveBeenCalledWith('Link copiado.');
    });

    it('mostra o motivo e nenhum link quando a API recusa', async () => {
        const user = userEvent.setup();
        getById.mockResolvedValue(
            makeClinic({ passwordDefined: false, lastLinkCreatedAt: null }),
        );
        generateFirstAccessLink.mockRejectedValueOnce({
            response: {
                status: 422,
                data: { message: 'A clínica não tem um usuário mestre ativo.' },
            },
        });

        renderPage();

        await user.click(
            await screen.findByRole('button', {
                name: 'Gerar link de primeiro acesso',
            }),
        );

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                'A clínica não tem um usuário mestre ativo.',
            ),
        );
        expect(
            screen.queryByRole('textbox', { name: 'Link de primeiro acesso' }),
        ).not.toBeInTheDocument();
    });

    it('mostra a data do link novo sem recarregar a clínica e não sai da tela se o recarregamento falhar', async () => {
        getById.mockResolvedValueOnce(
            makeClinic({ passwordDefined: false, lastLinkCreatedAt: null }),
        );
        getById.mockRejectedValue({ response: { status: 503 } });
        generateFirstAccessLink.mockResolvedValueOnce(generatedLink);

        const { queryClient } = renderPage();
        await generateLink();

        const section = screen.getByRole('region', {
            name: 'Acesso do mestre',
        });
        expect(section).toHaveTextContent(
            'Último link gerado em 08/11/2026 às 14:00',
        );

        await queryClient.refetchQueries({ queryKey: clinicQueryKey });
        await waitFor(() =>
            expect(queryClient.getQueryState(clinicQueryKey)?.status).toBe(
                'error',
            ),
        );

        expect(
            screen.getByRole('textbox', { name: 'Link de primeiro acesso' }),
        ).toHaveValue(generatedLink.url);
        expect(toast.error).not.toHaveBeenCalled();
    });

    it.each([
        [
            'o mestre já usou o link',
            { passwordDefined: true, lastLinkCreatedAt: null },
        ],
        [
            'outro link foi gerado depois',
            {
                passwordDefined: false,
                lastLinkCreatedAt: '2026-11-08T14:05:00-03:00',
            },
        ],
    ])(
        'tira o link da tela quando a clínica recarregada mostra que %s',
        async (_caso, recarregado) => {
            getById.mockResolvedValueOnce(
                makeClinic({ passwordDefined: false, lastLinkCreatedAt: null }),
            );
            getById.mockResolvedValue(makeClinic(recarregado));
            generateFirstAccessLink.mockResolvedValueOnce(generatedLink);

            const { queryClient } = renderPage();
            await generateLink();
            await queryClient.refetchQueries({ queryKey: clinicQueryKey });

            await waitFor(() =>
                expect(
                    screen.queryByRole('textbox', { name: /^Link de/ }),
                ).not.toBeInTheDocument(),
            );
        },
    );

    it('mantém o link quando a clínica recarregada traz o mesmo instante em outro fuso', async () => {
        getById.mockResolvedValueOnce(
            makeClinic({ passwordDefined: false, lastLinkCreatedAt: null }),
        );
        getById.mockResolvedValue(
            makeClinic({
                passwordDefined: false,
                lastLinkCreatedAt: '2026-11-08T17:00:00+00:00',
            }),
        );
        generateFirstAccessLink.mockResolvedValueOnce(generatedLink);

        const { queryClient } = renderPage();
        await generateLink();
        await queryClient.refetchQueries({ queryKey: clinicQueryKey });
        await waitFor(() =>
            expect(
                queryClient.getQueryData<Clinic>(clinicQueryKey)?.masterAccess
                    ?.lastLinkCreatedAt,
            ).toBe('2026-11-08T17:00:00+00:00'),
        );

        expect(
            screen.getByRole('textbox', { name: 'Link de primeiro acesso' }),
        ).toHaveValue(generatedLink.url);
    });

    it('chama de link de nova senha o link do mestre que já tem senha', async () => {
        getById.mockResolvedValueOnce(
            makeClinic({ passwordDefined: true, lastLinkCreatedAt: null }),
        );
        generateFirstAccessLink.mockResolvedValueOnce(generatedLink);

        renderPage();
        await generateLink('Gerar link de nova senha');

        expect(
            screen.getByRole('textbox', { name: 'Link de nova senha' }),
        ).toHaveValue(generatedLink.url);
    });

    it('avisa quando não consegue copiar o link', async () => {
        getById.mockResolvedValue(
            makeClinic({ passwordDefined: false, lastLinkCreatedAt: null }),
        );
        generateFirstAccessLink.mockResolvedValueOnce(generatedLink);

        renderPage();
        const user = await generateLink();
        vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
            new Error('sem permissão'),
        );
        await user.click(screen.getByRole('button', { name: 'Copiar link' }));

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                'Não foi possível copiar o link.',
            ),
        );
        expect(toast.success).not.toHaveBeenCalled();
    });

    it('mantém o link quando uma busca da clínica que já estava em andamento responde depois dele', async () => {
        const user = userEvent.setup();
        getById.mockResolvedValueOnce(
            makeClinic({ passwordDefined: false, lastLinkCreatedAt: null }),
        );
        let resolveStaleFetch: (clinic: Clinic) => void = () => undefined;
        getById.mockReturnValueOnce(
            new Promise<Clinic>((resolve) => {
                resolveStaleFetch = resolve;
            }),
        );
        generateFirstAccessLink.mockResolvedValueOnce(generatedLink);

        const { queryClient } = renderPage();
        const button = await screen.findByRole('button', {
            name: 'Gerar link de primeiro acesso',
        });
        void queryClient.refetchQueries({ queryKey: clinicQueryKey });
        await waitFor(() => expect(getById).toHaveBeenCalledTimes(2));

        await user.click(button);
        await screen.findByRole('textbox', { name: 'Link de primeiro acesso' });

        resolveStaleFetch(
            makeClinic({ passwordDefined: false, lastLinkCreatedAt: null }),
        );
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(
            screen.getByRole('textbox', { name: 'Link de primeiro acesso' }),
        ).toHaveValue(generatedLink.url);
    });
});
