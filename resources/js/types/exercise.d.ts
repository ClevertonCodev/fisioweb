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
    physio_area_id: string[];
    body_region_id: string[];
    difficulty_level: string[];
    movement_form: string[];
}
