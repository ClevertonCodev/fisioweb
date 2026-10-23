import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
    buildEvolutionSheetText,
    evolutionSheetBlocks,
} from '@/application/clinic/evolution-sheet-text';
import type { EvolutionWriteDto } from '@/application/clinic/ports';
import {
    useCreateEvolution,
    useEvolutionTemplates,
    usePatientEvolutions,
    useSignEvolution,
    useUpdateEvolution,
} from '@/application/clinic/use-evolutions';
import type { PatientEvolution } from '@/domain/clinic';

export type EvolutionMode = 'template' | 'free';

function todayLabel(): string {
    return new Date().toLocaleDateString('pt-BR');
}

function defaultTitle(): string {
    return `Sessão de fisioterapia — ${todayLabel()}`;
}

function freeTextValuesPayload(
    checked: Set<number>,
    freeTexts: Record<number, string>,
): { itemId: number; value: string }[] {
    return Object.entries(freeTexts)
        .filter(
            ([idStr, value]) =>
                checked.has(Number(idStr)) && value.trim() !== '',
        )
        .map(([idStr, value]) => ({ itemId: Number(idStr), value }));
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

    const last: PatientEvolution | undefined = useMemo(
        () =>
            [...(evolutions.data ?? [])]
                .filter((e) => e.id !== evolutionToEdit?.id)
                .sort(
                    (a, b) =>
                        +new Date(b.signedAt ?? b.createdAt) -
                        +new Date(a.signedAt ?? a.createdAt),
                )[0],
        [evolutions.data, evolutionToEdit?.id],
    );

    const [title, setTitle] = useState(
        () => evolutionToEdit?.title || defaultTitle(),
    );
    const [mode, setMode] = useState<EvolutionMode>(() => {
        if (!evolutionToEdit) return 'template';
        return evolutionToEdit.evolutionTemplateId != null
            ? 'template'
            : 'free';
    });
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
        evolutionToEdit?.evolutionTemplateId == null
            ? (evolutionToEdit?.generatedText ?? '')
            : '',
    );
    const [notes, setNotes] = useState(() => evolutionToEdit?.notes ?? '');
    const [titleError, setTitleError] = useState(false);

    const template = templates.data?.find((t) => t.id === templateId);
    const blocks = evolutionSheetBlocks(template, checked, freeTexts);
    const rebuilt = buildEvolutionSheetText(template, checked, freeTexts);
    const savedSheetText = evolutionToEdit?.generatedText ?? '';
    const generated = template ? rebuilt : savedSheetText;

    const toggle = (id: number) =>
        setChecked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const setFree = (id: number, value: string) =>
        setFreeTexts((prev) => ({ ...prev, [id]: value }));

    const pickTemplate = (id: number) => {
        setTemplateId(id);
        setChecked(new Set());
        setFreeTexts({});
    };

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
    const saving =
        createEvolution.isPending ||
        updateEvolution.isPending ||
        signEvolution.isPending;

    const buildDto = (): EvolutionWriteDto =>
        mode === 'template'
            ? {
                  title: title.trim(),
                  evolutionTemplateId: template?.id ?? null,
                  checkedItemIds: Array.from(checked),
                  freeTextValues: freeTextValuesPayload(checked, freeTexts),
                  generatedText: generated || null,
                  notes: notes.trim() || null,
              }
            : {
                  title: title.trim(),
                  evolutionTemplateId: null,
                  checkedItemIds: [],
                  freeTextValues: [],
                  generatedText: freeText.trim() || null,
                  notes: notes.trim() || null,
              };

    const save = async (sign: boolean) => {
        if (!title.trim()) {
            setTitleError(true);
            return;
        }
        if (sign && empty) {
            toast.error('Escreva ou marque algo antes de assinar.');
            return;
        }
        const dto = buildDto();
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
        sections: template
            ? [...template.sections]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((s) => ({
                      ...s,
                      items: [...s.items].sort(
                          (a, b) => a.sortOrder - b.sortOrder,
                      ),
                  }))
            : [],
        last,
        title,
        setTitle: (v: string) => {
            setTitle(v);
            if (v.trim()) setTitleError(false);
        },
        titleError,
        mode,
        setMode,
        pickTemplate,
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
        saving,
        save,
        isEditing: !!evolutionToEdit,
    };
}

export type EvolutionComposer = ReturnType<typeof useEvolutionComposer>;
