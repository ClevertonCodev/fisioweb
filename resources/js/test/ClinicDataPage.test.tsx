import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClinicProfile } from '@/domain/clinic/clinic-profile';
import { ClinicDataPage } from '@/pages/clinic/clinic-data/ClinicDataPage';
import { routerFutureFlags } from '@/test/browser-router';

const getProfile = vi.fn();
const updateProfile = vi.fn();
const lookupCep = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-profile', () => ({
    apiClinicProfileRepository: {
        get: (...args: unknown[]) => getProfile(...args),
        update: (...args: unknown[]) => updateProfile(...args),
    },
}));

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/application/clinic/use-cep-lookup', () => ({
    useCepLookup: () => ({ loading: false, lookup: lookupCep }),
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const authState = {
    user: {
        id: 1,
        name: 'Cleverton',
        role: 'admin' as const,
        mestre: 1 as 0 | 1,
    },
};

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => authState,
}));

function makeProfile(overrides: Partial<ClinicProfile> = {}): ClinicProfile {
    return {
        id: '1',
        name: 'Clínica Exemplo',
        document: '11222333000181',
        typePerson: 'PJ',
        status: 1,
        email: 'contato@clinica.test',
        phone: '11988887777',
        slug: 'clinica-exemplo',
        zipCode: '01310100',
        address: 'Av. Exemplo',
        number: '100',
        city: 'São Paulo',
        state: 'SP',
        planId: 3,
        planName: 'Premium',
        ...overrides,
    };
}

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={['/clinica/dados']}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route path="/clinica/dados" element={<ClinicDataPage />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    authState.user.mestre = 1;
    lookupCep.mockResolvedValue(null);
    getProfile.mockResolvedValue(makeProfile());
    updateProfile.mockImplementation((dto: Record<string, unknown>) =>
        Promise.resolve(makeProfile({ name: String(dto.name ?? '') })),
    );
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('ClinicDataPage', () => {
    it('o mestre edita o nome e salva no perfil da clínica', async () => {
        const user = userEvent.setup();
        renderPage();

        const name = await screen.findByLabelText('Nome da clínica');
        await user.clear(name);
        await user.type(name, 'Clínica Nova');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalledTimes(1);
        });
        expect(updateProfile).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Clínica Nova',
                document: '11222333000181',
                status: 1,
            }),
        );
    });

    it('quem não é mestre só lê os dados', async () => {
        authState.user.mestre = 0;
        renderPage();

        const name = await screen.findByLabelText('Nome da clínica');
        expect(name).toHaveAttribute('readonly');
        expect(
            screen.getByText(
                'Só o usuário mestre da clínica muda estes dados.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Salvar' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('radio', { name: 'Empresa (CNPJ)' }),
        ).toBeDisabled();
    });

    it('Descartar e Salvar começam desabilitados e ligam com mudança', async () => {
        const user = userEvent.setup();
        renderPage();

        await screen.findByLabelText('Nome da clínica');
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Descartar' }),
        ).toBeDisabled();
        expect(screen.getByText('Tudo salvo')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Nome da clínica'), ' X');
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Descartar' })).toBeEnabled();
        expect(screen.getByText('Alterações não salvas')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Descartar' }));
        expect(screen.getByLabelText('Nome da clínica')).toHaveValue(
            'Clínica Exemplo',
        );
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    });

    it('a prévia muda ao digitar e o endereço do link permanece', async () => {
        const user = userEvent.setup();
        renderPage();

        await screen.findByLabelText('Nome da clínica');
        expect(
            screen.getAllByText(/clinica-exemplo\/paciente\/programas/),
        ).toHaveLength(2);

        await user.clear(screen.getByLabelText('Nome da clínica'));
        await user.type(
            screen.getByLabelText('Nome da clínica'),
            'Fisio Centro',
        );
        expect(
            screen.getByText('Fisio Centro', { selector: 'b' }),
        ).toBeInTheDocument();
        expect(
            screen.getAllByText(/clinica-exemplo\/paciente\/programas/),
        ).toHaveLength(2);

        const phone = screen.getByLabelText('Telefone / WhatsApp');
        await user.clear(phone);
        expect(
            screen.getByText(
                'Sem telefone, o PDF do programa sai sem contato da clínica.',
            ),
        ).toBeInTheDocument();
        await user.type(phone, '11911112222');
        expect(
            screen.getByText('(11) 91111-2222', {
                selector: 'p',
            }),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(
                'Sem telefone, o PDF do programa sai sem contato da clínica.',
            ),
        ).not.toBeInTheDocument();
    });

    it('mostra erro de e-mail, CNPJ e CEP e não envia', async () => {
        const user = userEvent.setup();
        renderPage();

        const email = await screen.findByLabelText('E-mail');
        await user.clear(email);
        await user.type(email, 'nao-e-email');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));
        expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();
        expect(updateProfile).not.toHaveBeenCalled();

        await user.clear(email);
        await user.type(email, 'contato@clinica.test');

        const document = screen.getByLabelText('CNPJ');
        await user.clear(document);
        await user.type(document, '11222333000180');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));
        expect(await screen.findByText('CNPJ inválido')).toBeInTheDocument();
        expect(updateProfile).not.toHaveBeenCalled();

        await user.clear(document);
        await user.type(document, '11222333000181');

        const cep = screen.getByLabelText('CEP');
        await user.clear(cep);
        await user.type(cep, '0131010');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));
        expect(await screen.findByText('CEP incompleto.')).toBeInTheDocument();
        expect(updateProfile).not.toHaveBeenCalled();
    });

    it('mostra erro de CPF inválido depois de trocar para Autônomo e não envia', async () => {
        const user = userEvent.setup();
        renderPage();

        await screen.findByLabelText('CNPJ');
        await user.click(screen.getByRole('radio', { name: 'Autônomo (CPF)' }));

        const document = await screen.findByLabelText('CPF');
        await user.clear(document);
        await user.type(document, '11111111111');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(await screen.findByText('CPF inválido')).toBeInTheDocument();
        expect(updateProfile).not.toHaveBeenCalled();
    });

    it('preenche rua, cidade e UF quando o CEP fica completo', async () => {
        lookupCep.mockResolvedValue({
            street: 'Avenida Paulista',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
        });
        getProfile.mockResolvedValue(
            makeProfile({
                zipCode: '',
                address: '',
                city: '',
                state: '',
            }),
        );
        const user = userEvent.setup();
        renderPage();

        const cep = await screen.findByLabelText('CEP');
        await user.type(cep, '01310100');

        await waitFor(() => {
            expect(lookupCep).toHaveBeenCalled();
        });
        expect(screen.getByLabelText('Rua')).toHaveValue('Avenida Paulista');
        expect(screen.getByLabelText('Cidade')).toHaveValue('São Paulo');
        expect(screen.getByRole('button', { name: /UF/ })).toHaveTextContent(
            'SP',
        );
    });
});
