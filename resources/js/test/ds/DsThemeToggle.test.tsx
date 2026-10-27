import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    DS_THEME_STORAGE_KEY,
    DsThemeToggle,
    useDsTheme,
} from '@/components/ds';
import { resetDsThemeStoreForTests } from '@/components/ds/theme/useDsTheme';

const html = document.documentElement;

describe('DsThemeToggle', () => {
    beforeEach(() => {
        localStorage.clear();
        html.removeAttribute('data-theme');
        resetDsThemeStoreForTests();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('começa no tema claro quando não há escolha salva', () => {
        render(<DsThemeToggle />);

        expect(html.dataset.theme).toBe('light');
        expect(
            screen.getByRole('button', { name: 'Ativar tema escuro' }),
        ).toBeInTheDocument();
    });

    it('alterna para o escuro e grava a escolha', async () => {
        const user = userEvent.setup();
        render(<DsThemeToggle />);

        await user.click(
            screen.getByRole('button', { name: 'Ativar tema escuro' }),
        );

        expect(html.dataset.theme).toBe('dark');
        expect(localStorage.getItem(DS_THEME_STORAGE_KEY)).toBe('dark');
        expect(
            screen.getByRole('button', { name: 'Ativar tema claro' }),
        ).toBeInTheDocument();
    });

    it('volta para o claro no segundo clique', async () => {
        const user = userEvent.setup();
        render(<DsThemeToggle />);
        const button = screen.getByRole('button');

        await user.click(button);
        await user.click(button);

        expect(html.dataset.theme).toBe('light');
        expect(localStorage.getItem(DS_THEME_STORAGE_KEY)).toBe('light');
    });

    it('reaplica o tema salvo ao montar', () => {
        localStorage.setItem(DS_THEME_STORAGE_KEY, 'dark');

        render(<DsThemeToggle />);

        expect(html.dataset.theme).toBe('dark');
    });

    it('ignora valor salvo inválido', () => {
        localStorage.setItem(DS_THEME_STORAGE_KEY, 'roxo');

        render(<DsThemeToggle />);

        expect(html.dataset.theme).toBe('light');
    });

    it('não quebra quando o localStorage lança erro', async () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('bloqueado');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('bloqueado');
        });
        const user = userEvent.setup();

        render(<DsThemeToggle />);
        await user.click(screen.getByRole('button'));

        expect(html.dataset.theme).toBe('dark');
    });

    it('duas instâncias compartilham o mesmo tema', async () => {
        const user = userEvent.setup();
        render(
            <>
                <DsThemeToggle />
                <DsThemeToggle />
            </>,
        );
        const [first, second] = screen.getAllByRole('button');

        await user.click(first);

        expect(first).toHaveAccessibleName('Ativar tema claro');
        expect(second).toHaveAccessibleName('Ativar tema claro');

        await user.click(second);

        expect(first).toHaveAccessibleName('Ativar tema escuro');
        expect(html.dataset.theme).toBe('light');
    });

    it('quem só lê useDsTheme recebe o tema novo', async () => {
        function ThemeProbe() {
            const { theme } = useDsTheme();
            return <span data-testid="probe">{theme}</span>;
        }
        const user = userEvent.setup();
        render(
            <>
                <ThemeProbe />
                <DsThemeToggle />
            </>,
        );

        expect(screen.getByTestId('probe')).toHaveTextContent('light');

        await user.click(screen.getByRole('button'));

        expect(screen.getByTestId('probe')).toHaveTextContent('dark');
    });

    it('aplica o tema salvo na primeira leitura, antes dos efeitos', () => {
        localStorage.setItem(DS_THEME_STORAGE_KEY, 'dark');
        let themeDuringRender: string | undefined;
        function RenderSpy() {
            useDsTheme();
            themeDuringRender = html.dataset.theme;
            return null;
        }

        render(<RenderSpy />);

        expect(themeDuringRender).toBe('dark');
    });

    it('segue a troca de tema feita em outra aba', () => {
        render(<DsThemeToggle />);

        act(() => {
            localStorage.setItem(DS_THEME_STORAGE_KEY, 'dark');
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: DS_THEME_STORAGE_KEY,
                    newValue: 'dark',
                }),
            );
        });

        expect(html.dataset.theme).toBe('dark');
        expect(
            screen.getByRole('button', { name: 'Ativar tema claro' }),
        ).toBeInTheDocument();
    });

    it('ignora evento de storage de outra chave', () => {
        render(<DsThemeToggle />);

        act(() => {
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: 'outra-chave',
                    newValue: 'dark',
                }),
            );
        });

        expect(html.dataset.theme).toBe('light');
    });

    it('volta ao tema claro quando outra aba limpa o storage', () => {
        localStorage.setItem(DS_THEME_STORAGE_KEY, 'dark');
        render(<DsThemeToggle />);
        expect(html.dataset.theme).toBe('dark');

        act(() => {
            localStorage.clear();
            window.dispatchEvent(new StorageEvent('storage', { key: null }));
        });

        expect(html.dataset.theme).toBe('light');
        expect(
            screen.getByRole('button', { name: 'Ativar tema escuro' }),
        ).toBeInTheDocument();
    });
});
