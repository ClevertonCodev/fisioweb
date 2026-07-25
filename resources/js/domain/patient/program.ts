export type Intensity = 'Muito leve' | 'Leve' | 'Moderado' | 'Intenso' | 'Exaustivo';

export interface ExercisePrescription {
    seriesMin?: number;
    seriesMax?: number;
    repetitionsMin?: number;
    repetitionsMax?: number;
    loadMin?: number;
    loadMax?: number;
    restTime?: number; // in seconds
    intensity?: Intensity;
    durationMin?: number;
    durationMax?: number;
    maintainFor?: number;
}

export interface PatientExercise {
    id: string;
    name: string;
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
    clinicName?: string;
    startDate: string;
    endDate: string;
    status: 'available' | 'scheduled' | 'unavailable' | 'completed' | 'inactive';
    message?: string;
    groups: PatientProgramGroup[];
    outcomePainEnabled: boolean;
    outcomeDifficultyEnabled: boolean;
    outcomeSatisfactionEnabled: boolean;
}
