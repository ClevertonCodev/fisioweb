export interface ProgramExercise {
    id: string;
    exerciseId: string;
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    days: number[];
    period: 'manha' | 'tarde' | 'noite' | null;
    seriesMin: number | null;
    seriesMax: number | null;
    repetitionsMin?: number | null;
    repetitionsMax?: number | null;
    loadMin?: number | null;
    loadMax?: number | null;
    restTime?: number | null;
    notes?: string | null;
    isConfigured: boolean;
}

export interface ProgramGroup {
    id: string;
    name: string;
    exercises: ProgramExercise[];
}

export type ProgramStatus = 'draft' | 'sent' | 'active' | 'completed';

export interface Program {
    id: string;
    title: string;
    patientId: string | null;
    patientName: string | null;
    patientPhotoUrl: string | null;
    patientPhone: string | null;
    patientEmail: string | null;
    shareUrl: string | null;
    professionalId: string | null;
    professionalName: string | null;
    professionalPhotoUrl: string | null;
    exerciseCount: number;
    startDate: string;
    endDate: string | null;
    message: string;
    groups: ProgramGroup[];
    status: ProgramStatus;
    patientViewedAt: string | null;
    patientCompletedCount: number;
    createdAt: string;
}

export type ProgramStep = 1 | 2 | 3 | 4;
