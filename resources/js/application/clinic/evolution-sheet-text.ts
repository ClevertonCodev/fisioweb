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

const SHEET_SECTION_MARKER = /\*\*([^*]+):\*\*/g;

function sheetLinesFromBody(body: string): string[] {
    return body
        .split('\n')
        .flatMap((line) => line.split(/(?=\*\*[^*]+:\*\*)/))
        .map((line) =>
            line
                .replace(/\*\*([^*]+):\*\*/g, '')
                .replace(/^[\s\-–—]+/, '')
                .trim(),
        )
        .filter(Boolean);
}

/** Inverte o formato gravado em `generated_text` (modelo com seções). */
export function parseEvolutionSheetText(text: string): EvolutionSheetBlock[] {
    const trimmed = text.trim();
    if (!trimmed.includes('**')) return [];

    const markers = [...trimmed.matchAll(SHEET_SECTION_MARKER)];
    if (markers.length === 0) return [];

    const blocks: EvolutionSheetBlock[] = [];
    for (let i = 0; i < markers.length; i += 1) {
        const match = markers[i];
        const section = match[1].trim();
        const start = (match.index ?? 0) + match[0].length;
        const end =
            i + 1 < markers.length
                ? (markers[i + 1].index ?? trimmed.length)
                : trimmed.length;
        const lines = sheetLinesFromBody(trimmed.slice(start, end));
        if (lines.length > 0) {
            blocks.push({ section, lines });
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
    return generatedText
        .replace(SHEET_SECTION_MARKER, '$1: ')
        .replace(/\s+/g, ' ')
        .trim();
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
