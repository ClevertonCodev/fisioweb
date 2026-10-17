import { zodResolver } from '@hookform/resolvers/zod';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Info, Search } from 'lucide-react';
import { useState } from 'react';
import type { UseFormReset } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { InputProps } from '@/components/ds';
import { DsInput } from '@/components/ds';

/** DsInput controlado, como o v-model do Vue. */
function Controlled(props: InputProps & { initial?: string }) {
    const { initial = '', onValueChange, ...rest } = props;
    const [value, setValue] = useState(initial);
    return (
        <DsInput
            {...rest}
            value={value}
            onValueChange={(next) => {
                setValue(next);
                onValueChange?.(next);
            }}
        />
    );
}

describe('DsInput', () => {
    it('renderiza um input de texto por padrão', () => {
        render(<DsInput />);

        expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renderiza o label e associa ao input pelo id', () => {
        render(<DsInput label="Nome" id="campo-nome" />);

        const input = screen.getByLabelText('Nome');
        expect(input).toHaveAttribute('id', 'campo-nome');
    });

    it('gera um id quando não é informado e ainda associa o label', () => {
        render(<DsInput label="E-mail" />);

        expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    });

    it('required põe o asterisco vermelho no rótulo e marca o input', () => {
        render(<DsInput label="Nome" required />);

        // O asterisco é aria-hidden: o nome acessível continua "Nome".
        const input = screen.getByRole('textbox', { name: 'Nome' });
        expect(input).toBeRequired();
        const star = screen.getByText('*');
        expect(star).toHaveAttribute('aria-hidden', 'true');
        expect(star).toHaveClass('text-ds-status-danger-content');
    });

    it('sem required, o rótulo não tem asterisco', () => {
        render(<DsInput label="Apelido" />);

        expect(screen.queryByText('*')).toBeNull();
    });

    it('não renderiza label quando a prop não é passada', () => {
        const { container } = render(<DsInput />);

        expect(container.querySelector('label')).toBeNull();
    });

    it('renderiza o helper e liga ao input por aria-describedby', () => {
        render(<DsInput label="Nome" helper="Texto de ajuda" />);

        expect(screen.getByLabelText('Nome')).toHaveAccessibleDescription(
            'Texto de ajuda',
        );
    });

    it('reflete value e chama onValueChange e onChange ao digitar', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<Controlled initial="inicial" onValueChange={onValueChange} />);

        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('inicial');

        await user.clear(input);
        await user.type(input, 'novo');

        expect(input).toHaveValue('novo');
        expect(onValueChange).toHaveBeenLastCalledWith('novo');
    });

    it('state="error" marca o campo como inválido e mostra o ícone de erro', () => {
        render(<DsInput state="error" helper="Obrigatório" />);

        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input.closest('[data-state]')).toHaveAttribute(
            'data-state',
            'error',
        );
        expect(screen.getByTestId('ds-state-icon-error')).toBeInTheDocument();
    });

    it('state="success" mostra o ícone de sucesso', () => {
        render(<DsInput state="success" />);

        expect(
            screen.getByRole('textbox').closest('[data-state]'),
        ).toHaveAttribute('data-state', 'success');
        expect(screen.getByTestId('ds-state-icon-success')).toBeInTheDocument();
    });

    it('state="default" não marca estado nem ícone', () => {
        render(<DsInput />);

        expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
        expect(screen.queryByTestId(/ds-state-icon/)).not.toBeInTheDocument();
    });

    it('reflete disabled e readonly no input nativo', () => {
        render(
            <>
                <DsInput label="A" disabled />
                <DsInput label="B" readonly />
            </>,
        );

        expect(screen.getByLabelText('A')).toBeDisabled();
        expect(screen.getByLabelText('B')).toHaveAttribute('readonly');
    });

    it('type="password" alterna a visibilidade pelo botão', async () => {
        const user = userEvent.setup();
        render(<DsInput type="password" label="Senha" />);

        const input = screen.getByLabelText('Senha');
        expect(input).toHaveAttribute('type', 'password');

        await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
        expect(input).toHaveAttribute('type', 'text');

        await user.click(screen.getByRole('button', { name: 'Ocultar senha' }));
        expect(input).toHaveAttribute('type', 'password');
    });

    it('type="password" não mostra o ícone de estado', () => {
        render(<DsInput type="password" state="error" />);

        expect(screen.queryByTestId(/ds-state-icon/)).not.toBeInTheDocument();
    });

    it('type="search" limpa o valor e chama onCleared', async () => {
        const onCleared = vi.fn();
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled
                type="search"
                initial="busca"
                onCleared={onCleared}
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Limpar busca' }));

        expect(screen.getByRole('searchbox')).toHaveValue('');
        expect(onValueChange).toHaveBeenLastCalledWith('');
        expect(onCleared).toHaveBeenCalledTimes(1);
    });

    it('type="search" não mostra o limpar quando vazio ou disabled', () => {
        render(
            <>
                <DsInput type="search" value="" onValueChange={() => {}} />
                <DsInput
                    type="search"
                    value="x"
                    disabled
                    onValueChange={() => {}}
                />
            </>,
        );

        expect(
            screen.queryByRole('button', { name: 'Limpar busca' }),
        ).not.toBeInTheDocument();
    });

    it('chama onFocus e onBlur do input nativo', async () => {
        const onFocus = vi.fn();
        const onBlur = vi.fn();
        const user = userEvent.setup();
        render(<DsInput onFocus={onFocus} onBlur={onBlur} />);

        await user.click(screen.getByRole('textbox'));
        await user.tab();

        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('repassa name, autocomplete e outros atributos ao input', () => {
        render(<DsInput name="email" autocomplete="email" maxLength={10} />);

        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('name', 'email');
        expect(input).toHaveAttribute('autocomplete', 'email');
        expect(input).toHaveAttribute('maxlength', '10');
    });

    it('renderiza os ícones à esquerda e à direita', () => {
        render(
            <DsInput
                iconLeft={<Search data-testid="icone-l" />}
                iconRight={<Info data-testid="icone-r" />}
            />,
        );

        expect(screen.getByTestId('icone-l')).toBeInTheDocument();
        expect(screen.getByTestId('icone-r')).toBeInTheDocument();
    });

    it('chama onEnterPressed só com Enter', async () => {
        const onEnterPressed = vi.fn();
        const user = userEvent.setup();
        render(<DsInput onEnterPressed={onEnterPressed} />);

        await user.type(screen.getByRole('textbox'), 'a{Enter}');

        expect(onEnterPressed).toHaveBeenCalledTimes(1);
    });

    it('funciona com register do React Hook Form e mostra o erro do Zod', async () => {
        const onSubmit = vi.fn();
        const schema = z.object({ nome: z.string().min(1, 'Informe o nome') });

        function Form() {
            const {
                register,
                handleSubmit,
                formState: { errors },
            } = useForm<{ nome: string }>({
                resolver: zodResolver(schema),
                defaultValues: { nome: '' },
            });
            return (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DsInput
                        label="Nome"
                        {...register('nome')}
                        state={errors.nome ? 'error' : 'default'}
                        helper={errors.nome?.message}
                    />
                    <button type="submit">Enviar</button>
                </form>
            );
        }

        const user = userEvent.setup();
        render(<Form />);

        await user.click(screen.getByRole('button', { name: 'Enviar' }));
        expect(await screen.findByText('Informe o nome')).toBeInTheDocument();
        expect(screen.getByLabelText('Nome')).toHaveAttribute(
            'aria-invalid',
            'true',
        );

        await user.type(screen.getByLabelText('Nome'), 'Ana');
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(onSubmit).toHaveBeenCalledWith(
            { nome: 'Ana' },
            expect.anything(),
        );
    });

    describe('type="search" com register do React Hook Form', () => {
        type Form = { q: string };

        function RegisteredSearch({
            defaultValues,
            onReady,
        }: {
            defaultValues: Form;
            onReady?: (reset: UseFormReset<Form>) => void;
        }) {
            const { register, reset } = useForm<Form>({ defaultValues });
            onReady?.(reset);
            return <DsInput type="search" {...register('q')} />;
        }

        it('mostra o limpar quando os defaultValues já trazem texto', () => {
            render(<RegisteredSearch defaultValues={{ q: 'abc' }} />);

            expect(screen.getByRole('searchbox')).toHaveValue('abc');
            expect(
                screen.getByRole('button', { name: 'Limpar busca' }),
            ).toBeInTheDocument();
        });

        it('esconde o limpar depois de reset() para vazio', async () => {
            const user = userEvent.setup();
            let reset!: UseFormReset<Form>;
            render(
                <RegisteredSearch
                    defaultValues={{ q: '' }}
                    onReady={(fn) => (reset = fn)}
                />,
            );

            await user.type(screen.getByRole('searchbox'), 'dor');
            expect(
                screen.getByRole('button', { name: 'Limpar busca' }),
            ).toBeInTheDocument();

            act(() => reset({ q: '' }));

            expect(screen.getByRole('searchbox')).toHaveValue('');
            expect(
                screen.queryByRole('button', { name: 'Limpar busca' }),
            ).not.toBeInTheDocument();
        });

        it('esconde o limpar depois do reset do próprio <form>', async () => {
            const user = userEvent.setup();
            function Form() {
                const { register } = useForm<Form>();
                return (
                    <form>
                        <DsInput type="search" {...register('q')} />
                        <button type="reset">Recomeçar</button>
                    </form>
                );
            }
            render(<Form />);

            await user.type(screen.getByRole('searchbox'), 'dor');
            await user.click(screen.getByRole('button', { name: 'Recomeçar' }));

            expect(screen.getByRole('searchbox')).toHaveValue('');
            await waitFor(() =>
                expect(
                    screen.queryByRole('button', { name: 'Limpar busca' }),
                ).not.toBeInTheDocument(),
            );
        });
    });
});
