import { z } from 'zod';

import type { EvolutionTemplateWriteDto } from '@/application/clinic/ports';
import type { EvolutionTemplate } from '@/domain/clinic';

import { sortedSections } from '../TryTemplate';

export const evolutionTemplateItemSchema = z.object({
    key: z.string(),
    id: z.number().optional(),
    label: z.string().trim().min(1, 'Informe o nome do item.').max(500),
    printText: z
        .string()
        .trim()
        .min(1, 'Informe o texto do prontuário.')
        .max(2000),
    hasFreeText: z.boolean(),
    placeholder: z.string().max(255),
});

export const evolutionTemplateSectionSchema = z.object({
    key: z.string(),
    id: z.number().optional(),
    title: z.string().trim().min(1, 'Informe o título da seção.').max(255),
    items: z
        .array(evolutionTemplateItemSchema)
        .min(1, 'Adicione ao menos um item na seção.'),
});

export const evolutionTemplateFormSchema = z.object({
    name: z.string().trim().min(1, 'Dê um nome ao modelo.').max(255),
    description: z.string().max(2000),
    sections: z
        .array(evolutionTemplateSectionSchema)
        .min(1, 'Adicione ao menos uma seção.'),
});

export interface EvolutionTemplateItemFormValue {
    key: string;
    id?: number;
    label: string;
    printText: string;
    hasFreeText: boolean;
    placeholder: string;
}

export interface EvolutionTemplateSectionFormValue {
    key: string;
    id?: number;
    title: string;
    items: EvolutionTemplateItemFormValue[];
}

export interface EvolutionTemplateFormValues {
    name: string;
    description: string;
    sections: EvolutionTemplateSectionFormValue[];
}

export function emptyItem(): EvolutionTemplateItemFormValue {
    return {
        key: crypto.randomUUID(),
        label: '',
        printText: '',
        hasFreeText: false,
        placeholder: '',
    };
}

export function emptySection(): EvolutionTemplateSectionFormValue {
    return {
        key: crypto.randomUUID(),
        title: '',
        items: [emptyItem()],
    };
}

export function toFormValues(
    template: EvolutionTemplate | null,
): EvolutionTemplateFormValues {
    if (!template) {
        return {
            name: '',
            description: '',
            sections: [emptySection()],
        };
    }

    const includeIds = !template.isSystem;
    return {
        name: template.name,
        description: template.description ?? '',
        sections: sortedSections(template).map((section) => ({
            key: crypto.randomUUID(),
            ...(includeIds ? { id: section.id } : {}),
            title: section.title,
            items: section.items.map((item) => ({
                key: crypto.randomUUID(),
                ...(includeIds ? { id: item.id } : {}),
                label: item.label,
                printText: item.printText,
                hasFreeText: item.hasFreeText,
                placeholder: item.freeTextPlaceholder ?? '',
            })),
        })),
    };
}

export function problemsOf(
    name: string,
    sections: EvolutionTemplateSectionFormValue[],
    description = '',
): string[] {
    const out: string[] = [];
    const trimmedName = name.trim();
    if (!trimmedName) out.push('Dê um nome ao modelo.');
    else if (trimmedName.length > 255)
        out.push('O nome do modelo deve ter no máximo 255 caracteres.');

    if (description.length > 2000)
        out.push('A descrição deve ter no máximo 2000 caracteres.');

    if (sections.length === 0) out.push('Adicione ao menos uma seção.');
    sections.forEach((s, i) => {
        const trimmedTitle = s.title.trim();
        if (!trimmedTitle) out.push(`A seção ${i + 1} está sem título.`);
        else if (trimmedTitle.length > 255)
            out.push(
                `O título da seção ${i + 1} deve ter no máximo 255 caracteres.`,
            );

        if (s.items.length === 0) out.push(`A seção ${i + 1} não tem itens.`);
        s.items.forEach((it, j) => {
            const trimmedLabel = it.label.trim();
            const trimmedPrint = it.printText.trim();
            if (!trimmedLabel || !trimmedPrint) {
                out.push(
                    `Item ${j + 1} da seção ${i + 1}: falta ${!trimmedLabel ? 'o nome' : 'o texto do prontuário'}.`,
                );
            } else {
                if (trimmedLabel.length > 500) {
                    out.push(
                        `Item ${j + 1} da seção ${i + 1}: o nome deve ter no máximo 500 caracteres.`,
                    );
                }
                if (trimmedPrint.length > 2000) {
                    out.push(
                        `Item ${j + 1} da seção ${i + 1}: o texto do prontuário deve ter no máximo 2000 caracteres.`,
                    );
                }
            }
            if (it.hasFreeText && it.placeholder.length > 255) {
                out.push(
                    `Item ${j + 1} da seção ${i + 1}: a dica do complemento deve ter no máximo 255 caracteres.`,
                );
            }
        });
    });
    return out;
}

export function toWriteDto(
    values: EvolutionTemplateFormValues,
    options: { includeIds: boolean; isActive?: boolean },
): EvolutionTemplateWriteDto {
    const dto: EvolutionTemplateWriteDto = {
        name: values.name.trim(),
        description: values.description.trim()
            ? values.description.trim()
            : null,
        sections: values.sections.map((section, sectionIndex) => ({
            ...(options.includeIds && section.id !== undefined
                ? { id: section.id }
                : {}),
            title: section.title.trim(),
            sortOrder: sectionIndex,
            items: section.items.map((item, itemIndex) => ({
                ...(options.includeIds && item.id !== undefined
                    ? { id: item.id }
                    : {}),
                label: item.label.trim(),
                printText: item.printText.trim(),
                hasFreeText: item.hasFreeText,
                freeTextPlaceholder: item.hasFreeText
                    ? item.placeholder.trim() || null
                    : null,
                sortOrder: itemIndex,
            })),
        })),
    };

    if (options.isActive !== undefined) {
        dto.isActive = options.isActive;
    }

    return dto;
}
