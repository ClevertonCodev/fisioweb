import type { EvolutionTemplate, EvolutionTemplateItem } from '@/domain/clinic';

export interface EvolutionSheetBlock {
    section: string;
    lines: string[];
}

function sortedSections(template: EvolutionTemplate) {
    return [...template.sections]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({
            ...s,
            items: [...s.items].sort((a, b) => a.sortOrder - b.sortOrder),
        }));
}

export function itemLine(item: EvolutionTemplateItem, free?: string): string {
    return item.hasFreeText && free?.trim()
        ? `${item.printText} — ${free.trim()}`
        : item.printText;
}

/** Mesmo formato de `EvolutionService::generateText`: `**Seção:**` e uma linha por item. */
export function evolutionSheetBlocks(
    template: EvolutionTemplate | undefined,
    checked: Set<number>,
    freeTexts: Record<number, string>,
): EvolutionSheetBlock[] {
    if (!template) return [];
    return sortedSections(template)
        .map((s) => ({
            section: s.title,
            lines: s.items
                .filter((i) => checked.has(i.id))
                .map((i) => itemLine(i, freeTexts[i.id])),
        }))
        .filter((b) => b.lines.length > 0);
}

export function buildEvolutionSheetText(
    template: EvolutionTemplate | undefined,
    checked: Set<number>,
    freeTexts: Record<number, string>,
): string {
    return evolutionSheetBlocks(template, checked, freeTexts)
        .map((b) => [`**${b.section}:**`, ...b.lines].join('\n'))
        .join('\n\n');
}
