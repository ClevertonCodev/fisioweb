/** Programa template — contexto admin */

export interface AdminProgramExercise {
    id: number;
    exerciseId: number;
    adminProgramGroupId: number | null;
    daysOfWeek: number[] | null;
    period: 'morning' | 'afternoon' | 'night' | null;
    setsMin: number | null;
    setsMax: number | null;
    repetitionsMin: number | null;
    repetitionsMax: number | null;
    loadMin: number | null;
    loadMax: number | null;
    restTime: number | null;
    notes: string | null;
    sortOrder: number;
    exercise?: {
        id: number;
        name: string;
        thumbnailUrl: string | null;
        videoUrl: string | null;
    };
}

export interface AdminProgramGroup {
    id: number;
    adminProgramId: number;
    name: string;
    sortOrder: number;
    exercises?: AdminProgramExercise[];
}

export interface AdminProgram {
    id: number;
    title: string;
    description: string | null;
    physioAreaId: number | null;
    physioSubareaId: number | null;
    durationMinutes: number | null;
    isActive: boolean;
    createdBy?: { id: number; name: string };
    physioArea?: { id: number; name: string } | null;
    groups?: AdminProgramGroup[];
}
