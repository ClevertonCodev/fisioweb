export type QuestionnaireQuestionType = 'multiple_choice' | 'checkbox' | 'scale' | 'text';

export interface QuestionnaireQuestion {
    id: number;
    label: string;
    type: QuestionnaireQuestionType;
    options: string[] | null;
    scaleMin: number;
    scaleMax: number;
    required: boolean;
    sortOrder: number;
}

export interface QuestionnaireSection {
    id: number;
    title: string;
    sortOrder: number;
    questions: QuestionnaireQuestion[];
}

export interface QuestionnaireTemplate {
    id: number;
    clinicId: number;
    title: string;
    description: string | null;
    isActive: boolean;
    sections: QuestionnaireSection[];
}
