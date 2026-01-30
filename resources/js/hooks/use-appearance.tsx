import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light';
export type Appearance = 'light';

const listeners = new Set<() => void>();
let currentAppearance: Appearance = 'light';

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (): void => {
    if (typeof document === 'undefined') return;

    // Sempre modo light
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

export function initializeTheme(): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('appearance', 'light');
    setCookie('appearance', 'light');

    applyTheme();
}

export function useAppearance() {
    const appearance: Appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => 'light',
    );

    const resolvedAppearance: ResolvedAppearance = useMemo(
        () => 'light',
        [],
    );

    const updateAppearance = useCallback((): void => {
        currentAppearance = 'light';

        localStorage.setItem('appearance', 'light');
        setCookie('appearance', 'light');

        applyTheme();
        notify();
    }, []);

    return { appearance, resolvedAppearance, updateAppearance } as const;
}
