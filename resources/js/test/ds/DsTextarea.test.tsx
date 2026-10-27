import { zodResolver } from '@hookform/resolvers/zod';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { UseFormReset, UseFormSetValue } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { DsTextarea } from '@/components/ds';

describe('DsTextarea', () => {
    it('renderiza com label, 4 linhas por padrão e helper descrito', () => {
        render(<DsTextarea label="Observações" helper="Opcional" />);

        const textarea = screen.getByLabelText('Observações');
        expect(textarea).toHaveAttribute('rows', '4');
        expect(textarea).toHaveAccessibleDescription('Opcional');
    });

    it('chama onValueChange ao digitar', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();

        function Controlled() {
            const [value, setValue] = useState('');
            return (
                <DsTextarea
                    label="Texto"
                    value={value}
                    onValueChange={(v) => {
                        setValue(v);
                        onValueChange(v);
                    }}
                />
            );
        }
        render(<Controlled />);

        await user.type(screen.getByLabelText('Texto'), 'oi');

        expect(onValueChange).toHaveBeenLastCalledWith('oi');
    });

    it('mostra o contador de caracteres quando há maxlength', () => {
        render(
            <DsTextarea value="abc" maxlength={10} onValueChange={() => {}} />,
        );

        expect(screen.getByText('3 / 10')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '10');
    });

    it('não mostra contador sem maxlength', () => {
        render(<DsTextarea value="abc" onValueChange={() => {}} />);

        expect(screen.queryByText(/\/ /)).not.toBeInTheDocument();
    });

    it('state="error" marca aria-invalid e o estado', () => {
        render(<DsTextarea state="error" />);

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('aria-invalid', 'true');
        expect(textarea).toHaveAttribute('data-state', 'error');
    });

    it('state="success" marca o estado sem aria-invalid', () => {
        render(<DsTextarea state="success" />);

        const textarea = screen.getByRole('textbox');
        expect(textarea).not.toHaveAttribute('aria-invalid');
        expect(textarea).toHaveAttribute('data-state', 'success');
    });

    it('reflete disabled, readonly, rows e name', () => {
        render(
            <>
                <DsTextarea label="A" disabled />
                <DsTextarea label="B" readonly rows={6} name="obs" />
            </>,
        );

        expect(screen.getByLabelText('A')).toBeDisabled();
        const b = screen.getByLabelText('B');
        expect(b).toHaveAttribute('readonly');
        expect(b).toHaveAttribute('rows', '6');
        expect(b).toHaveAttribute('name', 'obs');
    });

    it('com maxlength={0} não renderiza um "0" solto', () => {
        const { container } = render(<DsTextarea maxlength={0} />);

        expect(container).not.toHaveTextContent(/^0$/);
        expect(container.textContent).toBe('');
    });

    describe('com register do React Hook Form', () => {
        type Form = { obs: string };

        function RegisteredTextarea({
            defaultValues,
            onReady,
        }: {
            defaultValues: Form;
            onReady?: (
                reset: UseFormReset<Form>,
                setValue: UseFormSetValue<Form>,
            ) => void;
        }) {
            const { register, reset, setValue } = useForm<Form>({
                defaultValues,
            });
            onReady?.(reset, setValue);
            return <DsTextarea maxlength={280} {...register('obs')} />;
        }

        it('o contador mostra o tamanho dos defaultValues', () => {
            render(<RegisteredTextarea defaultValues={{ obs: 'abc' }} />);

            expect(screen.getByRole('textbox')).toHaveValue('abc');
            expect(screen.getByText('3 / 280')).toBeInTheDocument();
        });

        it('o contador volta a zero depois de reset()', async () => {
            const user = userEvent.setup();
            let reset!: UseFormReset<Form>;
            render(
                <RegisteredTextarea
                    defaultValues={{ obs: '' }}
                    onReady={(fn) => (reset = fn)}
                />,
            );

            await user.type(screen.getByRole('textbox'), 'hello');
            expect(screen.getByText('5 / 280')).toBeInTheDocument();

            act(() => reset({ obs: '' }));

            expect(screen.getByRole('textbox')).toHaveValue('');
            expect(screen.getByText('0 / 280')).toBeInTheDocument();
        });

        it('o contador volta a zero com o reset do próprio <form>', async () => {
            const user = userEvent.setup();
            function Form() {
                const { register } = useForm<Form>();
                return (
                    <form>
                        <DsTextarea maxlength={280} {...register('obs')} />
                        <button type="reset">Limpar</button>
                    </form>
                );
            }
            render(<Form />);

            await user.type(screen.getByRole('textbox'), 'abc');
            expect(screen.getByText('3 / 280')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'Limpar' }));

            expect(screen.getByRole('textbox')).toHaveValue('');
            expect(await screen.findByText('0 / 280')).toBeInTheDocument();
        });

        it('o contador volta a zero no reset clicado pelo usuário (ordem do navegador)', async () => {
            // Clique real em <button type="reset">: o evento `reset` vem de uma
            // tarefa nativa, as microtasks rodam logo depois dele e só então o
            // form aplica o reset (escrevendo o valor sem o setter próprio).
            const { container } = render(
                <form>
                    <DsTextarea maxlength={280} name="obs" />
                </form>,
            );
            const textarea = screen.getByRole('textbox');
            const setNative = Object.getOwnPropertyDescriptor(
                HTMLTextAreaElement.prototype,
                'value',
            )!.set!;
            const user = userEvent.setup();
            await user.type(textarea, 'abc');
            expect(screen.getByText('3 / 280')).toBeInTheDocument();

            await act(async () => {
                container
                    .querySelector('form')!
                    .dispatchEvent(new Event('reset', { cancelable: true }));
                await Promise.resolve();
                setNative.call(textarea, '');
            });

            expect(await screen.findByText('0 / 280')).toBeInTheDocument();
        });

        it('o contador volta a zero com reset() sem defaultValues', async () => {
            const user = userEvent.setup();
            let reset!: UseFormReset<Form>;
            function Form() {
                const form = useForm<Form>();
                reset = form.reset;
                return (
                    <form>
                        <DsTextarea maxlength={280} {...form.register('obs')} />
                    </form>
                );
            }
            render(<Form />);

            await user.type(screen.getByRole('textbox'), 'abc');
            act(() => reset());

            expect(screen.getByRole('textbox')).toHaveValue('');
            expect(await screen.findByText('0 / 280')).toBeInTheDocument();
        });

        it('o contador acompanha setValue(), que não re-renderiza o form', () => {
            let setValue!: UseFormSetValue<Form>;
            render(
                <RegisteredTextarea
                    defaultValues={{ obs: '' }}
                    onReady={(_, fn) => (setValue = fn)}
                />,
            );

            act(() => setValue('obs', 'abcd'));

            expect(screen.getByRole('textbox')).toHaveValue('abcd');
            expect(screen.getByText('4 / 280')).toBeInTheDocument();
        });

        it('mostra o erro do Zod no estado error e envia o valor', async () => {
            const onSubmit = vi.fn();
            const schema = z.object({
                obs: z.string().min(3, 'Escreva ao menos 3 caracteres'),
            });

            function ObsForm() {
                const {
                    register,
                    handleSubmit,
                    formState: { errors },
                } = useForm<Form>({
                    resolver: zodResolver(schema),
                    defaultValues: { obs: '' },
                });
                return (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <DsTextarea
                            label="Observações"
                            maxlength={280}
                            {...register('obs')}
                            state={errors.obs ? 'error' : 'default'}
                            helper={errors.obs?.message}
                        />
                        <button type="submit">Salvar</button>
                    </form>
                );
            }

            const user = userEvent.setup();
            render(<ObsForm />);

            await user.click(screen.getByRole('button', { name: 'Salvar' }));

            const textarea = screen.getByLabelText('Observações');
            expect(
                await screen.findByText('Escreva ao menos 3 caracteres'),
            ).toBeInTheDocument();
            expect(textarea).toHaveAttribute('aria-invalid', 'true');
            expect(textarea).toHaveAttribute('data-state', 'error');
            expect(textarea).toHaveAccessibleDescription(
                'Escreva ao menos 3 caracteres',
            );

            await user.type(textarea, 'Dor lombar');
            await user.click(screen.getByRole('button', { name: 'Salvar' }));

            expect(onSubmit).toHaveBeenCalledWith(
                { obs: 'Dor lombar' },
                expect.anything(),
            );
            expect(screen.getByText('10 / 280')).toBeInTheDocument();
            expect(textarea).not.toHaveAttribute('aria-invalid');
        });
    });
});
