import type { Program, ProgramExercise } from '@/domain/clinic';

function formatSeries(ex: ProgramExercise): string | null {
    if (ex.seriesMin == null && ex.seriesMax == null) return null;
    if (
        ex.seriesMin != null &&
        ex.seriesMax != null &&
        ex.seriesMin !== ex.seriesMax
    ) {
        return `${ex.seriesMin}-${ex.seriesMax} séries`;
    }
    const value = ex.seriesMin ?? ex.seriesMax;
    return value != null ? `${value} séries` : null;
}

function formatRepetitions(ex: ProgramExercise): string | null {
    if (ex.repetitionsMin == null && ex.repetitionsMax == null) return null;
    if (
        ex.repetitionsMin != null &&
        ex.repetitionsMax != null &&
        ex.repetitionsMin !== ex.repetitionsMax
    ) {
        return `de ${ex.repetitionsMin} a ${ex.repetitionsMax} repetições`;
    }
    const value = ex.repetitionsMin ?? ex.repetitionsMax;
    return value != null ? `${value} repetições` : null;
}

function formatExerciseFrequency(ex: ProgramExercise): string {
    const parts: string[] = [];

    if (ex.days.length > 0) {
        parts.push(`${ex.days.length}x/semana`);
    }

    const series = formatSeries(ex);
    if (series) parts.push(series);

    const reps = formatRepetitions(ex);
    if (reps) parts.push(reps);

    if (ex.restTime != null) {
        parts.push(`descansar por ${ex.restTime} seg`);
    }

    if (ex.notes?.trim()) {
        parts.push(`orientações adicionais: ${ex.notes.trim()}`);
    }

    if (parts.length === 0) {
        return 'Frequência: sem especificações';
    }

    return `Frequência: ${parts.join(', ')}`;
}

/**
 * Monta texto do programa para colar no prontuário.
 * Formato: grupo → exercícios com linha de frequência.
 */
export function formatProgramClinicalRecordText(program: Program): string {
    const blocks: string[] = [];

    for (const group of program.groups) {
        const exerciseBlocks = group.exercises.map(
            (ex) => `${ex.title}\n${formatExerciseFrequency(ex)}`,
        );

        if (exerciseBlocks.length === 0) {
            blocks.push(group.name);
            continue;
        }

        blocks.push(`${group.name}\n\n${exerciseBlocks.join('\n\n')}`);
    }

    return blocks.join('\n\n').trim();
}
