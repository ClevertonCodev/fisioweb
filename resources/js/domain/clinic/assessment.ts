export type AssessmentStatus = 'draft' | 'signed';
export type AssessmentFieldType = 'textarea' | 'text' | 'range' | 'checkbox' | 'number';

export interface AssessmentFieldOption {
    id: number;
    label: string;
    sortOrder: number;
}

export interface AssessmentField {
    id: number;
    label: string;
    fieldType: AssessmentFieldType;
    required: boolean;
    sortOrder: number;
    config: { min?: number; max?: number; minLabel?: string; maxLabel?: string; unit?: string } | null;
    options: AssessmentFieldOption[];
}

export interface AssessmentSection {
    id: number;
    title: string;
    sortOrder: number;
    fields: AssessmentField[];
}

export interface AssessmentTemplate {
    id: number;
    name: string;
    description: string | null;
    sections: AssessmentSection[];
}

export interface AssessmentTemplateSummary {
    id: number;
    name: string;
    description: string | null;
    fieldCount: number;
}

export interface AssessmentAnswer {
    id: number;
    fieldId: number;
    value: string | null;
}

export interface AssessmentAnswerOptionRecord {
    id: number;
    fieldId: number;
    optionId: number;
}

export interface Assessment {
    id: number;
    status: AssessmentStatus;
    signedAt: string | null;
    template: AssessmentTemplate;
    answers: AssessmentAnswer[];
    answerOptions: AssessmentAnswerOptionRecord[];
    clinicUser: { id: number; name: string } | null;
}

export interface AssessmentSummary {
    id: number;
    status: AssessmentStatus;
    signedAt: string | null;
    template: { id: number; name: string };
    clinicUser: { id: number; name: string } | null;
}
