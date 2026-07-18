import type {
    PatientQuestionnaireAnswerWriteDto,
    PatientQuestionnairesRepository,
    PatientQuestionnaireWriteDto,
} from '@/application/clinic/ports';
import type {
    PatientQuestionnaire,
    PatientQuestionnaireDetail,
} from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';

interface ApiPatientQuestionnaireDto {
    id: number;
    clinic_id: number;
    patient_id: number;
    clinic_user_id: number;
    clinic_user?: { id: number; name: string };
    questionnaire_template_id: number;
    template?: {
        id: number;
        title: string;
        description?: string | null;
        is_active?: boolean;
        clinic_id?: number;
        sections?: Array<{
            id: number;
            title: string;
            sort_order: number;
            questions: Array<{
                id: number;
                label: string;
                type: 'multiple_choice' | 'checkbox' | 'scale' | 'text';
                options: string[] | null;
                scale_min: number;
                scale_max: number;
                required: boolean;
                sort_order: number;
            }>;
        }>;
    };
    status: 'pending' | 'answered' | 'expired';
    modality: 'presencial' | 'remoto';
    answered_at: string | null;
    expires_at: string | null;
    created_at: string;
    answers?: Array<{
        id: number;
        questionnaire_question_id: number;
        answer: string | string[] | null;
    }>;
}

function toPatientQuestionnaire(
    raw: ApiPatientQuestionnaireDto,
): PatientQuestionnaire {
    return {
        id: raw.id,
        clinicId: raw.clinic_id,
        patientId: raw.patient_id,
        clinicUserId: raw.clinic_user_id,
        clinicUser: raw.clinic_user,
        questionnaireTemplateId: raw.questionnaire_template_id,
        template: raw.template
            ? { id: raw.template.id, title: raw.template.title }
            : undefined,
        status: raw.status,
        modality: raw.modality,
        answeredAt: raw.answered_at,
        expiresAt: raw.expires_at,
        createdAt: raw.created_at,
    };
}

export const apiClinicPatientQuestionnairesRepository: PatientQuestionnairesRepository =
    {
        async listByPatient(patientId) {
            const res = await apiClient.get<{
                data: ApiPatientQuestionnaireDto[];
            }>(`/clinic/patients/${patientId}/questionnaires`);
            return res.data.data.map(toPatientQuestionnaire);
        },
        async findById(patientId, questionnaireId) {
            const res = await apiClient.get<{
                data: ApiPatientQuestionnaireDto;
            }>(
                `/clinic/patients/${patientId}/questionnaires/${questionnaireId}`,
            );
            const raw = res.data.data;
            const base = toPatientQuestionnaire(raw);
            const detail: PatientQuestionnaireDetail = {
                ...base,
                template: raw.template?.sections
                    ? {
                          id: raw.template.id,
                          clinicId: raw.template.clinic_id ?? base.clinicId,
                          title: raw.template.title,
                          description: raw.template.description ?? null,
                          isActive: raw.template.is_active ?? true,
                          sections: raw.template.sections.map((s) => ({
                              id: s.id,
                              title: s.title,
                              sortOrder: s.sort_order,
                              questions: s.questions.map((q) => ({
                                  id: q.id,
                                  label: q.label,
                                  type: q.type,
                                  options: q.options,
                                  scaleMin: q.scale_min,
                                  scaleMax: q.scale_max,
                                  required: q.required,
                                  sortOrder: q.sort_order,
                              })),
                          })),
                      }
                    : undefined,
                answers: (raw.answers ?? []).map((a) => ({
                    id: a.id,
                    questionnaireQuestionId: a.questionnaire_question_id,
                    answer: a.answer,
                })),
            };
            return detail;
        },
        async store(patientId, dto: PatientQuestionnaireWriteDto) {
            const res = await apiClient.post<{
                data: ApiPatientQuestionnaireDto;
            }>(`/clinic/patients/${patientId}/questionnaires`, {
                questionnaire_template_id: dto.questionnaireTemplateId,
                modality: dto.modality,
                expires_at: dto.expiresAt,
            });
            return toPatientQuestionnaire(res.data.data);
        },
        async answer(
            patientId,
            questionnaireId,
            answers: PatientQuestionnaireAnswerWriteDto[],
        ) {
            const res = await apiClient.post<{
                data: ApiPatientQuestionnaireDto;
            }>(
                `/clinic/patients/${patientId}/questionnaires/${questionnaireId}/answer`,
                {
                    answers: answers.map((a) => ({
                        question_id: a.questionId,
                        answer: a.answer,
                    })),
                },
            );
            return toPatientQuestionnaire(res.data.data);
        },
        async destroy(patientId, questionnaireId) {
            await apiClient.delete(
                `/clinic/patients/${patientId}/questionnaires/${questionnaireId}`,
            );
        },
    };
