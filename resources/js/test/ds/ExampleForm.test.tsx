import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ExampleForm } from '@/pages/dev/design-system/ExampleForm';

// Dados fictícios.

describe('formulário de exemplo do catálogo (RHF + Zod com campos do DS)', () => {
    it('enviar vazio mostra os erros do Zod nos campos do DS', async () => {
        const user = userEvent.setup();
        render(<ExampleForm />);

        await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

        expect(await screen.findByText('Informe o nome')).toBeInTheDocument();
        expect(screen.getByText('CPF é obrigatório')).toBeInTheDocument();
        expect(screen.getByText('Informe o telefone')).toBeInTheDocument();
        expect(screen.getByText('Escolha o convênio')).toBeInTheDocument();
        expect(
            screen.getByText('Informe o valor da sessão'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('É preciso aceitar os termos'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Nome')).toHaveAttribute(
            'aria-invalid',
            'true',
        );
        expect(screen.queryByTestId('resultado')).not.toBeInTheDocument();
    });

    it('CPF inválido mostra a mensagem da validação do DS', async () => {
        const user = userEvent.setup();
        render(<ExampleForm />);

        await user.type(screen.getByLabelText(/CPF/), '11111111111');
        await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

        expect(await screen.findByText('CPF inválido')).toBeInTheDocument();
    });

    it('telefone incompleto mostra "Número inválido" e não envia', async () => {
        const user = userEvent.setup();
        render(<ExampleForm />);

        await user.type(screen.getByLabelText('Nome'), 'Paciente Exemplo');
        await user.type(screen.getByLabelText(/CPF/), '12345678909');
        await user.type(screen.getByLabelText(/Telefone/), '8499');
        await user.selectOptions(
            screen.getByLabelText('Convênio'),
            'particular',
        );
        await user.type(screen.getByLabelText('Valor da sessão'), '15000');
        await user.click(
            screen.getByRole('checkbox', { name: 'Aceito os termos' }),
        );
        await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

        expect(await screen.findByText('Número inválido')).toBeInTheDocument();
        expect(screen.queryByText('CPF inválido')).not.toBeInTheDocument();
        expect(screen.queryByTestId('resultado')).not.toBeInTheDocument();
    });

    it('trocar o país muda a validação do telefone', async () => {
        const user = userEvent.setup();
        render(<ExampleForm />);

        // 9 dígitos nacionais: curto para o Brasil (+55), suficiente para +1.
        await user.type(screen.getByLabelText(/Telefone/), '849999999');
        await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
        expect(await screen.findByText('Número inválido')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'País: Brasil' }));
        await user.type(
            screen.getByPlaceholderText('Buscar país…'),
            'estados unidos',
        );
        await user.keyboard('{ArrowDown}{Enter}');

        await waitFor(() =>
            expect(
                screen.queryByText('Número inválido'),
            ).not.toBeInTheDocument(),
        );
    });

    it('enviar preenchido mostra os valores enviados', async () => {
        const user = userEvent.setup();
        render(<ExampleForm />);

        await user.type(screen.getByLabelText('Nome'), 'Paciente Exemplo');
        await user.type(screen.getByLabelText(/CPF/), '12345678909');
        await user.type(screen.getByLabelText(/Telefone/), '84999999999');
        await user.selectOptions(
            screen.getByLabelText('Convênio'),
            'particular',
        );
        await user.type(screen.getByLabelText('Valor da sessão'), '15000');
        await user.click(
            screen.getByRole('checkbox', { name: 'Aceito os termos' }),
        );
        await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

        const result = await screen.findByTestId('resultado');
        expect(JSON.parse(within(result).getByText(/\{/).textContent!)).toEqual(
            {
                nome: 'Paciente Exemplo',
                cpf: '123.456.789-09',
                telefone: '+55 84 99999-9999',
                convenio: 'particular',
                valor: 150,
                termos: true,
            },
        );
    });
});
