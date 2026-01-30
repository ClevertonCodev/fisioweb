export interface Exercise {
    id: string;
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    specialty: string;
    bodyArea: string;
    bodyRegion: string;
    objective: string;
    difficulty: 'facil' | 'medio' | 'dificil';
    muscleGroup: string;
    equipment: string;
    movementType: string;
    movementPattern: string;
    movementForm: string;
    duration: number;
    isFavorite: boolean;
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
