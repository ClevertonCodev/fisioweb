import type { Exercise, Program } from '@/domain/clinic';

/** Programa sintético com um grupo e o exercício escolhido na biblioteca. */
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
                exercises: [
                    {
                        id: exercise.id,
                        exerciseId: exercise.id,
                        title: exercise.title,
                        thumbnailUrl: exercise.thumbnailUrl,
                        videoUrl: exercise.videoUrl,
                        days: [],
                        period: null,
                        seriesMin: null,
                        seriesMax: null,
                        repetitionsMin: null,
                        repetitionsMax: null,
                        loadMin: null,
                        loadMax: null,
                        restTime: null,
                        notes: null,
                        isConfigured: false,
                    },
                ],
            },
        ],
        status: 'draft',
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: '',
    };
}
