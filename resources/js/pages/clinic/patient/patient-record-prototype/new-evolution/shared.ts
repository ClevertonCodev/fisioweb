/**
 * PROTÓTIPO (descartável): o rascunho da nova evolução, igual para as
 * variantes. Modelos e última evolução são reais; o texto do modelo é
 * montado aqui no mesmo formato do backend (EvolutionService::generateText:
 * "**Seção:**" e uma linha por item, com " — texto" quando o item pede).
 * Salvar e assinar são stub.
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
    useEvolutionTemplates,
    usePatientEvolutions,
} from '@/application/clinic/use-evolutions';
import type {
    EvolutionTemplate,
    EvolutionTemplateItem,
    PatientEvolution,
} from '@/domain/clinic';

export const EVOLUTION_VARIANTS = [
    { key: 'O', name: 'Gaveta atual (v1)' },
    { key: 'B', name: 'Folha da evolução' },
] as const;

export type Mode = 'template' | 'free';

export interface TextBlock {
    section: string;
    lines: string[];
}

function todayLabel(): string {
    return new Date().toLocaleDateString('pt-BR');
}

export function sortedSections(template: EvolutionTemplate | undefined) {
    if (!template) return [];
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

export function useEvolutionComposer(patientId: string, onClose: () => void) {
    const templates = useEvolutionTemplates();
    const evolutions = usePatientEvolutions(patientId);

    const last: PatientEvolution | undefined = useMemo(
        () =>
            [...(evolutions.data ?? [])].sort(
                (a, b) =>
                    +new Date(b.signedAt ?? b.createdAt) -
                    +new Date(a.signedAt ?? a.createdAt),
            )[0],
        [evolutions.data],
    );

    const [title, setTitle] = useState(
        () => `Sessão de fisioterapia — ${todayLabel()}`,
    );
    const [mode, setMode] = useState<Mode>('template');
    const [templateId, setTemplateId] = useState<number | null>(null);
    const [checked, setChecked] = useState<Set<number>>(new Set());
    const [freeTexts, setFreeTexts] = useState<Record<number, string>>({});
    const [freeText, setFreeText] = useState('');
    const [notes, setNotes] = useState('');
    const [titleError, setTitleError] = useState(false);

    const template =
        templates.data?.find((t) => t.id === templateId) ?? templates.data?.[0];
    const sections = useMemo(() => sortedSections(template), [template]);

    const blocks: TextBlock[] = sections
        .map((s) => ({
            section: s.title,
            lines: s.items
                .filter((i) => checked.has(i.id))
                .map((i) => itemLine(i, freeTexts[i.id])),
        }))
        .filter((b) => b.lines.length > 0);

    const generated = blocks
        .map((b) => [`**${b.section}:**`, ...b.lines].join('\n'))
        .join('\n\n');

    const toggle = (id: number) =>
        setChecked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const setFree = (id: number, value: string) =>
        setFreeTexts((prev) => ({ ...prev, [id]: value }));

    /**
     * Marca os mesmos itens (e detalhes) da última evolução. Sem itens
     * marcados nela (só texto), copia o texto para o modo livre.
     */
    const repeatLast = () => {
        if (!last) return;
        if (last.checkedItems.length > 0) {
            if (last.evolutionTemplateId) {
                setTemplateId(last.evolutionTemplateId);
            }
            setMode('template');
            setChecked(new Set(last.checkedItems.map((c) => c.itemId)));
            setFreeTexts(
                Object.fromEntries(
                    last.checkedItems
                        .filter((c) => c.freeTextValue)
                        .map((c) => [c.itemId, c.freeTextValue as string]),
                ),
            );
            toast.info(
                `${last.checkedItems.length} itens da última sessão marcados. Ajuste o que mudou.`,
            );
            return;
        }
        setMode('free');
        setFreeText(last.generatedText ?? '');
        toast.info('Texto da última sessão copiado. Ajuste o que mudou.');
    };

    const body = mode === 'template' ? generated : freeText;
    const empty = !body.trim() && !notes.trim();

    const save = (sign: boolean) => {
        if (!title.trim()) {
            setTitleError(true);
            return;
        }
        if (sign && empty) {
            toast.error('Escreva ou marque algo antes de assinar.');
            return;
        }
        toast.success(
            sign
                ? 'Protótipo: evolução não foi assinada nem salva.'
                : 'Protótipo: rascunho não foi salvo.',
        );
        onClose();
    };

    return {
        loading: templates.isLoading,
        templates: templates.data ?? [],
        template,
        sections,
        last,
        title,
        setTitle: (v: string) => {
            setTitle(v);
            if (v.trim()) setTitleError(false);
        },
        titleError,
        mode,
        setMode,
        setTemplateId,
        checked,
        toggle,
        freeTexts,
        setFree,
        freeText,
        setFreeText,
        notes,
        setNotes,
        blocks,
        generated,
        repeatLast,
        empty,
        save,
    };
}

export type EvolutionComposer = ReturnType<typeof useEvolutionComposer>;
