import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    requestClinicPasswordReset,
    resetClinicPassword,
} from '@/application/clinic';
import ClinicForgotPasswordPage from '@/pages/clinic/ClinicForgotPasswordPage';
import ClinicLoginPage from '@/pages/clinic/ClinicLoginPage';
import ClinicResetPasswordPage from '@/pages/clinic/ClinicResetPasswordPage';
import { routerFutureFlags } from '@/test/browser-router';

const login = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ login }),
}));

vi.mock('@/application/clinic', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/application/clinic')>()),
    requestClinicPasswordReset: vi.fn(),
    resetClinicPassword: vi.fn(),
}));

const mockRequest = vi.mocked(requestClinicPasswordReset);
const mockReset = vi.mocked(resetClinicPassword);

function apiError(status: number, data: Record<string, unknown>) {
    return { response: { status, data } };
}

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]} future={routerFutureFlags}>
            <Routes>
                <Route path="/clinica/login" element={<ClinicLoginPage />} />
                <Route
                    path="/clinica/recuperar-senha"
                    element={<ClinicForgotPasswordPage />}
                />
                <Route
                    path="/clinica/redefinir-senha"
                    element={<ClinicResetPasswordPage />}
                />
                <Route path="/clinica" element={<p>Painel da clínica</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

beforeEach(() => {
    document.documentElement.dataset.theme = 'dark';
});

afterEach(() => {
    vi.clearAllMocks();
    delete document.documentElement.dataset.theme;
});

describe('Login da clínica', () => {
    it('pede e-mail e senha antes de chamar a API', async () => {
        renderAt('/clinica/login');
        await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        expect(await screen.findByText('Informe o e-mail')).toBeInTheDocument();
        expect(screen.getByText('Informe a senha')).toBeInTheDocument();
        expect(login).not.toHaveBeenCalled();
    });

    it('entra e vai para o painel', async () => {
        login.mockResolvedValueOnce(undefined);
        renderAt('/clinica/login');

        await userEvent.type(
            screen.getByLabelText('E-mail'),
            'ana@clinica.test',
        );
        await userEvent.type(screen.getByLabelText('Senha'), 'segredo123');
        await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        expect(
            await screen.findByText('Painel da clínica'),
        ).toBeInTheDocument();
        expect(login).toHaveBeenCalledWith('clinic', {
            email: 'ana@clinica.test',
            password: 'segredo123',
        });
    });

    it('mostra o erro da API no cartão e mantém o e-mail', async () => {
        login.mockRejectedValueOnce(
            apiError(401, { message: 'Credenciais inválidas.' }),
        );
        renderAt('/clinica/login');

        await userEvent.type(
            screen.getByLabelText('E-mail'),
            'ana@clinica.test',
        );
        await userEvent.type(screen.getByLabelText('Senha'), 'errada');
        await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        expect(
            await screen.findByText('Credenciais inválidas.'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('E-mail')).toHaveValue('ana@clinica.test');
    });

    it.each([
        [
            403,
            'Seu acesso está desativado. Fale com o administrador da clínica.',
        ],
        [429, 'Muitas tentativas. Aguarde um minuto e tente de novo.'],
    ])('mostra o aviso do %i no cartão', async (status, message) => {
        login.mockRejectedValueOnce(apiError(status, { message }));
        renderAt('/clinica/login');

        await userEvent.type(
            screen.getByLabelText('E-mail'),
            'ana@clinica.test',
        );
        await userEvent.type(screen.getByLabelText('Senha'), 'segredo123');
        await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(screen.queryByText('Painel da clínica')).not.toBeInTheDocument();
    });

    it('avisa quando o Caps Lock está ligado na senha', async () => {
        const user = userEvent.setup();
        renderAt('/clinica/login');

        await user.click(screen.getByLabelText('Senha'));
        expect(
            screen.queryByText('Caps Lock está ligado'),
        ).not.toBeInTheDocument();

        await user.keyboard('{CapsLock}a');
        expect(screen.getByText('Caps Lock está ligado')).toBeInTheDocument();
    });

    it('não tem o botão do Google, que não existe no back-end', () => {
        renderAt('/clinica/login');
        expect(
            screen.queryByRole('button', { name: /google/i }),
        ).not.toBeInTheDocument();
    });

    it('fica clara e devolve o tema que estava ao sair', () => {
        const { unmount } = renderAt('/clinica/login');
        expect(document.documentElement.dataset.theme).toBe('light');

        unmount();
        expect(document.documentElement.dataset.theme).toBe('dark');
    });
});

describe('Recuperar senha da clínica', () => {
    it('envia e mostra a mesma mensagem, com espera para reenviar', async () => {
        mockRequest.mockResolvedValueOnce(undefined);
        renderAt('/clinica/recuperar-senha');

        await userEvent.type(
            screen.getByLabelText('E-mail da conta'),
            'ana@clinica.test',
        );
        await userEvent.click(
            screen.getByRole('button', { name: 'Enviar link de redefinição' }),
        );

        expect(
            await screen.findByText('Confira seu e-mail'),
        ).toBeInTheDocument();
        expect(screen.getByText(/Se houver uma conta com/)).toBeInTheDocument();
        expect(mockRequest).toHaveBeenCalledWith('ana@clinica.test');
        expect(
            screen.getByRole('button', { name: /Reenviar em 60 s/ }),
        ).toBeDisabled();
    });

    it('mostra o aviso de muitas tentativas', async () => {
        mockRequest.mockRejectedValueOnce(
            apiError(429, {
                message:
                    'Muitas tentativas. Aguarde um minuto e tente de novo.',
            }),
        );
        renderAt('/clinica/recuperar-senha');

        await userEvent.type(
            screen.getByLabelText('E-mail da conta'),
            'ana@clinica.test',
        );
        await userEvent.click(
            screen.getByRole('button', { name: 'Enviar link de redefinição' }),
        );

        expect(
            await screen.findByText(
                'Muitas tentativas. Aguarde um minuto e tente de novo.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Confira seu e-mail'),
        ).not.toBeInTheDocument();
    });
});

describe('Recuperar senha: reenviar depois da espera', () => {
    afterEach(() => vi.useRealTimers());

    it('libera o reenviar depois de 60 s e manda de novo', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        mockRequest.mockResolvedValue(undefined);
        renderAt('/clinica/recuperar-senha');

        await user.type(
            screen.getByLabelText('E-mail da conta'),
            'ana@clinica.test',
        );
        await user.click(
            screen.getByRole('button', { name: 'Enviar link de redefinição' }),
        );
        expect(
            await screen.findByRole('button', { name: /Reenviar em 60 s/ }),
        ).toBeDisabled();

        for (let i = 0; i < 60; i++) {
            await act(() => vi.advanceTimersByTimeAsync(1000));
        }

        const resend = screen.getByRole('button', { name: 'Reenviar o link' });
        expect(resend).toBeEnabled();
        await user.click(resend);

        await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(2));
        expect(
            await screen.findByRole('button', { name: /Reenviar em 60 s/ }),
        ).toBeDisabled();
    });
});

describe('Redefinir senha da clínica', () => {
    const link = '/clinica/redefinir-senha?token=abc&email=ana%40clinica.test';

    it('link sem token mostra "Link inválido" e a saída para pedir outro', () => {
        renderAt('/clinica/redefinir-senha?email=ana%40clinica.test');
        expect(screen.getByText('Link inválido')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Pedir outro link' }),
        ).toBeInTheDocument();
    });

    it('confere senha mínima e confirmação antes de chamar a API', async () => {
        renderAt(link);

        await userEvent.type(screen.getByLabelText('Senha nova'), 'curta');
        await userEvent.type(
            screen.getByLabelText('Repita a senha nova'),
            'outra',
        );
        await userEvent.click(
            screen.getByRole('button', { name: 'Criar senha' }),
        );

        expect(
            await screen.findByText('Use pelo menos 8 caracteres'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('As senhas não são iguais'),
        ).toBeInTheDocument();
        expect(mockReset).not.toHaveBeenCalled();
    });

    it('cria a senha com o token e o e-mail do link', async () => {
        mockReset.mockResolvedValueOnce(undefined);
        renderAt(link);

        await userEvent.type(
            screen.getByLabelText('Senha nova'),
            'novaSenha123',
        );
        await userEvent.type(
            screen.getByLabelText('Repita a senha nova'),
            'novaSenha123',
        );
        await userEvent.click(
            screen.getByRole('button', { name: 'Criar senha' }),
        );

        expect(await screen.findByText('Senha criada')).toBeInTheDocument();
        expect(mockReset).toHaveBeenCalledWith({
            token: 'abc',
            email: 'ana@clinica.test',
            password: 'novaSenha123',
            passwordConfirmation: 'novaSenha123',
        });
    });

    it('link vencido vira "Link inválido" com o caminho para pedir outro', async () => {
        mockReset.mockRejectedValueOnce(
            apiError(422, {
                message: 'Link inválido ou expirado. Peça um novo link.',
            }),
        );
        renderAt(link);

        await userEvent.type(
            screen.getByLabelText('Senha nova'),
            'novaSenha123',
        );
        await userEvent.type(
            screen.getByLabelText('Repita a senha nova'),
            'novaSenha123',
        );
        await userEvent.click(
            screen.getByRole('button', { name: 'Criar senha' }),
        );

        await waitFor(() =>
            expect(screen.getByText('Link inválido')).toBeInTheDocument(),
        );
        expect(screen.getByText(/venceu ou já foi usado/)).toBeInTheDocument();
    });
});
