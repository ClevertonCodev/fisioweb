export const PROGRAMS_TABS = [
    { key: 'historico', label: 'Histórico' },
    { key: 'exercicios', label: 'Exercícios' },
    { key: 'programas', label: 'Programas' },
] as const;

export type ProgramsTabKey = (typeof PROGRAMS_TABS)[number]['key'];

export function programsTabFromPath(pathname: string): ProgramsTabKey {
    if (pathname.includes('/exercicios')) return 'exercicios';
    if (pathname.includes('/modelos') || pathname.includes('/meus-modelos')) {
        return 'programas';
    }
    return 'historico';
}

export function programsTabPath(tab: ProgramsTabKey, pathname: string): string {
    if (tab === 'exercicios') return '/clinica/programas/exercicios';
    if (tab === 'programas') {
        return pathname.includes('/meus-modelos')
            ? '/clinica/programas/meus-modelos'
            : '/clinica/programas/modelos';
    }
    return '/clinica/programas/historico';
}
