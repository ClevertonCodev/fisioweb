/**
 * Folha da evolução (DS v2): o texto do modelo segue o formato do backend
 * (`**Seção:**` e uma linha por item). Salvar e assinar gravam de verdade.
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
    useCreateEvolution,
    useEvolutionTemplates,
    usePatientEvolutions,
    useSignEvolution,
    useUpdateEvolution,
} from '@/application/clinic/use-evolutions';
import type {
    EvolutionTemplate,
    EvolutionTemplateItem,
    PatientEvolution,
} from '@/domain/clinic';

export type Mode = 'template' | 'free';

export interface TextBlock {
    section: string;
    lines: string[];
}

function todayLabel(): string {
    return new Date().toLocaleDateString('pt-BR');
}

function freeTextValuesPayload(
    checkedIds: Set<number>,
    freeTexts: Record<number, string>,
): { itemId: number; value: string }[] {
    return Object.entries(freeTexts)
        .filter(
            ([idStr, value]) =>
                checkedIds.has(Number(idStr)) && value.trim() !== '',
        )
        .map(([idStr, value]) => ({ itemId: Number(idStr), value }));
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

function initialMode(evolution?: PatientEvolution): Mode {
    if (!evolution) return 'template';
    return evolution.evolutionTemplateId != null ? 'template' : 'free';
}

function initialFreeTexts(
    evolution?: PatientEvolution,
): Record<number, string> {
    const texts: Record<number, string> = {};
    evolution?.checkedItems.forEach((ci) => {
        if (ci.freeTextValue) texts[ci.itemId] = ci.freeTextValue;
    });
    return texts;
}

export function useEvolutionComposer(
    patientId: string,
    onClose: () => void,
    evolutionToEdit?: PatientEvolution,
) {
    const templates = useEvolutionTemplates();
    const evolutions = usePatientEvolutions(patientId);
    const createEvolution = useCreateEvolution(patientId);
    const updateEvolution = useUpdateEvolution(patientId);
    const signEvolution = useSignEvolution(patientId);

    const isEditing = !!evolutionToEdit;
    const isReadOnly = evolutionToEdit?.status === 'signed';

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
        () =>
            evolutionToEdit?.title ??
            `Sessão de fisioterapia — ${todayLabel()}`,
    );
    const [mode, setMode] = useState<Mode>(() => initialMode(evolutionToEdit));
    const [templateId, setTemplateId] = useState<number | null>(
        () => evolutionToEdit?.evolutionTemplateId ?? null,
    );
    const [checked, setChecked] = useState<Set<number>>(
        () => new Set(evolutionToEdit?.checkedItems.map((c) => c.itemId) ?? []),
    );
    const [freeTexts, setFreeTexts] = useState<Record<number, string>>(() =>
        initialFreeTexts(evolutionToEdit),
    );
    const [freeText, setFreeText] = useState(() =>
        evolutionToEdit && evolutionToEdit.evolutionTemplateId == null
            ? (evolutionToEdit.generatedText ?? '')
            : '',
    );
    const [notes, setNotes] = useState(() => evolutionToEdit?.notes ?? '');
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

    const repeatLast = () => {
        if (!last || isReadOnly) return;
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
    const saving =
        createEvolution.isPending ||
        updateEvolution.isPending ||
        signEvolution.isPending;

    const save = async (sign: boolean) => {
        if (isReadOnly) return;
        if (!title.trim()) {
            setTitleError(true);
            return;
        }
        if (sign && empty) {
            toast.error('Escreva ou marque algo antes de assinar.');
            return;
        }
        const dto = {
            title: title.trim(),
            evolutionTemplateId:
                mode === 'template' ? (template?.id ?? null) : null,
            checkedItemIds: mode === 'template' ? Array.from(checked) : [],
            freeTextValues:
                mode === 'template'
                    ? freeTextValuesPayload(checked, freeTexts)
                    : [],
            generatedText: body || null,
            notes: notes || null,
        };
        try {
            let evolutionId: string;
            if (evolutionToEdit) {
                const updated = await updateEvolution.mutateAsync({
                    id: String(evolutionToEdit.id),
                    dto,
                });
                evolutionId = String(updated.id);
            } else {
                const created = await createEvolution.mutateAsync(dto);
                evolutionId = String(created.id);
            }
            if (sign) {
                await signEvolution.mutateAsync(evolutionId);
                toast.success('Evolução assinada e salva.');
            } else {
                toast.success('Rascunho salvo.');
            }
            onClose();
        } catch {
            // toast já exibido pelos hooks
        }
    };

    return {
        loading: templates.isLoading,
        templates: templates.data ?? [],
        template,
        sections,
        last,
        isEditing,
        isReadOnly,
        saving,
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
