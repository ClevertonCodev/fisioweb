/** Constantes de UI para exercícios (application concern) */

export const DIFFICULTY_LABELS: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
};

export const DIFFICULTY_VARIANTS: Record<
    string,
    'active' | 'warning' | 'danger'
> = {
    easy: 'active',
    medium: 'warning',
    hard: 'danger',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
};

export const MOVEMENT_FORM_LABELS: Record<string, string> = {
    alternado: 'Alternado',
    bilateral: 'Bilateral',
    unilateral: 'Unilateral',
};

export const VIDEO_STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    completed: 'Concluído',
    failed: 'Falhou',
};

export const VIDEO_STATUS_VARIANTS: Record<
    string,
    'active' | 'warning' | 'neutral' | 'danger'
> = {
    pending: 'neutral',
    processing: 'warning',
    completed: 'active',
    failed: 'danger',
};

export const VIDEO_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    processing: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};
