import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Filter, Star } from 'lucide-react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DsButton } from '@/components/ds/button/DsButton';
import type { DrawerProps } from '@/components/ds/drawer/DsDrawer';
import { DsDrawer } from '@/components/ds/drawer/DsDrawer';
import type { DropdownItem } from '@/components/ds/dropdown/DsDropdown';
import { DsDropdown } from '@/components/ds/dropdown/DsDropdown';
import type { ModalProps } from '@/components/ds/modal/DsModal';
import { DsModal } from '@/components/ds/modal/DsModal';

function ModalHarness(props: Partial<ModalProps> & { onClose?: () => void }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>
                Abrir
            </button>
            <DsModal
                title="Remarcar sessão"
                {...props}
                open={open}
                onOpenChange={setOpen}
                footer={<DsButton label="Confirmar" />}
            >
                <p>Escolha o novo horário.</p>
                <button type="button">Dentro</button>
            </DsModal>
        </>
    );
}

describe('DsModal', () => {
    it('não renderiza fechado; aberto expõe dialog modal com título, corpo e rodapé', async () => {
        const user = userEvent.setup();
        render(<ModalHarness meta="Paciente fictício" />);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Abrir' }));

        const dialog = screen.getByRole('dialog', { name: 'Remarcar sessão' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('data-size', 'md');
        expect(
            within(dialog).getByText('Escolha o novo horário.'),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByText('Paciente fictício'),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByRole('button', { name: 'Confirmar' }),
        ).toBeInTheDocument();
    });

    it('sem footer não renderiza o rodapé', () => {
        render(
            <DsModal open title="Aviso">
                Texto
            </DsModal>,
        );

        expect(
            screen.getByRole('dialog').querySelector('[data-slot="footer"]'),
        ).toBeNull();
    });

    it('o botão Fechar chama onOpenChange(false) e onClose', async () => {
        const onClose = vi.fn();
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsModal
                open
                title="Aviso"
                onOpenChange={onOpenChange}
                onClose={onClose}
            >
                Texto
            </DsModal>,
        );

        await user.click(screen.getByRole('button', { name: 'Fechar' }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Esc fecha e devolve o foco ao gatilho', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<ModalHarness onClose={onClose} />);

        const trigger = screen.getByRole('button', { name: 'Abrir' });
        await user.click(trigger);
        await user.keyboard('{Escape}');

        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(trigger).toHaveFocus();
    });

    it('prende o foco dentro do modal', async () => {
        const user = userEvent.setup();
        render(<ModalHarness />);

        const trigger = screen.getByRole('button', { name: 'Abrir' });
        await user.click(trigger);
        const dialog = screen.getByRole('dialog');
        for (let i = 0; i < 6; i++) {
            await user.tab();
            expect(dialog).toContainElement(
                document.activeElement as HTMLElement,
            );
        }

        // O Tab volta ao início mesmo sem trap (loop do FocusScope); o trap de
        // verdade aparece quando o foco é mandado para fora.
        act(() => trigger.focus());
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });

    it('clicar no fundo fecha; com closeOnBackdrop=false não fecha', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        const { rerender } = render(
            <DsModal open title="A" onClose={onClose}>
                x
            </DsModal>,
        );

        await user.click(screen.getByTestId('ds-overlay-backdrop'));
        expect(onClose).toHaveBeenCalledTimes(1);

        onClose.mockClear();
        rerender(
            <DsModal open title="A" onClose={onClose} closeOnBackdrop={false}>
                x
            </DsModal>,
        );
        await user.click(screen.getByTestId('ds-overlay-backdrop'));
        expect(onClose).not.toHaveBeenCalled();
    });

    it('trava a rolagem da página enquanto aberto', async () => {
        const user = userEvent.setup();
        render(<ModalHarness />);

        await user.click(screen.getByRole('button', { name: 'Abrir' }));
        expect(document.body).toHaveAttribute('data-scroll-locked');

        await user.keyboard('{Escape}');
        await waitFor(() =>
            expect(document.body).not.toHaveAttribute('data-scroll-locked'),
        );
    });

    it.each(['sm', 'md', 'lg', 'full'] as const)('tamanho %s', (size) => {
        render(
            <DsModal open title="A" size={size}>
                x
            </DsModal>,
        );

        expect(screen.getByRole('dialog')).toHaveAttribute('data-size', size);
    });
});

function DrawerHarness(props: Partial<DrawerProps>) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>
                Abrir drawer
            </button>
            <DsDrawer
                title="Filtros"
                {...props}
                open={open}
                onOpenChange={setOpen}
            >
                <button type="button">Campo</button>
            </DsDrawer>
        </>
    );
}

describe('DsDrawer', () => {
    it('não renderiza fechado; aberto expõe dialog com placement e size padrão', async () => {
        const user = userEvent.setup();
        render(<DrawerHarness />);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Abrir drawer' }));

        const dialog = screen.getByRole('dialog', { name: 'Filtros' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('data-placement', 'right');
        expect(dialog).toHaveAttribute('data-size', 'md');
    });

    it('placement left marca o drawer à esquerda', () => {
        render(
            <DsDrawer open title="Menu" placement="left" size="sm">
                Corpo
            </DsDrawer>,
        );

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('data-placement', 'left');
        expect(dialog).toHaveClass('left-0');
    });

    it('placement, size, meta, footer e surfaceClass', () => {
        render(
            <DsDrawer
                open
                title="Detalhes"
                meta="Atualizado agora"
                placement="bottom"
                size="lg"
                surfaceClass="classe-extra"
                footer={<span>Rodapé</span>}
            >
                Corpo
            </DsDrawer>,
        );

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('data-placement', 'bottom');
        expect(dialog).toHaveAttribute('data-size', 'lg');
        expect(dialog).toHaveClass('classe-extra');
        expect(
            within(dialog).getByText('Atualizado agora'),
        ).toBeInTheDocument();
        expect(within(dialog).getByText('Rodapé')).toBeInTheDocument();
        expect(within(dialog).getByText('Corpo')).toBeInTheDocument();
    });

    it('sem footer não renderiza o rodapé', () => {
        render(
            <DsDrawer open title="A">
                x
            </DsDrawer>,
        );

        expect(
            screen.getByRole('dialog').querySelector('[data-slot="footer"]'),
        ).toBeNull();
    });

    it('Fechar, Esc e fundo fecham chamando onClose', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<DrawerHarness onClose={onClose} />);
        const trigger = screen.getByRole('button', { name: 'Abrir drawer' });

        await user.click(trigger);
        await user.click(screen.getByRole('button', { name: 'Fechar' }));
        await user.click(trigger);
        await user.keyboard('{Escape}');
        await user.click(trigger);
        await user.click(screen.getByTestId('ds-overlay-backdrop'));

        expect(onClose).toHaveBeenCalledTimes(3);
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(trigger).toHaveFocus();
    });

    it('closeOnBackdrop=false não fecha pelo fundo', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(
            <DsDrawer open title="A" closeOnBackdrop={false} onClose={onClose}>
                x
            </DsDrawer>,
        );

        await user.click(screen.getByTestId('ds-overlay-backdrop'));

        expect(onClose).not.toHaveBeenCalled();
    });

    it('prende o foco dentro do drawer', async () => {
        const user = userEvent.setup();
        render(<DrawerHarness />);

        const trigger = screen.getByRole('button', { name: 'Abrir drawer' });
        await user.click(trigger);
        const dialog = screen.getByRole('dialog');
        for (let i = 0; i < 6; i++) {
            await user.tab();
            expect(dialog).toContainElement(
                document.activeElement as HTMLElement,
            );
        }

        // O Tab sozinho não prova o trap: o FocusScope do Radix tem `loop`
        // mesmo sem trap. Mandar o foco para fora é o que separa os dois.
        act(() => trigger.focus());
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });

    it('libera a rolagem da página depois que o drawer fecha', async () => {
        const user = userEvent.setup();
        render(<DrawerHarness />);

        await user.click(screen.getByRole('button', { name: 'Abrir drawer' }));
        expect(document.body).toHaveAttribute('data-scroll-locked');

        await user.keyboard('{Escape}');
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(document.body).not.toHaveAttribute('data-scroll-locked');
    });

    it('Esc com o drawer fechado não chama onClose', async () => {
        const onClose = vi.fn();
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsDrawer
                open={false}
                title="A"
                onOpenChange={onOpenChange}
                onClose={onClose}
            >
                x
            </DsDrawer>,
        );

        await user.keyboard('{Escape}');

        expect(onClose).not.toHaveBeenCalled();
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('com dois drawers abertos, Esc fecha só o de cima e a rolagem continua travada', async () => {
        const user = userEvent.setup();

        function Stack() {
            const [first, setFirst] = useState(true);
            const [second, setSecond] = useState(true);
            return (
                <>
                    <DsDrawer
                        open={first}
                        onOpenChange={setFirst}
                        title="Primeiro"
                    >
                        a
                    </DsDrawer>
                    <DsDrawer
                        open={second}
                        onOpenChange={setSecond}
                        title="Segundo"
                    >
                        b
                    </DsDrawer>
                </>
            );
        }
        render(<Stack />);

        await user.keyboard('{Escape}');

        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', { name: 'Segundo' }),
            ).not.toBeInTheDocument(),
        );
        expect(
            screen.getByRole('dialog', { name: 'Primeiro' }),
        ).toBeInTheDocument();
        expect(document.body).toHaveAttribute('data-scroll-locked');
    });
});

const ITEMS: DropdownItem[] = [
    { key: 'hoje', label: 'Hoje' },
    {
        key: 'semana',
        label: 'Esta semana',
        icon: <Star data-testid="icone-item" />,
    },
    { key: 'mes', label: 'Este mês', badge: 'Novo' },
    { key: 'ano', label: 'Este ano', disabled: true },
];

describe('DsDropdown', () => {
    it('mostra o placeholder padrão e expõe aria-haspopup', () => {
        render(<DsDropdown items={ITEMS} />);

        const trigger = screen.getByRole('button', { name: /Selecionar/ });
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('mostra o rótulo do selecionado, ou o fixedLabel', () => {
        const { rerender } = render(
            <DsDropdown items={ITEMS} value="semana" />,
        );
        expect(screen.getByRole('button')).toHaveTextContent('Esta semana');

        rerender(
            <DsDropdown items={ITEMS} value="semana" fixedLabel="Período" />,
        );
        expect(screen.getByRole('button')).toHaveTextContent('Período');
    });

    it('mostra o ícone do gatilho', () => {
        render(
            <DsDropdown items={ITEMS} icon={<Filter data-testid="icone" />} />,
        );

        expect(screen.getByTestId('icone')).toBeInTheDocument();
    });

    it('abre ao clicar, lista os itens e fecha ao escolher (modo text)', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsDropdown
                items={ITEMS}
                onValueChange={onValueChange}
                menuTitle="Período"
            />,
        );

        await user.click(screen.getByRole('button'));
        const menu = screen.getByRole('menu');
        expect(within(menu).getAllByRole('menuitem')).toHaveLength(4);
        expect(within(menu).getByText('Período')).toBeInTheDocument();
        expect(within(menu).getByText('Novo')).toBeInTheDocument();
        expect(within(menu).getByTestId('icone-item')).toBeInTheDocument();

        await user.click(screen.getByRole('menuitem', { name: 'Esta semana' }));

        expect(onValueChange).toHaveBeenCalledWith('semana');
        await waitFor(() =>
            expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
        );
    });

    it('marca o item selecionado', async () => {
        const user = userEvent.setup();
        render(<DsDropdown items={ITEMS} value="hoje" />);

        await user.click(screen.getByRole('button'));

        expect(screen.getByRole('menuitem', { name: 'Hoje' })).toHaveAttribute(
            'data-selected',
            'true',
        );
    });

    it('item disabled não é escolhido', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<DsDropdown items={ITEMS} onValueChange={onValueChange} />);

        await user.click(screen.getByRole('button'));
        await user.click(screen.getByRole('menuitem', { name: 'Este ano' }));

        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('modo checkbox acumula e mantém aberto', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();

        function Controlled() {
            const [value, setValue] = useState<string[]>([]);
            return (
                <DsDropdown
                    items={ITEMS}
                    mode="checkbox"
                    value={value}
                    onValueChange={(v) => {
                        setValue(v as string[]);
                        onValueChange(v);
                    }}
                />
            );
        }
        render(<Controlled />);

        await user.click(screen.getByRole('button'));
        await user.click(
            screen.getByRole('menuitemcheckbox', { name: 'Hoje' }),
        );
        await user.click(
            screen.getByRole('menuitemcheckbox', { name: 'Este mês' }),
        );

        expect(onValueChange).toHaveBeenLastCalledWith(['hoje', 'mes']);
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(
            screen.getByRole('menuitemcheckbox', { name: 'Hoje' }),
        ).toHaveAttribute('aria-checked', 'true');

        await user.click(
            screen.getByRole('menuitemcheckbox', { name: 'Hoje' }),
        );
        expect(onValueChange).toHaveBeenLastCalledWith(['mes']);
    });

    it('modo radio marca um só', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsDropdown
                items={ITEMS}
                mode="radio"
                value="hoje"
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('button'));
        expect(
            screen.getByRole('menuitemradio', { name: 'Hoje' }),
        ).toHaveAttribute('aria-checked', 'true');
        await user.click(
            screen.getByRole('menuitemradio', { name: 'Este mês' }),
        );

        expect(onValueChange).toHaveBeenCalledWith('mes');
    });

    it('fecha ao clicar fora', async () => {
        const user = userEvent.setup();
        render(
            <>
                <DsDropdown items={ITEMS} />
                <p>fora</p>
            </>,
        );

        await user.click(screen.getByRole('button'));
        await user.click(document.body);

        await waitFor(() =>
            expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
        );
    });

    it('teclado: Enter e seta abrem, setas navegam, Enter escolhe, Esc fecha e devolve o foco', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<DsDropdown items={ITEMS} onValueChange={onValueChange} />);

        const trigger = screen.getByRole('button');
        await user.tab();
        await user.keyboard('{Enter}');
        expect(screen.getByRole('menu')).toBeInTheDocument();
        await user.keyboard('{Escape}');
        await waitFor(() =>
            expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
        );
        expect(trigger).toHaveFocus();

        await user.keyboard('{ArrowDown}');
        await waitFor(() =>
            expect(
                screen.getByRole('menuitem', { name: 'Hoje' }),
            ).toHaveFocus(),
        );
        await user.keyboard('{ArrowDown}{Enter}');

        expect(onValueChange).toHaveBeenCalledWith('semana');
    });
});
