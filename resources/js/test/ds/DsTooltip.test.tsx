import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DsTooltip } from '@/components/ds';

const BUBBLE_WIDTH = 260;
const BUBBLE_HEIGHT = 60;

/** jsdom não faz layout: simula a viewport, o gatilho e o tamanho do balão. */
function stubLayout(triggerRect: Partial<DOMRect>) {
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(
        1024,
    );
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(
        768,
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
        function (this: HTMLElement) {
            if (this.dataset.dsTooltipTrigger !== undefined) {
                return {
                    top: 0,
                    left: 0,
                    width: 16,
                    height: 16,
                    right: 16,
                    bottom: 16,
                    x: triggerRect.left ?? 0,
                    y: triggerRect.top ?? 0,
                    ...triggerRect,
                    toJSON: () => ({}),
                } as DOMRect;
            }
            return {
                top: 0,
                left: 0,
                width: BUBBLE_WIDTH,
                height: BUBBLE_HEIGHT,
                right: BUBBLE_WIDTH,
                bottom: BUBBLE_HEIGHT,
                x: 0,
                y: 0,
                toJSON: () => ({}),
            } as DOMRect;
        },
    );
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(
        BUBBLE_WIDTH,
    );
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(
        BUBBLE_HEIGHT,
    );
}

function bubble() {
    const el = document.querySelector<HTMLElement>('[data-ds-tooltip-bubble]');
    if (!el) throw new Error('Tooltip não renderizou.');
    return el;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('DsTooltip', () => {
    it('mostra o conteúdo ao passar o mouse e esconde ao sair', async () => {
        const user = userEvent.setup();
        render(
            <DsTooltip content="Excluir paciente">
                <span>alvo</span>
            </DsTooltip>,
        );

        await user.hover(screen.getByText('alvo'));
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
            'Excluir paciente',
        );

        await user.unhover(screen.getByText('alvo'));
        await waitFor(() =>
            expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
        );
    });

    it('mostra o conteúdo quando o filho recebe foco pelo teclado', async () => {
        const user = userEvent.setup();
        render(
            <DsTooltip content="Atualizar lista">
                <button type="button">ícone</button>
            </DsTooltip>,
        );

        await user.tab();

        expect(await screen.findByRole('tooltip')).toHaveTextContent(
            'Atualizar lista',
        );
    });

    it('não mostra nada quando o conteúdo é nulo', async () => {
        const user = userEvent.setup();
        render(
            <DsTooltip content={null}>
                <span>alvo</span>
            </DsTooltip>,
        );

        await user.hover(screen.getByText('alvo'));

        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('vira para baixo quando não há espaço acima do gatilho', async () => {
        stubLayout({
            top: 10,
            left: 400,
            right: 416,
            bottom: 26,
            y: 10,
            x: 400,
        });
        const user = userEvent.setup();
        render(
            <DsTooltip
                content="Texto bem longo que precisa quebrar em várias linhas"
                placement="top"
            >
                <span>alvo</span>
            </DsTooltip>,
        );

        await user.hover(screen.getByText('alvo'));

        await waitFor(() =>
            expect(bubble()).toHaveAttribute('data-side', 'bottom'),
        );
    });

    it('mantém o lado pedido quando há espaço', async () => {
        stubLayout({
            top: 400,
            left: 400,
            right: 416,
            bottom: 416,
            y: 400,
            x: 400,
        });
        const user = userEvent.setup();
        render(
            <DsTooltip content="Dica" placement="right">
                <span>alvo</span>
            </DsTooltip>,
        );

        await user.hover(screen.getByText('alvo'));

        await waitFor(() =>
            expect(bubble()).toHaveAttribute('data-side', 'right'),
        );
    });
});
