import { createContext, useContext, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export const PROGRAMS_TABS = [
    { key: 'historico', label: 'Histórico' },
    { key: 'exercicios', label: 'Exercícios' },
    { key: 'programas', label: 'Programas' },
] as const;

export type ProgramsTabKey = (typeof PROGRAMS_TABS)[number]['key'];

export const NOSSOS_MODELOS_PATH = '/clinica/programas/modelos';
export const MEUS_MODELOS_PATH = '/clinica/programas/meus-modelos';

export function programsTabFromPath(pathname: string): ProgramsTabKey {
    if (pathname.includes('/exercicios')) return 'exercicios';
    if (pathname.includes('/modelos') || pathname.includes('/meus-modelos')) {
        return 'programas';
    }
    return 'historico';
}

export function originPathFrom(pathname: string): string {
    if (pathname.includes('/meus-modelos')) return MEUS_MODELOS_PATH;
    if (pathname.includes('/modelos')) return NOSSOS_MODELOS_PATH;
    return NOSSOS_MODELOS_PATH;
}

export function programsTabPath(
    tab: ProgramsTabKey,
    pathname: string,
    lastProgramasPath: string = NOSSOS_MODELOS_PATH,
): string {
    if (tab === 'exercicios') return '/clinica/programas/exercicios';
    if (tab === 'programas') {
        if (
            pathname.includes('/meus-modelos') ||
            pathname.includes('/modelos')
        ) {
            return originPathFrom(pathname);
        }
        return lastProgramasPath;
    }
    return '/clinica/programas/historico';
}

const LastProgramasPathContext = createContext(NOSSOS_MODELOS_PATH);

export function ProgramsOriginProvider({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();
    const [lastPath, setLastPath] = useState(() => originPathFrom(pathname));
    const [seenPath, setSeenPath] = useState(pathname);
    if (pathname !== seenPath) {
        setSeenPath(pathname);
        if (
            pathname.includes('/meus-modelos') ||
            pathname.includes('/modelos')
        ) {
            setLastPath(originPathFrom(pathname));
        }
    }

    return (
        <LastProgramasPathContext.Provider value={lastPath}>
            {children}
        </LastProgramasPathContext.Provider>
    );
}

export function useLastProgramasPath(): string {
    return useContext(LastProgramasPathContext);
}
