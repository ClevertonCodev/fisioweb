import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicRegistrationRepository } from '@/infrastructure/repositories/api-clinic-registration';
import ClinicRegisterPage from '@/pages/clinic/ClinicRegisterPage';
import ClinicVerifyEmailPage from '@/pages/clinic/ClinicVerifyEmailPage';
import { routerFutureFlags } from '@/test/browser-router';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

function apiError(status: number, data: Record<string, unknown>) {
    return { response: { status, data } };
}

function renderAt(path: string) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[path]} future={routerFutureFlags}>
                <Routes>
                    <Route
                        path="/clinica/criar-conta"
                        element={<ClinicRegisterPage />}
                    />
                    <Route
                        path="/clinica/confirmar-email"
                        element={<ClinicVerifyEmailPage />}
                    />
                    <Route
                        path="/clinica/login"
                        element={<p>Tela de login</p>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
        data: { data: { available: true, reason: null } },
    });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('Repositório de auto-cadastro da clínica (mapper)', () => {
    it('converte PF→fisica, PJ→juridica e envia documento e telefone só com dígitos', async () => {
        mockPost.mockResolvedValueOnce({
            data: {
                data: { clinic_id: 42, email: 'fisio@autonomo.com.br' },
            },
        });

        const res = await apiClinicRegistrationRepository.register({
            name: '  Dr. João Fisio ',
            typePerson: 'PF',
            document: '529.982.247-25',
            email: '  Fisio@Autonomo.com.br ',
            phone: '(11) 98765-4321',
            slug: 'dr-joao-fisio',
            password: 'SenhaForte!123',
            passwordConfirmation: 'SenhaForte!123',
            termsAccepted: true,
        });

        expect(res).toEqual({
            clinicId: 42,
            email: 'fisio@autonomo.com.br',
        });
        expect(mockPost).toHaveBeenCalledWith('/clinic/auth/register', {
            name: 'Dr. João Fisio',
            type_person: 'fisica',
            document: '52998224725',
            email: 'fisio@autonomo.com.br',
            phone: '11987654321',
            slug: 'dr-joao-fisio',
            password: 'SenhaForte!123',
            password_confirmation: 'SenhaForte!123',
            terms_accepted: true,
        });
    });
});

describe('Criar conta da clínica (DS v2 — Três passos)', () => {
    it('não avança de passo com campo inválido, alterna PJ↔PF e preserva valores ao voltar', async () => {
        const user = userEvent.setup();
        renderAt('/clinica/criar-conta');

        await user.click(screen.getByRole('button', { name: 'Continuar' }));
        expect(
            await screen.findByText('Nome da clínica é obrigatório'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('CNPJ')).toBeInTheDocument();

        // Troca para PF: muda rótulo e aplica máscara de CPF
        await user.click(
            screen.getByRole('radio', { name: /Autônomo \(CPF\)/i }),
        );
        expect(screen.getByLabelText('CPF')).toBeInTheDocument();

        await user.type(
            screen.getByLabelText('Nome da clínica'),
            'Clínica Movimento',
        );
        await user.type(screen.getByLabelText('CPF'), '11111111111');
        await user.click(screen.getByRole('button', { name: 'Continuar' }));
        expect(await screen.findByText('CPF inválido')).toBeInTheDocument();

        await user.clear(screen.getByLabelText('CPF'));
        await user.type(screen.getByLabelText('CPF'), '52998224725');
        expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25');

        await user.click(screen.getByRole('button', { name: 'Continuar' }));

        // Passo 2: valida confirmação de senha antes de avançar
        expect(await screen.findByLabelText('E-mail')).toBeInTheDocument();
        await user.type(
            screen.getByLabelText('E-mail'),
            'contato@movimento.com.br',
        );
        await user.type(screen.getByLabelText('Senha'), 'SenhaForte!123');
        await user.type(
            screen.getByLabelText('Confirmar senha'),
            'OutraSenha!123',
        );
        await user.click(screen.getByRole('button', { name: 'Continuar' }));
        expect(
            await screen.findByText('As senhas não coincidem'),
        ).toBeInTheDocument();

        // Voltar preserva os valores digitados
        await user.click(screen.getByRole('button', { name: 'Voltar' }));
        expect(screen.getByLabelText('Nome da clínica')).toHaveValue(
            'Clínica Movimento',
        );
        expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25');
    });

    it('gera o slug a partir do nome até ser editado e bloqueia envio quando indisponível ou sem aceite de termos', async () => {
        const user = userEvent.setup();
        mockGet.mockImplementation(async (_url, config) => {
            const slug = config?.params?.slug;
            if (slug === 'clinica-ocupada') {
                return {
                    data: { data: { available: false, reason: 'taken' } },
                };
            }
            return { data: { data: { available: true, reason: null } } };
        });

        renderAt('/clinica/criar-conta');

        await user.type(
            screen.getByLabelText('Nome da clínica'),
            'Clínica São Paulo',
        );
        await user.type(screen.getByLabelText('CNPJ'), '11222333000181');
        await user.click(screen.getByRole('button', { name: 'Continuar' }));

        await user.type(
            await screen.findByLabelText('E-mail'),
            'contato@sp.com.br',
        );
        await user.type(screen.getByLabelText('Senha'), 'SenhaForte!123');
        await user.type(
            screen.getByLabelText('Confirmar senha'),
            'SenhaForte!123',
        );
        await user.click(screen.getByRole('button', { name: 'Continuar' }));

        const slugInput = await screen.findByLabelText(
            'Endereço dos links dos pacientes',
        );
        expect(slugInput).toHaveValue('clinica-sao-paulo');

        // Edita manualmente para um slug ocupado
        await user.clear(slugInput);
        await user.type(slugInput, 'clinica-ocupada');

        expect(
            await screen.findByText('Este endereço já é de outra clínica.'),
        ).toBeInTheDocument();

        // Voltar ao passo 1 e mudar o nome não sobrescreve o slug editado manualmente
        await user.click(screen.getByRole('button', { name: 'Voltar' }));
        await user.click(screen.getByRole('button', { name: 'Voltar' }));
        await user.type(screen.getByLabelText('Nome da clínica'), ' Nova');
        await user.click(screen.getByRole('button', { name: 'Continuar' }));
        await user.click(screen.getByRole('button', { name: 'Continuar' }));
        expect(
            screen.getByLabelText('Endereço dos links dos pacientes'),
        ).toHaveValue('clinica-ocupada');

        // Mesmo marcando os termos, slug ocupado bloqueia o envio
        await user.click(
            screen.getByRole('checkbox', {
                name: /Termos de Uso e a Política de Privacidade/i,
            }),
        );
        await user.click(screen.getByRole('button', { name: 'Criar conta' }));
        expect(mockPost).not.toHaveBeenCalled();

        // Corrige o slug, mas desmarca os termos: exige o aceite
        const slugInputAgain = screen.getByLabelText(
            'Endereço dos links dos pacientes',
        );
        await user.clear(slugInputAgain);
        await user.type(slugInputAgain, 'clinica-sp-livre');
        await waitFor(() =>
            expect(
                screen.getByText('Disponível. Depois de criado, não muda.'),
            ).toBeInTheDocument(),
        );

        await user.click(
            screen.getByRole('checkbox', {
                name: /Termos de Uso e a Política de Privacidade/i,
            }),
        );
        await user.click(screen.getByRole('button', { name: 'Criar conta' }));
        expect(
            await screen.findByText(
                /Aceite os Termos de Uso e a Política de Privacidade/i,
            ),
        ).toBeInTheDocument();
        expect(mockPost).not.toHaveBeenCalled();
    });

    it('no 422 do servidor exibe o erro no campo e volta para o passo correspondente', async () => {
        const user = userEvent.setup();
        mockPost.mockRejectedValueOnce(
            apiError(422, {
                message: 'Este e-mail já está em uso.',
                errors: {
                    email: ['Este e-mail já está em uso.'],
                },
            }),
        );

        renderAt('/clinica/criar-conta');

        await user.type(
            screen.getByLabelText('Nome da clínica'),
            'Clínica Movimento',
        );
        await user.type(screen.getByLabelText('CNPJ'), '11222333000181');
        await user.click(screen.getByRole('button', { name: 'Continuar' }));

        await user.type(
            await screen.findByLabelText('E-mail'),
            'usado@clinica.com.br',
        );
        await user.type(screen.getByLabelText('Senha'), 'SenhaForte!123');
        await user.type(
            screen.getByLabelText('Confirmar senha'),
            'SenhaForte!123',
        );
        await user.click(screen.getByRole('button', { name: 'Continuar' }));

        await waitFor(() =>
            expect(
                screen.getByText('Disponível. Depois de criado, não muda.'),
            ).toBeInTheDocument(),
        );
        await user.click(
            screen.getByRole('checkbox', {
                name: /Termos de Uso e a Política de Privacidade/i,
            }),
        );
        await user.click(screen.getByRole('button', { name: 'Criar conta' }));

        // Volta automaticamente para o passo 2 ("Seu acesso") e mostra o erro no campo E-mail
        expect(
            await screen.findByText('Este e-mail já está em uso.'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('E-mail')).toHaveValue(
            'usado@clinica.com.br',
        );
    });

    it('conclui o cadastro mostrando a tela de confirmar e-mail e respeita 30 s no reenvio', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

        mockPost.mockResolvedValue({
            data: {
                data: { clinic_id: 10, email: 'contato@movimento.com.br' },
            },
        });

        renderAt('/clinica/criar-conta');

        await user.type(
            screen.getByLabelText('Nome da clínica'),
            'Clínica Movimento',
        );
        await user.type(screen.getByLabelText('CNPJ'), '11222333000181');
        await user.click(screen.getByRole('button', { name: 'Continuar' }));

        await user.type(
            await screen.findByLabelText('E-mail'),
            'contato@movimento.com.br',
        );
        await user.type(screen.getByLabelText('Senha'), 'SenhaForte!123');
        await user.type(
            screen.getByLabelText('Confirmar senha'),
            'SenhaForte!123',
        );
        await user.click(screen.getByRole('button', { name: 'Continuar' }));

        await act(() => vi.advanceTimersByTimeAsync(450));
        await waitFor(() =>
            expect(
                screen.getByText('Disponível. Depois de criado, não muda.'),
            ).toBeInTheDocument(),
        );

        await user.click(
            screen.getByRole('checkbox', {
                name: /Termos de Uso e a Política de Privacidade/i,
            }),
        );
        await user.click(screen.getByRole('button', { name: 'Criar conta' }));

        expect(await screen.findByText('Tudo certo!')).toBeInTheDocument();
        expect(
            screen.getByText('contato@movimento.com.br'),
        ).toBeInTheDocument();
        expect(screen.queryByText(/protótipo/i)).not.toBeInTheDocument();

        const resendBtn = screen.getByRole('button', {
            name: 'Reenviar e-mail',
        });
        await user.click(resendBtn);

        expect(mockPost).toHaveBeenCalledWith(
            '/clinic/auth/verify-email/resend',
            { email: 'contato@movimento.com.br' },
        );
        expect(
            await screen.findByRole('button', { name: /Reenviar em 30 s/ }),
        ).toBeDisabled();

        for (let i = 0; i < 30; i++) {
            await act(() => vi.advanceTimersByTimeAsync(1000));
        }

        expect(
            screen.getByRole('button', { name: 'Reenviar e-mail' }),
        ).toBeEnabled();
    });
});

describe('Confirmar e-mail da clínica (/clinica/confirmar-email)', () => {
    it('confirma o e-mail com link válido e leva para o login', async () => {
        const user = userEvent.setup();
        mockPost.mockResolvedValueOnce({
            data: { message: 'E-mail confirmado com sucesso.' },
        });

        renderAt(
            '/clinica/confirmar-email?id=7&hash=abc123&expires=1999999999&signature=sig456',
        );

        expect(
            await screen.findByText('E-mail confirmado'),
        ).toBeInTheDocument();
        expect(mockPost).toHaveBeenCalledWith('/clinic/auth/verify-email', {
            id: 7,
            hash: 'abc123',
            expires: 1999999999,
            signature: 'sig456',
        });

        await user.click(screen.getByRole('button', { name: 'Entrar' }));
        expect(await screen.findByText('Tela de login')).toBeInTheDocument();
    });

    it('mostra aviso de link vencido e permite reenviar informando o e-mail', async () => {
        const user = userEvent.setup();
        mockPost
            .mockRejectedValueOnce(
                apiError(422, {
                    message:
                        'Link de confirmação inválido ou expirado. Peça um novo link.',
                }),
            )
            .mockResolvedValueOnce({
                data: {
                    message:
                        'Se houver um cadastro pendente com este e-mail, enviamos um novo link de confirmação.',
                },
            });

        renderAt(
            '/clinica/confirmar-email?id=7&hash=abc123&expires=100&signature=sig456',
        );

        expect(
            await screen.findByText('Link inválido ou expirado'),
        ).toBeInTheDocument();

        await user.type(
            screen.getByLabelText('E-mail da conta'),
            'contato@movimento.com.br',
        );
        await user.click(
            screen.getByRole('button', {
                name: 'Reenviar e-mail de confirmação',
            }),
        );

        expect(mockPost).toHaveBeenLastCalledWith(
            '/clinic/auth/verify-email/resend',
            { email: 'contato@movimento.com.br' },
        );
        expect(
            await screen.findByText(/enviamos um novo link de confirmação/i),
        ).toBeInTheDocument();
    });
});
