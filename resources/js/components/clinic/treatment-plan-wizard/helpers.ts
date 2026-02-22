import type { Exercise } from '@/types';

import type { ExerciseConfig } from './types';

export function getExerciseSpecs(cfg: ExerciseConfig): string {
    const parts: string[] = [];
    if (cfg.sets_min || cfg.sets_max) {
        const s = cfg.sets_min === cfg.sets_max ? cfg.sets_min : `${cfg.sets_min || '?'}-${cfg.sets_max || '?'}`;
        parts.push(`${s} série${Number(cfg.sets_max) !== 1 ? 's' : ''}`);
    }
    if (cfg.repetitions_min || cfg.repetitions_max) {
        const r =
            cfg.repetitions_min === cfg.repetitions_max
                ? cfg.repetitions_min
                : `${cfg.repetitions_min || '?'}-${cfg.repetitions_max || '?'}`;
        parts.push(`${r} rep.`);
    }
    if (cfg.period) {
        const labels: Record<string, string> = { morning: 'Manhã', afternoon: 'Tarde', night: 'Noite' };
        parts.push(labels[cfg.period] ?? cfg.period);
    }
    return parts.join(' · ') || 'Sem especificações';
}

export function getExerciseThumbnail(exercise: Exercise): string | null {
    return exercise.videos?.[0]?.thumbnail_url ?? null;
}

export function hasConfig(cfg: ExerciseConfig): boolean {
    return !!(cfg.sets_min || cfg.sets_max || cfg.period || cfg.days_of_week.length);
}
