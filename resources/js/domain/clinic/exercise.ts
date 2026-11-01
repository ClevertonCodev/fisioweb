/** Exercício - contexto clínica */
export type ExerciseDifficulty = 'facil' | 'medio' | 'dificil';

export type ExerciseReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Exercise {
    id: string;
    title: string;
    /** Como fazer o exercício (texto para o paciente). */
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    specialty: string;
    bodyArea: string;
    bodyRegion: string;
    objective: string;
    difficulty: ExerciseDifficulty;
    muscleGroup: string;
    equipment: string;
    movementType: string;
    movementPattern: string;
    movementForm: string;
    duration: number;
    isFavorite: boolean;
    /** Status de revisão do sistema. 'approved' = visível globalmente. */
    reviewStatus: ExerciseReviewStatus;
    /** True quando o exercício foi enviado pela própria clínica logada. */
    isOwnSubmission: boolean;
    /** Dose padrão do catálogo: o que o programa usa quando a clínica não define. */
    sets?: number | null;
    repetitions?: number | null;
    /** Descanso padrão, em segundos. */
    restTime?: number | null;
    createdAt: string;
}

export interface FilterCategory {
    id: string;
    label: string;
    options: FilterOption[];
}

export interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

export interface ExerciseFilters {
    search: string;
    specialty: string[];
    bodyArea: string[];
    bodyRegion: string[];
    objective: string[];
    difficulty: string[];
    muscleGroup: string[];
    equipment: string[];
    movementType: string[];
    movementPattern: string[];
    movementForm: string[];
}
