export type PublicQuestionType =
    | 'multiple_choice'
    | 'checkbox'
    | 'scale'
    | 'text';

export interface PublicQuestion {
    id: number;
    label: string;
    type: PublicQuestionType;
    options: string[];
    scaleMin: number;
    scaleMax: number;
    required: boolean;
}

export interface PublicQuestionnaireSection {
    id: number;
    title: string;
    questions: PublicQuestion[];
}

export interface PublicQuestionnaire {
    title: string;
    clinicName: string | null;
    expiresAt: string | null;
    sections: PublicQuestionnaireSection[];
}

export type PublicQuestionAnswer = string | string[] | number;

export type PublicQuestionnaireUnavailable =
    | 'answered'
    | 'expired'
    | 'not_found';

export type PublicQuestionnaireLookup =
    | { state: 'pending'; questionnaire: PublicQuestionnaire }
    | { state: PublicQuestionnaireUnavailable };

export type PublicQuestionnaireSubmitResult =
    | { state: 'sent' }
    | { state: PublicQuestionnaireUnavailable }
    | { state: 'rejected'; message: string };
