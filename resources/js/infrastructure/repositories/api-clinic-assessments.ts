import type {
    AssessmentAnswerOptionWriteDto,
    AssessmentAnswerWriteDto,
    AssessmentTemplateListResult,
    AssessmentUpdateDto,
    AssessmentWriteDto,
    AssessmentsRepository,
} from '@/application/clinic/ports';
import type {
    Assessment,
    AssessmentAnswer,
    AssessmentAnswerOptionRecord,
    AssessmentField,
    AssessmentFieldOption,
    AssessmentSection,
    AssessmentSummary,
    AssessmentTemplate,
    AssessmentTemplateSummary,
} from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';

// ─── Internal API DTOs (never exported) ─────────────────────────────────────

interface ApiAssessmentFieldOptionDto {
    id: number;
    label: string;
    sort_order: number;
}

interface ApiAssessmentFieldDto {
    id: number;
    label: string;
    field_type: string;
    required: boolean;
    sort_order: number;
    config: {
        min?: number;
        max?: number;
        min_label?: string;
        max_label?: string;
        label_min?: string;
        label_max?: string;
        unit?: string;
    } | null;
    options: ApiAssessmentFieldOptionDto[];
}

interface ApiAssessmentSectionDto {
    id: number;
    title: string;
    sort_order: number;
    fields: ApiAssessmentFieldDto[];
}

interface ApiAssessmentTemplateFullDto {
    id: number;
    name: string;
    description: string | null;
    sections: ApiAssessmentSectionDto[];
}

interface ApiAssessmentTemplateSummaryDto {
    id: number;
    name: string;
    description: string | null;
    fields_count: number;
}

interface ApiTemplateListResponse {
    current_page: number;
    data: ApiAssessmentTemplateSummaryDto[];
    total: number;
    last_page: number;
}

interface ApiAssessmentAnswerDto {
    id: number;
    admin_assessment_field_id: number;
    value: string | null;
}

interface ApiAssessmentAnswerOptionDto {
    id: number;
    admin_assessment_field_id: number;
    admin_assessment_field_option_id: number;
}

interface ApiClinicUserDto {
    id: number;
    name: string;
}

interface ApiAssessmentFullDto {
    id: number;
    status: string;
    signed_at: string | null;
    template: ApiAssessmentTemplateFullDto;
    answers: ApiAssessmentAnswerDto[];
    answer_options: ApiAssessmentAnswerOptionDto[];
    clinic_user: ApiClinicUserDto | null;
}

interface ApiAssessmentSummaryDto {
    id: number;
    status: string;
    signed_at: string | null;
    template: { id: number; name: string };
    clinic_user: ApiClinicUserDto | null;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function toFieldOption(
    raw: ApiAssessmentFieldOptionDto,
): AssessmentFieldOption {
    return { id: raw.id, label: raw.label, sortOrder: raw.sort_order };
}

function toField(raw: ApiAssessmentFieldDto): AssessmentField {
    const config = raw.config
        ? {
              min: raw.config.min,
              max: raw.config.max,
              // normalize the two key variants used across seeders
              minLabel: raw.config.min_label ?? raw.config.label_min,
              maxLabel: raw.config.max_label ?? raw.config.label_max,
              unit: raw.config.unit,
          }
        : null;
    return {
        id: raw.id,
        label: raw.label,
        fieldType: raw.field_type as AssessmentField['fieldType'],
        required: raw.required,
        sortOrder: raw.sort_order,
        config,
        options: (raw.options ?? []).map(toFieldOption),
    };
}

function toSection(raw: ApiAssessmentSectionDto): AssessmentSection {
    return {
        id: raw.id,
        title: raw.title,
        sortOrder: raw.sort_order,
        fields: (raw.fields ?? []).map(toField),
    };
}

function toTemplate(raw: ApiAssessmentTemplateFullDto): AssessmentTemplate {
    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        sections: (raw.sections ?? []).map(toSection),
    };
}

function toTemplateSummary(
    raw: ApiAssessmentTemplateSummaryDto,
): AssessmentTemplateSummary {
    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        fieldCount: raw.fields_count,
    };
}

function toAssessmentSummary(raw: ApiAssessmentSummaryDto): AssessmentSummary {
    return {
        id: raw.id,
        status: raw.status as AssessmentSummary['status'],
        signedAt: raw.signed_at,
        template: raw.template,
        clinicUser: raw.clinic_user,
    };
}

function toAnswer(raw: ApiAssessmentAnswerDto): AssessmentAnswer {
    return {
        id: raw.id,
        fieldId: raw.admin_assessment_field_id,
        value: raw.value,
    };
}

function toAnswerOption(
    raw: ApiAssessmentAnswerOptionDto,
): AssessmentAnswerOptionRecord {
    return {
        id: raw.id,
        fieldId: raw.admin_assessment_field_id,
        optionId: raw.admin_assessment_field_option_id,
    };
}

function toAssessment(raw: ApiAssessmentFullDto): Assessment {
    return {
        id: raw.id,
        status: raw.status as Assessment['status'],
        signedAt: raw.signed_at,
        template: toTemplate(raw.template),
        answers: (raw.answers ?? []).map(toAnswer),
        answerOptions: (raw.answer_options ?? []).map(toAnswerOption),
        clinicUser: raw.clinic_user,
    };
}

function toWritePayload(dto: AssessmentWriteDto | AssessmentUpdateDto) {
    const answers = (dto.answers as AssessmentAnswerWriteDto[]).map((a) => ({
        field_id: a.fieldId,
        value: a.value,
    }));
    const answerOptions = (
        dto.answerOptions as AssessmentAnswerOptionWriteDto[]
    ).map((o) => ({
        field_id: o.fieldId,
        option_id: o.optionId,
    }));
    return { answers, answer_options: answerOptions };
}

// ─── Repository implementation ────────────────────────────────────────────────

export const apiClinicAssessmentsRepository: AssessmentsRepository = {
    async listByPatient(patientId) {
        const res = await apiClient.get<{ data: ApiAssessmentSummaryDto[] }>(
            `/clinic/patients/${patientId}/assessments`,
        );
        return res.data.data.map(toAssessmentSummary);
    },

    async find(id) {
        const res = await apiClient.get<{ data: ApiAssessmentFullDto }>(
            `/clinic/assessments/${id}`,
        );
        return toAssessment(res.data.data);
    },

    async create(patientId, dto) {
        const res = await apiClient.post<{ data: ApiAssessmentFullDto }>(
            `/clinic/patients/${patientId}/assessments`,
            {
                admin_assessment_template_id: dto.templateId,
                ...toWritePayload(dto),
            },
        );
        return toAssessment(res.data.data);
    },

    async update(id, dto) {
        const res = await apiClient.put<{ data: ApiAssessmentFullDto }>(
            `/clinic/assessments/${id}`,
            toWritePayload(dto),
        );
        return toAssessment(res.data.data);
    },

    async sign(id) {
        const res = await apiClient.post<{ data: ApiAssessmentFullDto }>(
            `/clinic/assessments/${id}/sign`,
        );
        return toAssessment(res.data.data);
    },

    async destroy(id) {
        await apiClient.delete(`/clinic/assessments/${id}`);
    },

    async listTemplates(params = {}) {
        // API returns the paginator directly (no { data: ... } envelope)
        const res = await apiClient.get<ApiTemplateListResponse>(
            '/clinic/assessment-templates',
            {
                params: {
                    search: params.search || undefined,
                    page: params.page,
                    per_page: params.perPage,
                },
            },
        );
        const page = res.data;
        return {
            data: page.data.map(toTemplateSummary),
            total: page.total,
            lastPage: page.last_page,
        } satisfies AssessmentTemplateListResult;
    },

    async findTemplate(id) {
        const res = await apiClient.get<{ data: ApiAssessmentTemplateFullDto }>(
            `/clinic/assessment-templates/${id}`,
        );
        return toTemplate(res.data.data);
    },
};
