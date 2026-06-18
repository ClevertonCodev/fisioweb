import type {
    EvolutionsRepository,
    EvolutionTemplateWriteDto,
    EvolutionWriteDto,
} from '@/application/clinic/ports';
import type {
    EvolutionCheckedItem,
    EvolutionTemplate,
    EvolutionTemplateItem,
    EvolutionTemplateSection,
    PatientEvolution,
} from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';

interface ApiEvolutionTemplateItemDto {
    id: number;
    label: string;
    print_text: string;
    has_free_text: boolean;
    free_text_placeholder: string | null;
    sort_order: number;
}

interface ApiEvolutionTemplateSectionDto {
    id: number;
    title: string;
    sort_order: number;
    items: ApiEvolutionTemplateItemDto[];
}

interface ApiEvolutionTemplateDto {
    id: number;
    clinic_id: number | null;
    name: string;
    description: string | null;
    is_system: boolean;
    is_active: boolean;
    sections?: ApiEvolutionTemplateSectionDto[];
}

interface ApiEvolutionCheckedItemDto {
    id?: number;
    evolution_template_item_id: number;
    free_text_value: string | null;
}

interface ApiClinicUserDto {
    id: number;
    name: string;
}

interface ApiPatientEvolutionDto {
    id: number;
    patient_id: number;
    clinic_user_id: number;
    clinic_user?: ApiClinicUserDto;
    evolution_template_id: number | null;
    template?: ApiEvolutionTemplateDto;
    title: string;
    generated_text: string | null;
    notes: string | null;
    checked_items?: ApiEvolutionCheckedItemDto[];
    status: 'draft' | 'signed';
    signed_at: string | null;
    created_at: string;
}

function toTemplateItem(
    raw: ApiEvolutionTemplateItemDto,
): EvolutionTemplateItem {
    return {
        id: raw.id,
        label: raw.label,
        printText: raw.print_text,
        hasFreeText: raw.has_free_text,
        freeTextPlaceholder: raw.free_text_placeholder,
        sortOrder: raw.sort_order,
    };
}

function toTemplateSection(
    raw: ApiEvolutionTemplateSectionDto,
): EvolutionTemplateSection {
    return {
        id: raw.id,
        title: raw.title,
        sortOrder: raw.sort_order,
        items: (raw.items ?? []).map(toTemplateItem),
    };
}

function toTemplate(raw: ApiEvolutionTemplateDto): EvolutionTemplate {
    return {
        id: raw.id,
        clinicId: raw.clinic_id,
        name: raw.name,
        description: raw.description,
        isSystem: raw.is_system,
        isActive: raw.is_active,
        sections: (raw.sections ?? []).map(toTemplateSection),
    };
}

function toCheckedItem(raw: ApiEvolutionCheckedItemDto): EvolutionCheckedItem {
    return {
        itemId: raw.evolution_template_item_id,
        freeTextValue: raw.free_text_value,
    };
}

function toEvolution(raw: ApiPatientEvolutionDto): PatientEvolution {
    return {
        id: raw.id,
        patientId: raw.patient_id,
        clinicUserId: raw.clinic_user_id,
        clinicUser: raw.clinic_user,
        evolutionTemplateId: raw.evolution_template_id,
        template: raw.template ? toTemplate(raw.template) : undefined,
        title: raw.title,
        generatedText: raw.generated_text,
        notes: raw.notes,
        checkedItems: (raw.checked_items ?? []).map(toCheckedItem),
        status: raw.status,
        signedAt: raw.signed_at,
        createdAt: raw.created_at,
    };
}

function toWritePayload(dto: EvolutionWriteDto) {
    const freeTextValues = dto.freeTextValues.map((v) => ({
        item_id: v.itemId,
        value: v.value,
    }));
    return {
        title: dto.title,
        evolution_template_id: dto.evolutionTemplateId,
        checked_item_ids: dto.checkedItemIds,
        free_text_values: freeTextValues,
        generated_text: dto.generatedText,
        notes: dto.notes,
    };
}

function toTemplateWritePayload(dto: EvolutionTemplateWriteDto) {
    return {
        name: dto.name,
        description: dto.description,
        is_active: dto.isActive ?? true,
        sections: dto.sections.map((s) => ({
            title: s.title,
            sort_order: s.sortOrder,
            items: s.items.map((item) => ({
                label: item.label,
                print_text: item.printText,
                has_free_text: item.hasFreeText,
                free_text_placeholder: item.freeTextPlaceholder,
                sort_order: item.sortOrder,
            })),
        })),
    };
}

export const apiClinicEvolutionsRepository: EvolutionsRepository = {
    async listByPatient(patientId) {
        const res = await apiClient.get<{ data: ApiPatientEvolutionDto[] }>(
            `/clinic/patients/${patientId}/evolutions`,
        );
        return res.data.data.map(toEvolution);
    },
    async listTemplates() {
        const res = await apiClient.get<{ data: ApiEvolutionTemplateDto[] }>(
            '/clinic/evolution-templates',
        );
        return res.data.data.map(toTemplate);
    },
    async findTemplate(id) {
        const res = await apiClient.get<{ data: ApiEvolutionTemplateDto }>(
            `/clinic/evolution-templates/${id}`,
        );
        return toTemplate(res.data.data);
    },
    async createTemplate(dto) {
        const res = await apiClient.post<{ data: ApiEvolutionTemplateDto }>(
            '/clinic/evolution-templates',
            toTemplateWritePayload(dto),
        );
        return toTemplate(res.data.data);
    },
    async updateTemplate(id, dto) {
        const res = await apiClient.put<{ data: ApiEvolutionTemplateDto }>(
            `/clinic/evolution-templates/${id}`,
            toTemplateWritePayload(dto),
        );
        return toTemplate(res.data.data);
    },
    async destroyTemplate(id) {
        await apiClient.delete(`/clinic/evolution-templates/${id}`);
    },
    async find(id) {
        const res = await apiClient.get<{ data: ApiPatientEvolutionDto }>(
            `/clinic/evolutions/${id}`,
        );
        return toEvolution(res.data.data);
    },
    async create(patientId, dto) {
        const res = await apiClient.post<{ data: ApiPatientEvolutionDto }>(
            `/clinic/patients/${patientId}/evolutions`,
            toWritePayload(dto),
        );
        return toEvolution(res.data.data);
    },
    async update(id, dto) {
        const res = await apiClient.put<{ data: ApiPatientEvolutionDto }>(
            `/clinic/evolutions/${id}`,
            toWritePayload(dto),
        );
        return toEvolution(res.data.data);
    },
    async sign(id) {
        const res = await apiClient.post<{ data: ApiPatientEvolutionDto }>(
            `/clinic/evolutions/${id}/sign`,
        );
        return toEvolution(res.data.data);
    },
    async destroy(id) {
        await apiClient.delete(`/clinic/evolutions/${id}`);
    },
    async generateText(id, checkedItemIds, freeTextValues) {
        const payload = {
            checked_item_ids: checkedItemIds,
            free_text_values: freeTextValues.map((v) => ({
                item_id: v.itemId,
                value: v.value,
            })),
        };
        const res = await apiClient.post<{ data: { generated_text: string } }>(
            `/clinic/evolutions/${id}/generate-text`,
            payload,
        );
        return { generatedText: res.data.data.generated_text };
    },
    async fetchPdfBlob(id) {
        const res = await apiClient.get<Blob>(`/clinic/evolutions/${id}/pdf`, {
            responseType: 'blob',
        });
        return res.data;
    },
};
