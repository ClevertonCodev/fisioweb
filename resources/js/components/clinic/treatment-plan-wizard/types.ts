import type { Exercise } from '@/types';

export interface ExerciseConfig {
    exercise_id: number;
    exercise: Exercise;
    group_index: number | null;
    days_of_week: string[];
    all_days: boolean;
    period: string;
    sets_min: string;
    sets_max: string;
    repetitions_min: string;
    repetitions_max: string;
    load_min: string;
    load_max: string;
    rest_time: string;
    notes: string;
    sort_order: number;
}

export interface Group {
    name: string;
    sort_order: number;
}

export interface Step4Data {
    title: string;
    patient_id: string;
    start_date: string;
    end_date: string;
    message: string;
    status: string;
}
