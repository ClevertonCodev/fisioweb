import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    SEARCH_DEBOUNCE_MS,
    useUserListUrlState,
} from '@/pages/clinic/user/user-list/use-user-list-url-state';
import { routerFutureFlags } from '@/test/browser-router';

function wrapper({ children }: { children: ReactNode }) {
    return (
        <MemoryRouter
            initialEntries={['/clinica/usuarios']}
            future={routerFutureFlags}
        >
            {children}
        </MemoryRouter>
    );
}

function renderUrlState() {
    return renderHook(
        () => ({
            state: useUserListUrlState(),
            location: useLocation(),
            navigate: useNavigate(),
        }),
        { wrapper },
    );
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useUserListUrlState: busca', () => {
    it('a busca só vai para a URL depois de 400ms sem digitar', () => {
        expect(SEARCH_DEBOUNCE_MS).toBe(400);
        const { result } = renderUrlState();

        act(() => result.current.state.setSearchInput('ana'));
        act(() => vi.advanceTimersByTime(399));
        expect(result.current.location.search).toBe('');

        act(() => vi.advanceTimersByTime(1));
        expect(result.current.location.search).toBe('?q=ana');
    });

    it('a tecla digitada enquanto a URL é gravada não se perde', () => {
        const { result } = renderUrlState();

        act(() => result.current.state.setSearchInput('ca'));
        act(() => {
            vi.advanceTimersByTime(400);
            result.current.state.setSearchInput('car');
        });

        expect(result.current.state.searchInput).toBe('car');
        act(() => vi.advanceTimersByTime(400));
        expect(result.current.location.search).toBe('?q=car');
    });

    it('menu para a mesma lista e voltar: o campo acompanha a busca da URL', () => {
        const { result } = renderUrlState();

        act(() => result.current.state.setSearchInput('ana'));
        act(() => vi.advanceTimersByTime(400));
        expect(result.current.location.search).toBe('?q=ana');

        // Clicar em "Usuários" no menu: mesma rota, sem busca.
        act(() => result.current.navigate('/clinica/usuarios'));
        expect(result.current.state.searchInput).toBe('');
        // Voltar no navegador: a busca que já estava gravada volta ao campo.
        act(() => result.current.navigate(-1));
        expect(result.current.state.searchInput).toBe('ana');

        act(() => vi.advanceTimersByTime(400));
        expect(result.current.location.search).toBe('?q=ana');
    });

    it('flushSearch grava na hora a busca ainda no debounce', () => {
        const { result } = renderUrlState();

        act(() => result.current.state.setSearchInput('bia'));
        act(() => result.current.state.flushSearch());

        expect(result.current.location.search).toBe('?q=bia');
    });
});
