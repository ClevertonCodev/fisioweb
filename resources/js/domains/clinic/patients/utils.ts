import type { Tab } from './types';

export const PLAN_STATUS_LABELS: Record<string, string> = {
    draft: 'Rascunho',
    active: 'Ativo',
    completed: 'Concluído',
    cancelled: 'Cancelado',
};

export const PLAN_STATUS_COLORS: Record<string, string> = {
    draft: 'border-border text-muted-foreground',
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    completed: 'border-blue-200 bg-blue-50 text-blue-700',
    cancelled: 'border-red-200 bg-red-50 text-red-700',
};

export const TAB_OPTIONS: { value: Tab; label: string }[] = [
    { value: 'prontuario', label: 'Prontuário' },
    { value: 'programas', label: 'Programas' },
    { value: 'monitoramento', label: 'Monitoramento' },
    { value: 'registros', label: 'Registros' },
];
