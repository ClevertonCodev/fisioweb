import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onStoreChange: () => void) {
    const mql = window.matchMedia(MOBILE_QUERY);
    mql.addEventListener('change', onStoreChange);
    return () => mql.removeEventListener('change', onStoreChange);
}

/**
 * matchMedia é um store externo — useSyncExternalStore é a API própria para isso.
 * Evita setState dentro de efeito e já entrega o valor certo no primeiro render,
 * em vez de renderizar `false` e corrigir logo depois.
 */
export function useIsMobile() {
    return React.useSyncExternalStore(
        subscribe,
        () => window.innerWidth < MOBILE_BREAKPOINT,
        () => false,
    );
}
