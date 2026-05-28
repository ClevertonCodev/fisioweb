import type { QuestionnaireTemplatesRepository } from '@/application/clinic/ports';
import type { QuestionnaireTemplate } from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';

interface ApiQuestionnaireQuestionDto {
    id: number;
    label: string;
    type: 'multiple_choice' | 'checkbox' | 'scale' | 'text';
    options: string[] | null;
    scale_min: number;
    scale_max: number;
    required: boolean;
    sort_order: number;
}

interface ApiQuestionnaireSectionDto {
    id: number;
    title: string;
    sort_order: number;
    questions: ApiQuestionnaireQuestionDto[];
}

interface ApiQuestionnaireTemplateDto {
    id: number;
    clinic_id: number;
    title: string;
    description: string | null;
    is_active: boolean;
    sections: ApiQuestionnaireSectionDto[];
}

function toTemplate(raw: ApiQuestionnaireTemplateDto): QuestionnaireTemplate {
    return {
        id: raw.id,
        clinicId: raw.clinic_id,
        title: raw.title,
        description: raw.description,
        isActive: raw.is_active,
        sections: (raw.sections ?? []).map((s) => ({
            id: s.id,
            title: s.title,
            sortOrder: s.sort_order,
            questions: (s.questions ?? []).map((q) => ({
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
    };
}

export const apiClinicQuestionnaireTemplatesRepository: QuestionnaireTemplatesRepository = {
    async list() {
        const res = await apiClient.get<{ data: ApiQuestionnaireTemplateDto[] }>(
            '/clinic/questionnaire-templates',
        );
        return res.data.data.map(toTemplate);
    },

    async findById(id: string) {
        const res = await apiClient.get<{ data: ApiQuestionnaireTemplateDto }>(
            `/clinic/questionnaire-templates/${id}`,
        );
        return toTemplate(res.data.data);
    },

    async create(dto) {
        const res = await apiClient.post<{ data: ApiQuestionnaireTemplateDto }>(
            '/clinic/questionnaire-templates',
            {
                title: dto.title,
                description: dto.description,
                sections: dto.sections.map((s, si) => ({
                    title: s.title,
                    sort_order: si,
                    questions: s.questions.map((q, qi) => ({
                        label: q.label,
                        type: q.type,
                        options: q.options,
                        scale_min: q.scaleMin,
                        scale_max: q.scaleMax,
                        required: q.required,
                        sort_order: qi,
                    })),
                })),
            },
        );
        return toTemplate(res.data.data);
    },

    async update(id, dto) {
        const res = await apiClient.put<{ data: ApiQuestionnaireTemplateDto }>(
            `/clinic/questionnaire-templates/${id}`,
            {
                title: dto.title,
                description: dto.description,
                sections: dto.sections.map((s, si) => ({
                    title: s.title,
                    sort_order: si,
                    questions: s.questions.map((q, qi) => ({
                        label: q.label,
                        type: q.type,
                        options: q.options,
                        scale_min: q.scaleMin,
                        scale_max: q.scaleMax,
                        required: q.required,
                        sort_order: qi,
                    })),
                })),
            },
        );
        return toTemplate(res.data.data);
    },

    async destroy(id) {
        await apiClient.delete(`/clinic/questionnaire-templates/${id}`);
    },
};
