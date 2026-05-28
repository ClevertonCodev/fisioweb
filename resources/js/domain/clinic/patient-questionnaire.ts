import type { QuestionnaireTemplate } from './questionnaire-template';

export interface PatientQuestionnaire {
    id: number;
    clinicId: number;
    patientId: number;
    clinicUserId: number;
    clinicUser?: { id: number; name: string };
    questionnaireTemplateId: number;
    template?: Pick<QuestionnaireTemplate, 'id' | 'title'>;
    status: 'pending' | 'answered' | 'expired';
    modality: 'presencial' | 'remoto';
    answeredAt: string | null;
    expiresAt: string | null;
    createdAt: string;
}

export interface PatientQuestionnaireAnswer {
    id: number;
    questionnaireQuestionId: number;
    answer: string | string[] | null;
}

export interface PatientQuestionnaireDetail extends PatientQuestionnaire {
    template?: QuestionnaireTemplate;
    answers: PatientQuestionnaireAnswer[];
}
