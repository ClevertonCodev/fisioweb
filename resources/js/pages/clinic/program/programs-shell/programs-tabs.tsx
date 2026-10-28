import { createContext, useContext, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export const PROGRAMS_TABS = [
    { key: 'historico', label: 'Histórico' },
    { key: 'exercicios', label: 'Exercícios' },
    { key: 'programas', label: 'Programas' },
] as const;

export type ProgramsTabKey = (typeof PROGRAMS_TABS)[number]['key'];

export const HISTORICO_PATH = '/clinica/programas/historico';
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
    lastHistoricoPath: string = HISTORICO_PATH,
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
    if (pathname.includes('/historico')) return HISTORICO_PATH;
    return lastHistoricoPath;
}

interface LastPaths {
    programas: string;
    historico: string;
}

const LastPathsContext = createContext<LastPaths>({
    programas: NOSSOS_MODELOS_PATH,
    historico: HISTORICO_PATH,
});

function historicoPathFrom(pathname: string, search: string): string | null {
    return programsTabFromPath(pathname) === 'historico'
        ? `${HISTORICO_PATH}${search}`
        : null;
}

export function ProgramsOriginProvider({ children }: { children: ReactNode }) {
    const { pathname, search } = useLocation();
    const [lastPaths, setLastPaths] = useState<LastPaths>(() => ({
        programas: originPathFrom(pathname),
        historico: historicoPathFrom(pathname, search) ?? HISTORICO_PATH,
    }));
    const url = `${pathname}${search}`;
    const [seenUrl, setSeenUrl] = useState(url);
    if (url !== seenUrl) {
        setSeenUrl(url);
        const historico = historicoPathFrom(pathname, search);
        if (historico) {
            setLastPaths((prev) => ({ ...prev, historico }));
        } else if (
            pathname.includes('/meus-modelos') ||
            pathname.includes('/modelos')
        ) {
            setLastPaths((prev) => ({
                ...prev,
                programas: originPathFrom(pathname),
            }));
        }
    }

    return (
        <LastPathsContext.Provider value={lastPaths}>
            {children}
        </LastPathsContext.Provider>
    );
}

export function useLastProgramsPaths(): LastPaths {
    return useContext(LastPathsContext);
}
