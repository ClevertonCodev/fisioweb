import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
    parseUserListFilters,
    serializeUserListFilters,
    type UserListFilters,
} from '@/application/clinic/user-list-filters';

export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Filtros da lista lidos da URL e escritos de volta nela (com `replace`, para
 * o "voltar" do navegador sair da lista). A busca digitada só vai para a URL
 * depois do debounce.
 */
export function useUserListUrlState() {
    const [params, setParams] = useSearchParams();
    const filters = useMemo(() => parseUserListFilters(params), [params]);

    const update = useCallback(
        (patch: Partial<UserListFilters>) => {
            setParams(
                (prev) =>
                    serializeUserListFilters({
                        ...parseUserListFilters(prev),
                        ...patch,
                    }),
                { replace: true },
            );
        },
        [setParams],
    );

    const [searchInput, setSearchInput] = useState(filters.search);
    // O que o próprio debounce acabou de gravar na URL. Vale uma vez só:
    // quando a URL chega com esse valor, o campo não é reescrito (a pessoa
    // pode ter digitado mais enquanto a URL era gravada, e a tecla se
    // perderia); depois disso, a URL volta a mandar no campo.
    const [writtenSearch, setWrittenSearch] = useState<string | null>(null);
    // A URL mudou por fora (voltar do navegador, link): o campo acompanha.
    // Quando a mudança é a própria busca indo para a URL (sem os espaços das
    // pontas), o campo fica como a pessoa digitou.
    const [syncedSearch, setSyncedSearch] = useState(filters.search);
    if (syncedSearch !== filters.search) {
        setSyncedSearch(filters.search);
        if (filters.search === writtenSearch) {
            setWrittenSearch(null);
        } else if (filters.search !== searchInput.trim()) {
            setWrittenSearch(null);
            setSearchInput(filters.search);
        }
    }

    const writeSearch = useCallback(
        (search: string) => {
            setWrittenSearch(search.trim());
            update({ search });
        },
        [update],
    );

    useEffect(() => {
        if (searchInput.trim() === filters.search) return;
        const timer = setTimeout(
            () => writeSearch(searchInput),
            SEARCH_DEBOUNCE_MS,
        );
        return () => clearTimeout(timer);
    }, [searchInput, filters.search, writeSearch]);

    /** Grava já a busca ainda no debounce (antes de sair da tela). */
    const flushSearch = () => {
        if (searchInput.trim() !== filters.search) writeSearch(searchInput);
    };

    return { filters, update, searchInput, setSearchInput, flushSearch };
}
