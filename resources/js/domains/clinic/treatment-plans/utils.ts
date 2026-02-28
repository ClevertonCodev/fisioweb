import type { ExerciseFilters } from '@/types/exercise';

export const STATUS_BADGE_CLASS: Record<string, string> = {
    draft: 'border-border text-muted-foreground bg-gray-50',
    active: 'border-transparent bg-blue-500 text-white',
    completed: 'border-transparent bg-primary text-primary-foreground',
    cancelled: 'border-transparent bg-destructive text-destructive-foreground',
};

export const STATUS_PROGRESS_CLASS: Record<string, string> = {
    draft: 'bg-muted-foreground',
    active: 'bg-blue-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-400',
};

export const EMPTY_EXERCISE_FILTERS: ExerciseFilters = {
    search: '',
    physio_area_id: [],
    body_region_id: [],
    difficulty_level: [],
    movement_form: [],
};

export function calcProgress(startDate: string | null, endDate: string | null): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
}

export function daysRemaining(endDate: string | null): number | null {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function toArray(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}
