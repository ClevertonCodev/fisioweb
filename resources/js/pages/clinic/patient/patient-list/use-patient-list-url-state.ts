import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
    parsePatientListFilters,
    serializePatientListFilters,
    type PatientListFilters,
} from '@/application/clinic/patient-list-filters';

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Filtros da lista lidos da URL e escritos de volta nela (com `replace`, para
 * o "voltar" do navegador sair da lista). Mudar qualquer coisa que não seja a
 * página volta para a página 1. A busca digitada só vai para a URL depois do
 * debounce.
 */
export function usePatientListUrlState() {
    const [params, setParams] = useSearchParams();
    const filters = useMemo(() => parsePatientListFilters(params), [params]);

    const update = useCallback(
        (patch: Partial<PatientListFilters>) => {
            setParams(
                (prev) =>
                    serializePatientListFilters({
                        ...parsePatientListFilters(prev),
                        page: 1,
                        ...patch,
                    }),
                { replace: true },
            );
        },
        [setParams],
    );

    const [searchInput, setSearchInput] = useState(filters.search);
    // A URL mudou por fora (voltar do navegador, link): o campo acompanha.
    // Quando a mudança é a própria busca indo para a URL (sem os espaços das
    // pontas), o campo fica como a pessoa digitou: "maria " continua "maria ".
    const [syncedSearch, setSyncedSearch] = useState(filters.search);
    if (syncedSearch !== filters.search) {
        setSyncedSearch(filters.search);
        if (filters.search !== searchInput.trim()) {
            setSearchInput(filters.search);
        }
    }

    useEffect(() => {
        if (searchInput.trim() === filters.search) return;
        const timer = setTimeout(
            () => update({ search: searchInput }),
            SEARCH_DEBOUNCE_MS,
        );
        return () => clearTimeout(timer);
    }, [searchInput, filters.search, update]);

    return { filters, update, searchInput, setSearchInput };
}
