import { useSyncExternalStore } from 'react';

function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (onChange) => {
            const mql = window.matchMedia(query);
            mql.addEventListener('change', onChange);
            return () => mql.removeEventListener('change', onChange);
        },
        () => window.matchMedia(query).matches,
        () => false,
    );
}

/** Abaixo do breakpoint sm (640 px). Não é o `useIsMobile` de 768 px da v1. */
export function useIsBelowSm(): boolean {
    return useMediaQuery('(max-width: 639px)');
}
