import type { Exercise, Program, ProgramExercise } from '@/domain/clinic';

/**
 * O exercício da biblioteca como entra no programa: com a dose padrão do
 * catálogo, que é o que o backend aplica quando a clínica não define outra.
 */
export function programExerciseFrom(
    exercise: Exercise,
    id: string,
): ProgramExercise {
    const sets = exercise.sets ?? null;
    const repetitions = exercise.repetitions ?? null;
    return {
        id,
        exerciseId: exercise.id,
        title: exercise.title,
        thumbnailUrl: exercise.thumbnailUrl,
        videoUrl: exercise.videoUrl,
        days: [],
        period: null,
        seriesMin: sets,
        seriesMax: sets,
        repetitionsMin: repetitions,
        repetitionsMax: repetitions,
        loadMin: null,
        loadMax: null,
        restTime: exercise.restTime ?? null,
        notes: null,
        isConfigured: sets !== null || repetitions !== null,
    };
}

export function programDraftFromExercise(exercise: Exercise): Program {
    return {
        id: '',
        title: exercise.title,
        patientId: null,
        patientName: null,
        patientPhotoUrl: null,
        patientPhone: null,
        patientEmail: null,
        shareUrl: null,
        professionalId: null,
        professionalName: null,
        professionalPhotoUrl: null,
        exerciseCount: 1,
        startDate: '',
        endDate: null,
        message: '',
        groups: [
            {
                id: 'group-1',
                name: 'Novo grupo',
                exercises: [programExerciseFrom(exercise, exercise.id)],
            },
        ],
        status: 'draft',
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: '',
    };
}
