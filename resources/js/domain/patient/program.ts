export type Intensity = 'Muito leve' | 'Leve' | 'Moderado' | 'Intenso' | 'Exaustivo';

export interface ExercisePrescription {
    seriesMin?: number;
    seriesMax?: number;
    repetitionsMin?: number;
    repetitionsMax?: number;
    loadMin?: number;
    loadMax?: number;
    restTime?: number;
    intensity?: Intensity;
    durationMin?: number;
    durationMax?: number;
    maintainFor?: number;
}

export interface PatientExercise {
    id: string;
    name: string;
    description?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    notes?: string;
    days?: string[];
    period?: string[];
    prescription: ExercisePrescription;
}

export interface PatientProgramGroup {
    id: string;
    name: string;
    exercises: PatientExercise[];
}

export interface PatientProgram {
    publicToken: string;
    name: string;
    professionalName: string;
    professionalPhotoUrl?: string;
    professionalRegistration?: string;
    clinicName?: string;
    clinicSlug?: string;
    startDate: string;
    endDate: string;
    status: 'available' | 'scheduled' | 'unavailable' | 'completed' | 'inactive';
    message?: string;
    groups: PatientProgramGroup[];
    exerciseCount?: number;
    outcomePainEnabled: boolean;
    outcomeDifficultyEnabled: boolean;
    outcomeSatisfactionEnabled: boolean;
    currentExecutionId?: string | null;
}
