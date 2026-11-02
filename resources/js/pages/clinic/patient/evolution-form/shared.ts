import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type { EvolutionTemplate, PatientEvolution } from '@/domain/clinic';

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

/**
 * O modelo como a tela mostra: o modelo atual mais os itens arquivados que o
 * rascunho ainda tem marcados (ADR 021). Assim o item arquivado aparece, pode
 * ser desmarcado e entra na folha igual ao texto que o servidor gera.
 */
function withArchivedCheckedItems(
    template: EvolutionTemplate | undefined,
    evolution: PatientEvolution | undefined,
): { template: EvolutionTemplate | undefined; archivedIds: Set<number> } {
    const archivedIds = new Set<number>();
    if (
        !template ||
        !evolution ||
        template.id !== evolution.evolutionTemplateId
    )
        return { template, archivedIds };

    const onTemplate = new Set(
        template.sections.flatMap((s) => s.items.map((i) => i.id)),
    );
    const sections = template.sections.map((s) => ({
        ...s,
        items: [...s.items],
    }));
    evolution.checkedItems.forEach(({ itemId, item }) => {
        if (!item || onTemplate.has(itemId)) return;
        let section = sections.find((s) => s.id === item.sectionId);
        if (!section) {
            section = {
                id: item.sectionId,
                title: item.sectionTitle,
                sortOrder: item.sectionSortOrder,
                items: [],
            };
            sections.push(section);
        }
        section.items.push({
            id: itemId,
            label: item.label,
            printText: item.printText,
            hasFreeText: item.hasFreeText,
            freeTextPlaceholder: item.freeTextPlaceholder,
            sortOrder: item.sortOrder,
        });
        archivedIds.add(itemId);
    });

    return { template: { ...template, sections }, archivedIds };
}

export function useEvolutionComposer(
    patientId: string,
    onClose: () => void,
    evolutionToEdit?: PatientEvolution,
) {
    const navigate = useNavigate();
    const templates = useEvolutionTemplates();
    const evolutions = usePatientEvolutions(patientId);
    const createEvolution = useCreateEvolution(patientId);
    const updateEvolution = useUpdateEvolution(patientId);
    const signEvolution = useSignEvolution(patientId);

    const availableTemplates = useMemo(
        () =>
            (templates.data ?? []).filter(
                (t) =>
                    t.isActive || t.id === evolutionToEdit?.evolutionTemplateId,
            ),
        [templates.data, evolutionToEdit?.evolutionTemplateId],
    );

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
    // Depois que a pessoa mexe em algo, sair para os modelos pede confirmação.
    const [touched, setTouched] = useState(false);
    const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
    const touching =
        <A extends unknown[]>(fn: (...args: A) => void) =>
        (...args: A) => {
            setTouched(true);
            fn(...args);
        };

    const { template, archivedIds } = useMemo(
        () =>
            withArchivedCheckedItems(
                availableTemplates.find((t) => t.id === templateId),
                evolutionToEdit,
            ),
        [availableTemplates, templateId, evolutionToEdit],
    );
    const activeItemIds = template
        ? new Set(template.sections.flatMap((s) => s.items.map((i) => i.id)))
        : null;
    const alreadyCheckedIds = new Set(
        evolutionToEdit?.checkedItems.map((c) => c.itemId) ?? [],
    );
    // Evolução nova só manda item que ainda está no modelo. Rascunho reenvia
    // o que já estava marcado, mesmo que o item tenha sido arquivado depois;
    // sem os dados do item a tela não o mostra e mantém o texto gravado.
    const keptChecked = activeItemIds
        ? new Set(
              Array.from(checked).filter(
                  (id) =>
                      activeItemIds.has(id) ||
                      (evolutionToEdit != null && alreadyCheckedIds.has(id)),
              ),
          )
        : checked;
    const keptOffTemplate = activeItemIds
        ? Array.from(keptChecked).filter((id) => !activeItemIds.has(id))
        : [];
    const blocks = evolutionSheetBlocks(template, checked, freeTexts);
    const rebuilt = buildEvolutionSheetText(template, checked, freeTexts);
    const savedSheetText = evolutionToEdit?.generatedText ?? '';
    const generated =
        keptOffTemplate.length > 0 && !rebuilt.trim()
            ? savedSheetText
            : template
              ? rebuilt
              : savedSheetText;

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
        const targetTemplate =
            last.evolutionTemplateId != null
                ? availableTemplates.find(
                      (t) => t.id === last.evolutionTemplateId && t.isActive,
                  )
                : availableTemplates.find(
                      (t) => t.id === templateId && t.isActive,
                  );

        if (last.checkedItems.length > 0 && targetTemplate) {
            const validItemIds = new Set(
                targetTemplate.sections.flatMap((s) =>
                    s.items.map((i) => i.id),
                ),
            );
            const validCheckedItems = last.checkedItems.filter((c) =>
                validItemIds.has(c.itemId),
            );
            if (validCheckedItems.length > 0) {
                setTemplateId(targetTemplate.id);
                setMode('template');
                setChecked(new Set(validCheckedItems.map((c) => c.itemId)));
                setFreeTexts(
                    Object.fromEntries(
                        validCheckedItems
                            .filter((c) => c.freeTextValue)
                            .map((c) => [c.itemId, c.freeTextValue as string]),
                    ),
                );
                toast.info(
                    `${validCheckedItems.length} itens da última sessão marcados. Ajuste o que mudou.`,
                );
                return;
            }
        }
        setMode('free');
        setFreeText(last.generatedText ?? '');
        toast.info('Texto da última sessão copiado. Ajuste o que mudou.');
    };

    const body =
        mode === 'template'
            ? keptOffTemplate.length > 0
                ? savedSheetText || generated
                : generated
            : freeText;
    const empty = !body.trim() && !notes.trim();
    const saving =
        createEvolution.isPending ||
        updateEvolution.isPending ||
        signEvolution.isPending;

    const buildDto = (): EvolutionWriteDto => {
        if (mode === 'template') {
            const onTemplateNow = activeItemIds
                ? Array.from(keptChecked).filter((id) => activeItemIds.has(id))
                : [];
            const onTemplateBefore = activeItemIds
                ? Array.from(alreadyCheckedIds).filter((id) =>
                      activeItemIds.has(id),
                  )
                : [];
            const visibleChecksUnchanged =
                onTemplateNow.length === onTemplateBefore.length &&
                onTemplateNow.every((id) => onTemplateBefore.includes(id)) &&
                onTemplateNow.every((id) => {
                    const original =
                        evolutionToEdit?.checkedItems.find(
                            (item) => item.itemId === id,
                        )?.freeTextValue ?? '';
                    return (freeTexts[id] ?? '').trim() === original.trim();
                });
            return {
                title: title.trim(),
                // O modelo escolhido, mesmo fora da lista (modelo excluído):
                // mandar null aqui seria pedir ao servidor para tirar o modelo.
                evolutionTemplateId: templateId,
                checkedItemIds: Array.from(keptChecked),
                freeTextValues: freeTextValuesPayload(keptChecked, freeTexts),
                generatedText:
                    keptOffTemplate.length > 0
                        ? visibleChecksUnchanged
                            ? savedSheetText.trim() || null
                            : null
                        : generated || null,
                notes: notes.trim() || null,
            };
        }

        return {
            title: title.trim(),
            evolutionTemplateId: null,
            checkedItemIds: [],
            freeTextValues: [],
            generatedText: freeText.trim() || null,
            notes: notes.trim() || null,
        };
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

    function leaveToTemplates() {
        setLeaveConfirmOpen(false);
        onClose();
        navigate(
            `/clinica/templates/evolucoes?returnTo=${encodeURIComponent(
                `/clinica/pacientes/${patientId}`,
            )}`,
        );
    }

    return {
        loading: templates.isLoading,
        templates: availableTemplates,
        template,
        manageTemplates: () => {
            if (touched) setLeaveConfirmOpen(true);
            else leaveToTemplates();
        },
        leaveConfirmOpen,
        cancelLeave: () => setLeaveConfirmOpen(false),
        confirmLeave: leaveToTemplates,
        sections: template
            ? [...template.sections]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((s) => ({
                      ...s,
                      items: [...s.items]
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((i) => ({
                              ...i,
                              archived: archivedIds.has(i.id),
                          })),
                  }))
            : [],
        last,
        title,
        setTitle: touching((v: string) => {
            setTitle(v);
            if (v.trim()) setTitleError(false);
        }),
        titleError,
        mode,
        setMode: touching(setMode),
        pickTemplate: touching(pickTemplate),
        checked,
        toggle: touching(toggle),
        freeTexts,
        setFree: touching(setFree),
        freeText,
        setFreeText: touching(setFreeText),
        notes,
        setNotes: touching(setNotes),
        blocks,
        generated,
        repeatLast: touching(repeatLast),
        empty,
        saving,
        save,
        isEditing: !!evolutionToEdit,
    };
}

export type EvolutionComposer = ReturnType<typeof useEvolutionComposer>;
