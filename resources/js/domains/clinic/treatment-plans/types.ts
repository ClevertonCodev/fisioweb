export interface ServerExerciseFilters {
    search?: string;
    physio_area_id?: string | string[];
    body_region_id?: string | string[];
    difficulty_level?: string | string[];
    movement_form?: string | string[];
}

export type TreatmentPlanTab = 'historico' | 'exercicios';
