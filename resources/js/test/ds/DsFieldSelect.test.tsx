import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldSelectProps, SelectOption } from '@/components/ds';
import { DsFieldSelect, DsFieldSelectOptions } from '@/components/ds';

const options: SelectOption[] = [
    { value: 'along', label: 'Alongamento' },
    { value: 'forca', label: 'Fortalecimento' },
    { value: 'equil', label: 'Equilíbrio' },
    { value: 'resp', label: 'Respiratório', disabled: true },
];

function Controlled(
    props: Omit<FieldSelectProps, 'value' | 'onValueChange'> & {
        initial?: string | string[];
        onValueChange?: (v: string | string[]) => void;
    },
) {
    const { initial, onValueChange, ...rest } = props;
    const [value, setValue] = useState<string | string[] | undefined>(initial);
    return (
        <DsFieldSelect
            {...rest}
            value={value}
            onValueChange={(v) => {
                setValue(v);
                onValueChange?.(v);
            }}
        />
    );
}

describe('DsFieldSelect', () => {
    it('mostra o placeholder e abre a lista ao clicar', async () => {
        const onOpen = vi.fn();
        const user = userEvent.setup();
        render(
            <DsFieldSelect
                options={options}
                label="Categoria"
                onOpen={onOpen}
            />,
        );

        const trigger = screen.getByRole('button', { name: /Categoria/ });
        expect(trigger).toHaveTextContent('Selecione...');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');

        await user.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getAllByRole('option')).toHaveLength(4);
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('single: escolhe, fecha e mostra o rótulo no gatilho', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled
                options={options}
                label="Categoria"
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Categoria/ }));
        await user.click(
            screen.getByRole('option', { name: 'Fortalecimento' }),
        );

        expect(onValueChange).toHaveBeenCalledWith('forca');
        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );
        expect(
            screen.getByRole('button', { name: /Categoria/ }),
        ).toHaveTextContent('Fortalecimento');
    });

    it('marca a opção selecionada com aria-selected', async () => {
        const user = userEvent.setup();
        render(
            <DsFieldSelect options={options} label="Categoria" value="equil" />,
        );

        await user.click(screen.getByRole('button', { name: /Categoria/ }));

        expect(
            screen.getByRole('option', { name: 'Equilíbrio' }),
        ).toHaveAttribute('aria-selected', 'true');
        expect(
            screen.getByRole('option', { name: 'Alongamento' }),
        ).toHaveAttribute('aria-selected', 'false');
    });

    it('ao abrir, rola a lista até a opção selecionada', async () => {
        const scrollIntoView = vi.fn();
        Element.prototype.scrollIntoView = scrollIntoView;
        const user = userEvent.setup();
        render(
            <DsFieldSelect options={options} label="Categoria" value="equil" />,
        );

        await user.click(screen.getByRole('button', { name: /Categoria/ }));

        await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
        expect(scrollIntoView.mock.contexts.at(-1)).toHaveTextContent(
            'Equilíbrio',
        );
        delete (Element.prototype as Partial<Element>).scrollIntoView;
    });

    it('required põe o asterisco vermelho no rótulo e aria-required no gatilho', () => {
        render(<DsFieldSelect options={options} label="Categoria" required />);

        expect(
            screen.getByRole('button', { name: /Categoria/ }),
        ).toHaveAttribute('aria-required', 'true');
        expect(screen.getByText('*')).toHaveClass(
            'text-ds-status-danger-content',
        );
    });

    it('opção disabled não é escolhida', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsFieldSelect
                options={options}
                label="Categoria"
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Categoria/ }));
        await user.click(screen.getByRole('option', { name: 'Respiratório' }));

        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('multi: marca e desmarca vários, mantém aberto e mostra os rótulos', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled
                options={options}
                mode="multi"
                label="Categorias"
                initial={[]}
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Categorias/ }));
        expect(screen.getByRole('listbox')).toHaveAttribute(
            'aria-multiselectable',
            'true',
        );

        await user.click(screen.getByRole('option', { name: 'Alongamento' }));
        await user.click(screen.getByRole('option', { name: 'Equilíbrio' }));
        expect(onValueChange).toHaveBeenLastCalledWith(['along', 'equil']);

        await user.click(screen.getByRole('option', { name: 'Alongamento' }));
        expect(onValueChange).toHaveBeenLastCalledWith(['equil']);

        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Categorias/ }),
        ).toHaveTextContent('Equilíbrio');
    });

    it('multi com multiDisplay="count" mostra a quantidade', () => {
        render(
            <DsFieldSelect
                options={options}
                mode="multi"
                multiDisplay="count"
                value={['along', 'forca']}
                label="Categorias"
            />,
        );

        expect(
            screen.getByRole('button', { name: /Categorias/ }),
        ).toHaveTextContent('2 selecionados');
    });

    it('multi: Limpar zera e Aplicar fecha chamando onApply e onClose', async () => {
        const onApply = vi.fn();
        const onClose = vi.fn();
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled
                options={options}
                mode="multi"
                label="Categorias"
                initial={['along']}
                onValueChange={onValueChange}
                onApply={onApply}
                onClose={onClose}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Categorias/ }));
        await user.click(screen.getByRole('button', { name: 'Limpar' }));
        expect(onValueChange).toHaveBeenLastCalledWith([]);
        expect(screen.getByRole('button', { name: 'Limpar' })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Aplicar' }));
        expect(onApply).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );
    });

    it('multi: hideApplyButton esconde Aplicar; footerLinkLabel chama onFooterLinkClick', async () => {
        const onFooterLinkClick = vi.fn();
        const user = userEvent.setup();
        render(
            <DsFieldSelect
                options={options}
                mode="multi"
                label="Categorias"
                value={[]}
                hideApplyButton
                footerLinkLabel="Nova categoria"
                onFooterLinkClick={onFooterLinkClick}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Categorias/ }));
        expect(
            screen.queryByRole('button', { name: 'Aplicar' }),
        ).not.toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: 'Nova categoria' }),
        );
        expect(onFooterLinkClick).toHaveBeenCalledTimes(1);
    });

    it('multi: hideSelectedInMenu tira os já escolhidos da lista', async () => {
        const user = userEvent.setup();
        render(
            <DsFieldSelect
                options={options}
                mode="multi"
                hideSelectedInMenu
                value={['along']}
                label="Categorias"
            />,
        );

        await user.click(screen.getByRole('button', { name: /Categorias/ }));

        expect(
            screen.queryByRole('option', { name: 'Alongamento' }),
        ).not.toBeInTheDocument();
        expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    it('search: foca a busca, filtra e chama onSearch', async () => {
        const onSearch = vi.fn();
        const user = userEvent.setup();
        render(
            <DsFieldSelect
                options={options}
                mode="search"
                label="Categoria"
                onSearch={onSearch}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Categoria/ }));
        const search = screen.getByPlaceholderText('Buscar...');
        await waitFor(() => expect(search).toHaveFocus());

        await user.type(search, 'forta');

        expect(screen.getAllByRole('option')).toHaveLength(1);
        expect(screen.getByRole('option')).toHaveTextContent('Fortalecimento');
        expect(onSearch).toHaveBeenLastCalledWith('forta');
    });

    it('search: não chama onSearch ao montar nem ao abrir, só quando o termo muda', async () => {
        const onSearch = vi.fn();
        const user = userEvent.setup();
        render(
            <DsFieldSelect
                options={options}
                mode="search"
                label="Categoria"
                onSearch={onSearch}
            />,
        );

        const trigger = screen.getByRole('button', { name: /Categoria/ });
        await user.click(trigger);
        await user.keyboard('{Escape}');
        expect(onSearch).not.toHaveBeenCalled();

        await user.click(trigger);
        await user.type(screen.getByPlaceholderText('Buscar...'), 'a');
        await user.keyboard('{Escape}');

        expect(onSearch.mock.calls).toEqual([['a'], ['']]);
    });

    it('search: mostra mensagem sem resultado e limpa a busca', async () => {
        const user = userEvent.setup();
        render(
            <DsFieldSelect options={options} mode="search" label="Categoria" />,
        );

        await user.click(screen.getByRole('button', { name: /Categoria/ }));
        await user.type(screen.getByPlaceholderText('Buscar...'), 'xyz');

        expect(
            screen.getByText('Nenhum resultado para "xyz"'),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Limpar busca' }));
        expect(screen.getAllByRole('option')).toHaveLength(4);
    });

    it('search: minSearchLength pede mais caracteres', async () => {
        const user = userEvent.setup();
        render(
            <DsFieldSelect
                options={options}
                mode="search"
                minSearchLength={3}
                label="Categoria"
            />,
        );

        await user.click(screen.getByRole('button', { name: /Categoria/ }));
        await user.type(screen.getByPlaceholderText('Buscar...'), 'al');

        expect(
            screen.getByText('Digite ao menos 3 caracteres para buscar'),
        ).toBeInTheDocument();
        expect(screen.queryAllByRole('option')).toHaveLength(0);
    });

    it('teclado: setas navegam, Enter escolhe, Esc fecha e devolve o foco', async () => {
        const onValueChange = vi.fn();
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled
                options={options}
                label="Categoria"
                onValueChange={onValueChange}
                onClose={onClose}
            />,
        );

        const trigger = screen.getByRole('button', { name: /Categoria/ });
        await user.tab();
        expect(trigger).toHaveFocus();
        await user.keyboard('{Enter}');

        const listbox = await screen.findByRole('listbox');
        await waitFor(() => expect(listbox).toHaveFocus());
        await user.keyboard('{ArrowDown}{ArrowDown}');
        const active = listbox.getAttribute('aria-activedescendant');
        expect(document.getElementById(active!)).toHaveTextContent(
            'Fortalecimento',
        );

        await user.keyboard('{Enter}');
        expect(onValueChange).toHaveBeenLastCalledWith('forca');

        await user.click(trigger);
        await screen.findByRole('listbox');
        await user.keyboard('{Escape}');
        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );
        expect(trigger).toHaveFocus();
        expect(onClose).toHaveBeenCalled();
    });

    it('teclado: as setas pulam opções disabled', async () => {
        const user = userEvent.setup();
        render(
            <DsFieldSelect
                options={[
                    { value: 'a', label: 'A' },
                    { value: 'b', label: 'B', disabled: true },
                    { value: 'c', label: 'C' },
                ]}
                label="Letra"
            />,
        );

        await user.click(screen.getByRole('button', { name: /Letra/ }));
        const listbox = screen.getByRole('listbox');
        await waitFor(() => expect(listbox).toHaveFocus());
        await user.keyboard('{ArrowDown}{ArrowDown}');

        expect(
            document.getElementById(
                listbox.getAttribute('aria-activedescendant')!,
            ),
        ).toHaveTextContent('C');
    });

    it('disabled não abre', async () => {
        const user = userEvent.setup();
        render(<DsFieldSelect options={options} label="Categoria" disabled />);

        await user.click(screen.getByRole('button', { name: /Categoria/ }));

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('estado de erro mostra helper descrito e ícone', () => {
        render(
            <DsFieldSelect
                options={options}
                label="Categoria"
                state="error"
                helper="Escolha uma categoria"
            />,
        );

        const trigger = screen.getByRole('button', { name: /Categoria/ });
        expect(trigger).toHaveAccessibleDescription('Escolha uma categoria');
        expect(trigger).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByTestId('ds-state-icon-error')).toBeInTheDocument();
    });

    describe('onBlur (React Hook Form)', () => {
        function renderWithNext(props: Partial<FieldSelectProps> = {}) {
            const onBlur = vi.fn();
            const onClose = vi.fn();
            render(
                <>
                    <DsFieldSelect
                        options={options}
                        label="Categoria"
                        onBlur={onBlur}
                        onClose={onClose}
                        {...props}
                    />
                    <input aria-label="Próximo" />
                </>,
            );
            return {
                onBlur,
                onClose,
                trigger: screen.getByRole('button', { name: /Categoria/ }),
                next: screen.getByLabelText('Próximo'),
            };
        }

        it('chama onBlur ao sair do gatilho com Tab', async () => {
            const user = userEvent.setup();
            const { onBlur, trigger, next } = renderWithNext();

            trigger.focus();
            await user.tab();

            expect(next).toHaveFocus();
            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('chama onBlur ao clicar em outro campo com a lista fechada', async () => {
            const user = userEvent.setup();
            const { onBlur, trigger, next } = renderWithNext();

            trigger.focus();
            await user.click(next);

            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('não chama onBlur ao abrir (o foco entra na lista)', async () => {
            const user = userEvent.setup();
            const { onBlur, trigger } = renderWithNext();

            await user.click(trigger);
            await screen.findByRole('listbox');

            expect(onBlur).not.toHaveBeenCalled();
        });

        it('chama onBlur uma vez ao clicar em outro campo com a lista aberta', async () => {
            const user = userEvent.setup();
            const { onBlur, trigger, next } = renderWithNext();

            await user.click(trigger);
            await screen.findByRole('listbox');
            await user.click(next);

            await waitFor(() =>
                expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
            );
            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('chama onBlur ao sair da lista aberta pelo teclado', async () => {
            const user = userEvent.setup();
            const { onBlur, trigger, next } = renderWithNext();

            await user.click(trigger);
            const listbox = await screen.findByRole('listbox');
            await waitFor(() => expect(listbox).toHaveFocus());
            // O portal fica no fim do body; Shift+Tab volta para o input.
            await user.tab({ shift: true });

            expect(next).toHaveFocus();
            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('não repete onBlur quando a saída do foco e o clique fora chegam juntos', async () => {
            // No navegador a animação de saída mantém a lista montada enquanto
            // o foco vai para o outro campo; aqui os dois eventos vão à mão.
            const user = userEvent.setup();
            const { onBlur, trigger, next } = renderWithNext();

            await user.click(trigger);
            const listbox = await screen.findByRole('listbox');
            fireEvent.focusOut(listbox, { relatedTarget: next });
            fireEvent.pointerDown(next);

            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('single: escolher fecha e chama onClose e onBlur', async () => {
            const user = userEvent.setup();
            const { onBlur, onClose, trigger } = renderWithNext();

            await user.click(trigger);
            await user.click(
                screen.getByRole('option', { name: 'Fortalecimento' }),
            );

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('multi: marcar não fecha nem chama onBlur', async () => {
            const user = userEvent.setup();
            const { onBlur, onClose, trigger } = renderWithNext({
                mode: 'multi',
            });

            await user.click(trigger);
            await user.click(
                screen.getByRole('option', { name: 'Fortalecimento' }),
            );

            expect(screen.getByRole('listbox')).toBeInTheDocument();
            expect(onClose).not.toHaveBeenCalled();
            expect(onBlur).not.toHaveBeenCalled();
        });
    });

    it('renderiza a lista num portal, fora de um pai com overflow hidden', async () => {
        const user = userEvent.setup();
        render(
            <div data-testid="recorte" style={{ overflow: 'hidden' }}>
                <DsFieldSelect options={options} label="Categoria" />
            </div>,
        );

        await user.click(screen.getByRole('button', { name: /Categoria/ }));

        const listbox = await screen.findByRole('listbox');
        expect(screen.getByTestId('recorte')).not.toContainElement(listbox);
    });
});

describe('DsFieldSelectOptions', () => {
    const countries: SelectOption[] = [
        { value: 'BR', label: 'Brasil', flagCode: 'br' },
        { value: 'PT', label: 'Portugal', flagCode: 'pt' },
        { value: 'AR', label: 'Argentina', flagCode: 'ar' },
    ];

    it('mostra a bandeira da opção escolhida no gatilho e nas opções', async () => {
        const user = userEvent.setup();
        render(
            <DsFieldSelectOptions
                options={countries}
                label="País"
                value="PT"
            />,
        );

        const trigger = screen.getByRole('button', { name: /País/ });
        expect(trigger).toHaveTextContent('Portugal');
        expect(within(trigger).getByTestId('ds-flag')).toHaveTextContent('🇵🇹');

        await user.click(trigger);
        expect(
            within(screen.getByRole('option', { name: /Brasil/ })).getByTestId(
                'ds-flag',
            ),
        ).toHaveTextContent('🇧🇷');
    });

    it('search filtra pelo nome do país', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsFieldSelectOptions
                options={countries}
                mode="search"
                label="País"
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: /País/ }));
        await user.type(screen.getByPlaceholderText('Buscar...'), 'port');
        await user.keyboard('{ArrowDown}{Enter}');

        expect(onValueChange).toHaveBeenCalledWith('PT');
    });
});
