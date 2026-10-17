import { useCallback, useSyncExternalStore } from 'react';

export type DsTheme = 'light' | 'dark';

export const DS_THEME_STORAGE_KEY = 'fisioweb-ds-theme';

function parseTheme(value: string | null): DsTheme {
    return value === 'dark' ? 'dark' : 'light';
}

function readStoredTheme(): DsTheme {
    try {
        return parseTheme(localStorage.getItem(DS_THEME_STORAGE_KEY));
    } catch {
        return 'light';
    }
}

function storeTheme(theme: DsTheme): void {
    try {
        localStorage.setItem(DS_THEME_STORAGE_KEY, theme);
    } catch {
        // Sem storage (aba privada, site data bloqueado): o tema vale só nesta visita.
    }
}

function applyTheme(theme: DsTheme): void {
    if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = theme;
    }
}

// Store de módulo: uma fonte só para todas as instâncias do hook. `null` quer
// dizer "ainda não leu o storage".
let currentTheme: DsTheme | null = null;
const listeners = new Set<() => void>();

function getTheme(): DsTheme {
    if (currentTheme === null) {
        currentTheme = readStoredTheme();
        // Aplica já na primeira leitura (durante o render), antes da pintura,
        // para a tela não piscar clara com `dark` salvo.
        applyTheme(currentTheme);
    }
    return currentTheme;
}

function updateTheme(next: DsTheme): void {
    currentTheme = next;
    applyTheme(next);
    listeners.forEach((listener) => listener());
}

function setDsTheme(next: DsTheme): void {
    storeTheme(next);
    updateTheme(next);
}

// Outra aba trocou o tema: segue sem regravar o storage.
function handleStorage(event: StorageEvent): void {
    if (event.key !== DS_THEME_STORAGE_KEY && event.key !== null) {
        return;
    }
    const next = event.key === null ? 'light' : parseTheme(event.newValue);
    if (next !== currentTheme) {
        updateTheme(next);
    }
}

function subscribe(listener: () => void): () => void {
    if (listeners.size === 0 && typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorage);
    }
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== 'undefined') {
            window.removeEventListener('storage', handleStorage);
        }
    };
}

function getServerTheme(): DsTheme {
    return 'light';
}

// Aplica o tema salvo ao carregar o módulo: uma tela v2 que importa o DS abre
// no tema certo mesmo sem o hook montado.
getTheme();

/** Só para testes: esquece o tema lido para o próximo teste reler o storage. */
export function resetDsThemeStoreForTests(): void {
    currentTheme = null;
}

/**
 * Tema das telas v2. Aplica `data-theme` no <html>, que só troca os tokens --ds-*;
 * o tema shadcn da v1 não reage a esse atributo.
 */
export function useDsTheme() {
    const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

    const toggleTheme = useCallback(() => {
        setDsTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }, []);

    return { theme, setTheme: setDsTheme, toggleTheme };
}
