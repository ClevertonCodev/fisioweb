import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ClinicFirstAccessPage from '@/pages/clinic/ClinicFirstAccessPage';
import { routerFutureFlags } from '@/test/browser-router';

const completeFirstAccess = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ completeFirstAccess }),
}));

const link = '/clinica/primeiro-acesso?token=abc123';

function apiError(status: number, data: Record<string, unknown>) {
    return { response: { status, data } };
}

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]} future={routerFutureFlags}>
            <Routes>
                <Route
                    path="/clinica/primeiro-acesso"
                    element={<ClinicFirstAccessPage />}
                />
                <Route path="/clinica" element={<p>Painel da clínica</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

async function fillAndSubmit(password: string, confirmation: string) {
    await userEvent.type(screen.getByLabelText('Senha'), password);
    await userEvent.type(screen.getByLabelText('Repita a senha'), confirmation);
    await userEvent.click(screen.getByRole('button', { name: 'Criar senha' }));
}

afterEach(() => {
    vi.clearAllMocks();
});

describe('Primeiro acesso do mestre', () => {
    it('confere senha mínima e confirmação antes de chamar a API', async () => {
        renderAt(link);

        await fillAndSubmit('curta', 'outra');

        expect(
            await screen.findByText('Use pelo menos 8 caracteres'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('As senhas não são iguais'),
        ).toBeInTheDocument();
        expect(completeFirstAccess).not.toHaveBeenCalled();
    });

    it('cria a senha com o token do link, abre a sessão e vai para o painel', async () => {
        completeFirstAccess.mockResolvedValueOnce(undefined);
        renderAt(link);

        await fillAndSubmit('senhaDoMestre1', 'senhaDoMestre1');

        expect(
            await screen.findByText('Painel da clínica'),
        ).toBeInTheDocument();
        expect(completeFirstAccess).toHaveBeenCalledWith({
            token: 'abc123',
            password: 'senhaDoMestre1',
            passwordConfirmation: 'senhaDoMestre1',
        });
    });

    it('link sem token mostra "Link inválido" e pede um novo ao suporte', () => {
        renderAt('/clinica/primeiro-acesso');

        expect(screen.getByText('Link inválido')).toBeInTheDocument();
        expect(
            screen.getByText(/Peça um novo link ao suporte/),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Criar senha' }),
        ).not.toBeInTheDocument();
    });

    it('link já usado ou trocado vira "Link inválido"', async () => {
        completeFirstAccess.mockRejectedValueOnce(
            apiError(422, {
                message:
                    'Link inválido ou já usado. Peça um novo link ao suporte.',
            }),
        );
        renderAt(link);

        await fillAndSubmit('senhaDoMestre1', 'senhaDoMestre1');

        expect(await screen.findByText('Link inválido')).toBeInTheDocument();
        expect(
            screen.getByText(/Peça um novo link ao suporte/),
        ).toBeInTheDocument();
        expect(screen.queryByText('Painel da clínica')).not.toBeInTheDocument();
    });

    it('erro de servidor mostra o aviso no cartão e mantém o formulário', async () => {
        completeFirstAccess.mockRejectedValueOnce(
            apiError(500, { message: 'SQLSTATE interno' }),
        );
        renderAt(link);

        await fillAndSubmit('senhaDoMestre1', 'senhaDoMestre1');

        expect(
            await screen.findByText(
                'Não foi possível criar a senha agora. Tente de novo.',
            ),
        ).toBeInTheDocument();
        expect(screen.queryByText('SQLSTATE interno')).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Criar senha' }),
        ).toBeInTheDocument();
    });
});
