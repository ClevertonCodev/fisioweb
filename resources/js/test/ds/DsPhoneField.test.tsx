import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { PhoneFieldProps } from '@/components/ds';
import { DsCountrySelect, DsPhoneField } from '@/components/ds';

// Só números fictícios.

function Controlled(
    props: Omit<PhoneFieldProps, 'value'> & { initial?: string },
) {
    const { initial = '', onValueChange, ...rest } = props;
    const [value, setValue] = useState(initial);
    return (
        <DsPhoneField
            {...rest}
            value={value}
            onValueChange={(v) => {
                setValue(v);
                onValueChange?.(v);
            }}
        />
    );
}

describe('DsCountrySelect', () => {
    it('mostra o placeholder padrão do Vue', () => {
        render(<DsCountrySelect label="País" />);

        expect(screen.getByRole('button', { name: /País/ })).toHaveTextContent(
            'Selecione o país de origem',
        );
    });

    it('busca pelo nome em português e emite o código', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<DsCountrySelect label="País" onValueChange={onValueChange} />);

        await user.click(screen.getByRole('button', { name: /País/ }));
        expect(screen.getByPlaceholderText('Buscar país…')).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText('Buscar país…'), 'portu');
        await user.keyboard('{ArrowDown}{Enter}');

        expect(onValueChange).toHaveBeenCalledWith('PT');
    });

    it('sem value do pai, guarda o país escolhido', async () => {
        const user = userEvent.setup();
        render(<DsCountrySelect label="País" />);

        await user.click(screen.getByRole('button', { name: /País/ }));
        await user.type(screen.getByPlaceholderText('Buscar país…'), 'portu');
        await user.keyboard('{ArrowDown}{Enter}');

        expect(screen.getByRole('button', { name: /País/ })).toHaveTextContent(
            'Portugal',
        );
    });

    it('mostra o país escolhido com a bandeira', () => {
        render(<DsCountrySelect label="País" value="BR" />);

        const trigger = screen.getByRole('button', { name: /País/ });
        expect(trigger).toHaveTextContent('Brasil');
        expect(trigger).toHaveTextContent('🇧🇷');
    });
});

describe('DsPhoneField', () => {
    it('começa no Brasil e emite o número internacional ao digitar', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<Controlled label="Telefone" onValueChange={onValueChange} />);

        expect(
            screen.getByRole('button', { name: 'País: Brasil' }),
        ).toBeInTheDocument();

        await user.type(screen.getByLabelText('Telefone'), '84999999999');

        expect(onValueChange).toHaveBeenLastCalledWith('+55 84 99999-9999');
        expect(screen.getByLabelText('Telefone')).toHaveValue('84 99999-9999');
    });

    it('trocar o país mantém os dígitos e muda o DDI', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled
                label="Telefone"
                initial="+55 91 2345-6789"
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'País: Brasil' }));
        await user.type(
            screen.getByPlaceholderText('Buscar país…'),
            'portugal',
        );
        await user.keyboard('{ArrowDown}{Enter}');

        expect(onValueChange).toHaveBeenLastCalledWith('+351 912 345 6789');
        await waitFor(() =>
            expect(
                screen.getByRole('button', { name: 'País: Portugal' }),
            ).toBeInTheDocument(),
        );
    });

    it('descobre o país pelo valor recebido', () => {
        render(<DsPhoneField label="Telefone" value="+1 555 123 4567" />);

        expect(
            screen.getByRole('button', { name: 'País: Estados Unidos' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Telefone')).toHaveValue('555 123 4567');
    });

    it('sem seletor de país usa o formato nacional e o placeholder do Vue', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled
                label="Telefone"
                showCountrySelector={false}
                onValueChange={onValueChange}
            />,
        );

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        const input = screen.getByLabelText('Telefone');
        expect(input).toHaveAttribute('placeholder', '(00) 00000-0000');

        await user.type(input, '8433334444');

        expect(onValueChange).toHaveBeenLastCalledWith('(84) 3333-4444');
        expect(input).toHaveValue('(84) 3333-4444');
    });

    it('apagar tudo emite string vazia', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled
                label="Telefone"
                initial="+55 84 9"
                onValueChange={onValueChange}
            />,
        );

        await user.clear(screen.getByLabelText('Telefone'));

        expect(onValueChange).toHaveBeenLastCalledWith('');
    });

    it('colar um número com DDI tira o DDI e não duplica o 55', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<Controlled label="Telefone" onValueChange={onValueChange} />);

        await user.click(screen.getByLabelText('Telefone'));
        await user.paste('+55 84 99999-9999');

        expect(onValueChange).toHaveBeenLastCalledWith('+55 84 99999-9999');
        expect(screen.getByLabelText('Telefone')).toHaveValue('84 99999-9999');
    });

    it('colar um número com DDI de outro país troca o país', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<Controlled label="Telefone" onValueChange={onValueChange} />);

        await user.click(screen.getByLabelText('Telefone'));
        await user.paste('+1 555 123 4567');

        expect(onValueChange).toHaveBeenLastCalledWith('+1 555 123 4567');
        expect(
            screen.getByRole('button', { name: 'País: Estados Unidos' }),
        ).toBeInTheDocument();
    });

    it('sem seletor, colar com +55 tira o DDI', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled
                label="Telefone"
                showCountrySelector={false}
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByLabelText('Telefone'));
        await user.paste('+55 84 99999-9999');

        expect(onValueChange).toHaveBeenLastCalledWith('(84) 99999-9999');
    });

    it('apagar um número estrangeiro mantém o país dele', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled
                label="Telefone"
                initial="+1 555 123 4567"
                onValueChange={onValueChange}
            />,
        );

        const input = screen.getByLabelText('Telefone');
        await user.clear(input);
        await user.type(input, '5551234567');

        expect(onValueChange).toHaveBeenLastCalledWith('+1 555 123 4567');
        expect(
            screen.getByRole('button', { name: 'País: Estados Unidos' }),
        ).toBeInTheDocument();
    });

    it('valor trocado por fora (reset) volta ao país do valor, ou ao padrão', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        function Resettable() {
            const [value, setValue] = useState('+1 555 123 4567');
            return (
                <>
                    <DsPhoneField
                        label="Telefone"
                        value={value}
                        onValueChange={(v) => {
                            setValue(v);
                            onValueChange(v);
                        }}
                    />
                    <button type="button" onClick={() => setValue('')}>
                        Novo
                    </button>
                </>
            );
        }
        render(<Resettable />);

        const input = screen.getByLabelText('Telefone');
        await user.type(input, '8');
        await user.click(screen.getByRole('button', { name: 'Novo' }));
        await user.type(input, '84999999999');

        expect(onValueChange).toHaveBeenLastCalledWith('+55 84 99999-9999');
        expect(
            screen.getByRole('button', { name: 'País: Brasil' }),
        ).toBeInTheDocument();
    });

    it('pai que normaliza o número não troca o Canadá pelos EUA (+1 dividido)', async () => {
        const user = userEvent.setup();
        function Normalizing() {
            const [value, setValue] = useState('');
            return (
                <DsPhoneField
                    label="Telefone"
                    value={value}
                    onValueChange={(v) => setValue(v.replace(/\s/g, ''))}
                />
            );
        }
        render(<Normalizing />);

        await user.click(screen.getByRole('button', { name: 'País: Brasil' }));
        await user.type(screen.getByPlaceholderText('Buscar país…'), 'canadá');
        await user.keyboard('{ArrowDown}{Enter}');
        await user.type(screen.getByLabelText('Telefone'), '4165551234');

        expect(
            screen.getByRole('button', { name: 'País: Canadá' }),
        ).toBeInTheDocument();
    });

    it('invalid mostra o helper ligado ao campo', () => {
        render(
            <DsPhoneField
                label="Telefone"
                invalid
                helperText="Número inválido"
            />,
        );

        const input = screen.getByLabelText('Telefone');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAccessibleDescription('Número inválido');
    });

    it('required mostra asterisco; disabled bloqueia campo e seletor', () => {
        render(<DsPhoneField label="Telefone" required disabled />);

        expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByLabelText(/Telefone/)).toBeDisabled();
        expect(screen.getByRole('button', { name: /País/ })).toBeDisabled();
    });

    it('chama onBlur ao sair do campo', async () => {
        const onBlur = vi.fn();
        const user = userEvent.setup();
        render(<DsPhoneField label="Telefone" onBlur={onBlur} />);

        await user.click(screen.getByLabelText('Telefone'));
        await user.tab();

        expect(onBlur).toHaveBeenCalled();
    });
});
