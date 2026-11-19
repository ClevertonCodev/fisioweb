import { isAxiosError } from 'axios';

import type { PublicQuestionnairesRepository } from '@/application/patient/ports';
import type {
    PublicQuestion,
    PublicQuestionnaire,
    PublicQuestionnaireUnavailable,
    PublicQuestionType,
} from '@/domain/patient/questionnaire';
import { apiClient } from '@/infrastructure/api/client';

interface ApiErrorBody {
    message?: string;
    reason?: string;
}

interface ApiPublicQuestion {
    id: number;
    label: string;
    type: PublicQuestionType;
    options: string[] | null;
    scale_min: number | null;
    scale_max: number | null;
    required: boolean;
}

interface ApiPublicQuestionnaire {
    expires_at: string | null;
    clinic_name?: string | null;
    template: {
        title: string;
        sections?: Array<{
            id: number;
            title: string;
            questions?: ApiPublicQuestion[];
        }>;
    } | null;
}

function mapQuestion(raw: ApiPublicQuestion): PublicQuestion {
    return {
        id: raw.id,
        label: raw.label,
        type: raw.type,
        options: [...new Set(raw.options ?? [])],
        scaleMin: raw.scale_min ?? 0,
        scaleMax: raw.scale_max ?? 10,
        required: Boolean(raw.required),
    };
}

function mapQuestionnaire(raw: ApiPublicQuestionnaire): PublicQuestionnaire {
    return {
        title: raw.template?.title ?? '',
        clinicName: raw.clinic_name ?? null,
        expiresAt: raw.expires_at,
        sections: (raw.template?.sections ?? []).map((section) => ({
            id: section.id,
            title: section.title,
            questions: (section.questions ?? []).map(mapQuestion),
        })),
    };
}

function unavailableFrom(
    error: unknown,
): PublicQuestionnaireUnavailable | null {
    if (!isAxiosError<ApiErrorBody>(error)) return null;
    const status = error.response?.status;
    if (status === 404) return 'not_found';
    const reason = error.response?.data?.reason;
    if (status === 422 && (reason === 'answered' || reason === 'expired')) {
        return reason;
    }
    return null;
}

const PUBLIC_TOKEN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function publicPath(token: string): string | null {
    return PUBLIC_TOKEN.test(token)
        ? `/questionnaires/${encodeURIComponent(token)}`
        : null;
}

export const apiPublicQuestionnairesRepository: PublicQuestionnairesRepository =
    {
        async findByToken(token) {
            const path = publicPath(token);
            if (!path) return { state: 'not_found' };
            try {
                const { data } = await apiClient.get<{
                    data: ApiPublicQuestionnaire;
                }>(path);

                return {
                    state: 'pending',
                    questionnaire: mapQuestionnaire(data.data),
                };
            } catch (error) {
                const unavailable = unavailableFrom(error);
                if (unavailable) return { state: unavailable };
                throw error;
            }
        },

        async submitAnswers(token, answers) {
            const path = publicPath(token);
            if (!path) return { state: 'not_found' };
            try {
                await apiClient.post(`${path}/answer`, {
                    answers: answers.map((item) => ({
                        question_id: item.questionId,
                        answer: item.answer,
                    })),
                });
            } catch (error) {
                const unavailable = unavailableFrom(error);
                if (unavailable) return { state: unavailable };
                if (
                    isAxiosError<ApiErrorBody>(error) &&
                    error.response?.status === 422
                ) {
                    return {
                        state: 'rejected',
                        message:
                            error.response.data?.message ??
                            'Confira suas respostas e tente de novo.',
                    };
                }
                throw error;
            }

            return { state: 'sent' };
        },
    };
