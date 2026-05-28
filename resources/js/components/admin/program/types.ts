/** Tipos locais do wizard de programa admin — não exportar para domain/ */

export interface AdminWizardExercise {
    id: number;
    exerciseId: number;
    name: string;
    thumbnailUrl: string | null;
    videoUrl: string | null;
    days: number[];
    period: 'morning' | 'afternoon' | 'night' | null;
    setsMin: number | null;
    setsMax: number | null;
    repetitionsMin: number | null;
    repetitionsMax: number | null;
    loadMin: number | null;
    loadMax: number | null;
    restTime: number | null;
    notes: string;
    isConfigured: boolean;
}

export interface AdminWizardGroup {
    id: number;
    name: string;
    exercises: AdminWizardExercise[];
}
