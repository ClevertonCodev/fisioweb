import type {
    EvolutionTemplate,
    EvolutionTemplateItem,
    PatientEvolution,
} from '@/domain/clinic';

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

const SHEET_SECTION_HEAD = /^\*\*(.+):\*\*$/;

/** Inverte o formato gravado em `generated_text` (modelo com seções). */
export function parseEvolutionSheetText(text: string): EvolutionSheetBlock[] {
    const trimmed = text.trim();
    if (!trimmed.includes('**')) return [];

    const blocks: EvolutionSheetBlock[] = [];
    for (const chunk of trimmed.split(/\n\n+/)) {
        const lines = chunk
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
        if (lines.length === 0) continue;
        const match = lines[0].match(SHEET_SECTION_HEAD);
        if (match) {
            blocks.push({ section: match[1], lines: lines.slice(1) });
        }
    }
    return blocks;
}

/** Uma linha legível na lista do prontuário (sem markdown). */
export function evolutionListPreview(
    generatedText: string | null | undefined,
): string {
    if (!generatedText?.trim()) return '';
    const parsed = parseEvolutionSheetText(generatedText);
    if (parsed.length > 0) {
        return parsed
            .map((block) => {
                const body = block.lines.join(' ');
                return body ? `${block.section}: ${body}` : block.section;
            })
            .join(' · ');
    }
    return generatedText.replace(/\s+/g, ' ').trim();
}

/** Blocos para o drawer: modelo parseado ou texto livre por frase. */
export function evolutionDetailBlocks(
    evolution: Pick<PatientEvolution, 'generatedText'>,
): EvolutionSheetBlock[] {
    const text = evolution.generatedText?.trim() ?? '';
    if (!text) return [];
    const parsed = parseEvolutionSheetText(text);
    if (parsed.length > 0) return parsed;
    return [
        {
            section: 'Condutas',
            lines: text.split(/(?<=\.)\s+/).filter(Boolean),
        },
    ];
}
