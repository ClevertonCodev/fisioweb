import { ChevronLeft, FileText, LayoutTemplate, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
    useCreateEvolution,
    useEvolutionTemplates,
    useGenerateEvolutionText,
    useSignEvolution,
    useUpdateEvolution,
} from '@/application/clinic/use-evolutions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { EvolutionTemplate, PatientEvolution } from '@/domain/clinic';

export interface EvolutionFormDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    evolutionToEdit?: PatientEvolution;
}

type Mode = 'template' | 'free';

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

export function EvolutionFormDrawer({
    open,
    onOpenChange,
    patientId,
    evolutionToEdit,
}: EvolutionFormDrawerProps) {
    const isEditing = !!evolutionToEdit;
    const isReadOnly = evolutionToEdit?.status === 'signed';

    const [step, setStep] = useState<1 | 2>(() => (evolutionToEdit ? 2 : 1));
    const [mode, setMode] = useState<Mode>(() =>
        evolutionToEdit?.evolutionTemplateId != null ? 'template' : 'free',
    );
    /** Template escolhido no fluxo de criação; em edição usa `templateFromEdit`. */
    const [pickedTemplate, setPickedTemplate] =
        useState<EvolutionTemplate | null>(null);
    const [title, setTitle] = useState(() => evolutionToEdit?.title ?? '');
    const [checkedIds, setCheckedIds] = useState(
        () =>
            new Set(evolutionToEdit?.checkedItems.map((ci) => ci.itemId) ?? []),
    );
    const [freeTexts, setFreeTexts] = useState<Record<number, string>>(() => {
        const texts: Record<number, string> = {};
        evolutionToEdit?.checkedItems.forEach((ci) => {
            if (ci.freeTextValue) texts[ci.itemId] = ci.freeTextValue;
        });
        return texts;
    });
    const [generatedText, setGeneratedText] = useState(
        () => evolutionToEdit?.generatedText ?? '',
    );
    const [notes, setNotes] = useState(() => evolutionToEdit?.notes ?? '');
    /** Rascunho criado ao usar "Gerar texto" antes de "Salvar rascunho" (create só na primeira vez). */
    const [draftEvolutionId, setDraftEvolutionId] = useState<string | null>(
        null,
    );

    const { data: templates, isLoading: loadingTemplates } =
        useEvolutionTemplates();
    const createEvolution = useCreateEvolution(patientId);
    const updateEvolution = useUpdateEvolution(patientId);
    const signEvolution = useSignEvolution(patientId);
    const generateTextMutation = useGenerateEvolutionText();

    const templateFromEdit = useMemo(() => {
        if (!evolutionToEdit?.evolutionTemplateId || !templates?.length)
            return null;
        return (
            templates.find(
                (t) => t.id === evolutionToEdit.evolutionTemplateId,
            ) ?? null
        );
    }, [evolutionToEdit, templates]);

    const activeTemplate = pickedTemplate ?? templateFromEdit;

    const isPending =
        createEvolution.isPending ||
        updateEvolution.isPending ||
        signEvolution.isPending ||
        generateTextMutation.isPending;

    const buildDto = () => ({
        title,
        evolutionTemplateId:
            activeTemplate?.id ?? evolutionToEdit?.evolutionTemplateId ?? null,
        checkedItemIds: Array.from(checkedIds),
        freeTextValues: freeTextValuesPayload(checkedIds, freeTexts),
        generatedText: generatedText || null,
        notes: notes || null,
    });

    const toggleItem = (itemId: number) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const handleGenerateText = async () => {
        if (!activeTemplate || isReadOnly) return;
        if (!title.trim()) {
            toast.error('Informe o título da sessão.');
            return;
        }
        const checkedItemIds = Array.from(checkedIds);
        if (checkedItemIds.length === 0) {
            toast.info('Marque ao menos um item para gerar o texto.');
            return;
        }
        const freeTextValues = freeTextValuesPayload(checkedIds, freeTexts);

        try {
            let evolutionId: string;
            if (evolutionToEdit) {
                evolutionId = String(evolutionToEdit.id);
                await updateEvolution.mutateAsync({
                    id: evolutionId,
                    dto: buildDto(),
                });
            } else if (draftEvolutionId) {
                evolutionId = draftEvolutionId;
                await updateEvolution.mutateAsync({
                    id: evolutionId,
                    dto: buildDto(),
                });
            } else {
                const created = await createEvolution.mutateAsync(buildDto());
                evolutionId = String(created.id);
                setDraftEvolutionId(evolutionId);
            }

            const result = await generateTextMutation.mutateAsync({
                id: evolutionId,
                checkedItemIds,
                freeTextValues,
            });
            setGeneratedText(result.generatedText);
            toast.success('Texto gerado.');
        } catch {
            // toasts nos hooks / mutation
        }
    };

    const handleSubmit = async (sign: boolean) => {
        if (isReadOnly) return;
        if (!title.trim()) {
            toast.error('Informe o título da sessão.');
            return;
        }
        const dto = buildDto();

        try {
            let evolutionId: string;
            if (isEditing && evolutionToEdit) {
                const updated = await updateEvolution.mutateAsync({
                    id: String(evolutionToEdit.id),
                    dto,
                });
                evolutionId = String(updated.id);
            } else if (draftEvolutionId) {
                const updated = await updateEvolution.mutateAsync({
                    id: draftEvolutionId,
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
            onOpenChange(false);
        } catch {
            // toast já exibido pelos hooks
        }
    };

    const sortedSections = useMemo(
        () =>
            activeTemplate
                ? [...activeTemplate.sections].sort(
                      (a, b) => a.sortOrder - b.sortOrder,
                  )
                : [],
        [activeTemplate],
    );

    const selectTemplateAndGo = (t: EvolutionTemplate) => {
        setPickedTemplate(t);
        setMode('template');
        setStep(2);
    };

    const goFreeText = () => {
        setPickedTemplate(null);
        setMode('free');
        setStep(2);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
            >
                <SheetHeader className="border-b px-6 py-4">
                    <div className="flex items-center gap-2">
                        {step === 2 && !isEditing && !isReadOnly && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 cursor-pointer"
                                onClick={() => setStep(1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <SheetTitle className="text-base">
                            {isReadOnly
                                ? 'Evolução'
                                : isEditing
                                  ? 'Editar evolução'
                                  : step === 1
                                    ? 'Nova evolução'
                                    : mode === 'template'
                                      ? 'Preenchimento da sessão'
                                      : 'Evolução em texto livre'}
                        </SheetTitle>
                    </div>
                    <SheetDescription className="sr-only">
                        Formulário de evolução
                    </SheetDescription>
                </SheetHeader>

                {step === 1 && (
                    <ScrollArea className="flex-1">
                        <div className="space-y-4 px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                Escolha como deseja registrar esta sessão:
                            </p>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <LayoutTemplate className="h-4 w-4 text-primary" />
                                    Usar template
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Selecione um modelo e marque os itens
                                    realizados na sessão.
                                </p>
                                {loadingTemplates && (
                                    <div className="space-y-2 pt-2">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                )}
                                {!loadingTemplates &&
                                    templates &&
                                    templates.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Nenhum template disponível.
                                        </p>
                                    )}
                                {templates && templates.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                        {templates.map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-accent"
                                                onClick={() =>
                                                    selectTemplateAndGo(t)
                                                }
                                            >
                                                <span className="text-sm font-medium">
                                                    {t.name}
                                                </span>
                                                <Badge
                                                    variant={
                                                        t.isSystem
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    className="shrink-0 text-[10px]"
                                                >
                                                    {t.isSystem
                                                        ? 'Sistema'
                                                        : 'Personalizado'}
                                                </Badge>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <button
                                type="button"
                                className="w-full cursor-pointer rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent"
                                onClick={goFreeText}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">
                                            Texto livre
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Escreva a evolução diretamente em
                                            formato livre
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </ScrollArea>
                )}

                {step === 2 && (
                    <ScrollArea className="flex-1">
                        <div className="space-y-5 px-6 py-4">
                            {isReadOnly && (
                                <p className="text-sm text-muted-foreground">
                                    Esta evolução está assinada e não pode ser
                                    alterada.
                                </p>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="ev-title">
                                    Título da sessão{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="ev-title"
                                    placeholder="Ex: Sessão de fisioterapia"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={isReadOnly}
                                />
                            </div>

                            {mode === 'template' && (
                                <>
                                    {!activeTemplate && !isReadOnly && (
                                        <>
                                            {evolutionToEdit?.evolutionTemplateId &&
                                            loadingTemplates ? (
                                                <div className="space-y-2">
                                                    <Skeleton className="h-10 w-full" />
                                                    <Skeleton className="h-10 w-full" />
                                                </div>
                                            ) : templates &&
                                              templates.length > 0 ? (
                                                <div className="space-y-2">
                                                    <Label>
                                                        Selecionar template
                                                    </Label>
                                                    {templates.map((t) => (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-accent"
                                                            onClick={() =>
                                                                setPickedTemplate(
                                                                    t,
                                                                )
                                                            }
                                                        >
                                                            <span className="text-sm">
                                                                {t.name}
                                                            </span>
                                                            <Badge
                                                                variant={
                                                                    t.isSystem
                                                                        ? 'secondary'
                                                                        : 'outline'
                                                                }
                                                                className="text-[10px]"
                                                            >
                                                                {t.isSystem
                                                                    ? 'Sistema'
                                                                    : 'Personalizado'}
                                                            </Badge>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    {evolutionToEdit?.evolutionTemplateId
                                                        ? 'O template desta evolução não está mais disponível.'
                                                        : 'Nenhum template disponível.'}
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {activeTemplate && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium">
                                                    {activeTemplate.name}
                                                </p>
                                                {!isEditing && !isReadOnly && (
                                                    <button
                                                        type="button"
                                                        className="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                                        onClick={() =>
                                                            setPickedTemplate(
                                                                null,
                                                            )
                                                        }
                                                    >
                                                        Trocar template
                                                    </button>
                                                )}
                                            </div>
                                            {sortedSections.map((section) => (
                                                <div
                                                    key={section.id}
                                                    className="space-y-2"
                                                >
                                                    <p className="border-b pb-1 text-sm font-semibold text-foreground">
                                                        {section.title}
                                                    </p>
                                                    {section.items
                                                        .sort(
                                                            (a, b) =>
                                                                a.sortOrder -
                                                                b.sortOrder,
                                                        )
                                                        .map((item) => {
                                                            const checked =
                                                                checkedIds.has(
                                                                    item.id,
                                                                );
                                                            return (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="space-y-1.5"
                                                                >
                                                                    <div className="flex items-start gap-2">
                                                                        <Checkbox
                                                                            id={`item-${item.id}`}
                                                                            checked={
                                                                                checked
                                                                            }
                                                                            onCheckedChange={() =>
                                                                                toggleItem(
                                                                                    item.id,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                isReadOnly
                                                                            }
                                                                            className="mt-0.5 cursor-pointer"
                                                                        />
                                                                        <Label
                                                                            htmlFor={`item-${item.id}`}
                                                                            className="cursor-pointer text-sm leading-snug font-normal"
                                                                        >
                                                                            {
                                                                                item.label
                                                                            }
                                                                        </Label>
                                                                    </div>
                                                                    {item.hasFreeText &&
                                                                        checked &&
                                                                        !isReadOnly && (
                                                                            <Input
                                                                                placeholder={
                                                                                    item.freeTextPlaceholder ??
                                                                                    'Detalhes...'
                                                                                }
                                                                                value={
                                                                                    freeTexts[
                                                                                        item
                                                                                            .id
                                                                                    ] ??
                                                                                    ''
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    setFreeTexts(
                                                                                        (
                                                                                            prev,
                                                                                        ) => ({
                                                                                            ...prev,
                                                                                            [item.id]:
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                        }),
                                                                                    )
                                                                                }
                                                                                className="ml-6 h-8 text-sm"
                                                                            />
                                                                        )}
                                                                    {item.hasFreeText &&
                                                                        checked &&
                                                                        isReadOnly &&
                                                                        freeTexts[
                                                                            item
                                                                                .id
                                                                        ] && (
                                                                            <p className="ml-6 text-xs text-muted-foreground">
                                                                                {
                                                                                    freeTexts[
                                                                                        item
                                                                                            .id
                                                                                    ]
                                                                                }
                                                                            </p>
                                                                        )}
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            ))}

                                            {!isReadOnly && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer gap-2"
                                                    disabled={isPending}
                                                    onClick={() =>
                                                        void handleGenerateText()
                                                    }
                                                >
                                                    <Wand2 className="h-4 w-4" />
                                                    {generateTextMutation.isPending
                                                        ? 'Gerando…'
                                                        : 'Gerar texto'}
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label htmlFor="ev-generated">
                                            Texto gerado{' '}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                (editável)
                                            </span>
                                        </Label>
                                        <Textarea
                                            id="ev-generated"
                                            value={generatedText}
                                            onChange={(e) =>
                                                setGeneratedText(e.target.value)
                                            }
                                            rows={6}
                                            className="resize-none text-sm"
                                            placeholder='Use "Gerar texto" a partir do checklist ou digite aqui.'
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </>
                            )}

                            {mode === 'free' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="ev-free">
                                        Texto da evolução
                                    </Label>
                                    <Textarea
                                        id="ev-free"
                                        placeholder="Descreva a sessão..."
                                        value={generatedText}
                                        onChange={(e) =>
                                            setGeneratedText(e.target.value)
                                        }
                                        rows={10}
                                        className="resize-none text-sm"
                                        disabled={isReadOnly}
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="ev-notes">
                                    Notas adicionais
                                </Label>
                                <Textarea
                                    id="ev-notes"
                                    placeholder="Observações complementares..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="resize-none text-sm"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </ScrollArea>
                )}

                {step === 2 && (
                    <SheetFooter className="border-t px-6 py-4">
                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                            {isReadOnly ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Fechar
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="cursor-pointer"
                                        disabled={isPending}
                                        onClick={() => void handleSubmit(false)}
                                    >
                                        {updateEvolution.isPending ||
                                        createEvolution.isPending
                                            ? 'Salvando…'
                                            : 'Salvar rascunho'}
                                    </Button>
                                    <Button
                                        type="button"
                                        className="cursor-pointer"
                                        disabled={isPending}
                                        onClick={() => void handleSubmit(true)}
                                    >
                                        {signEvolution.isPending
                                            ? 'Assinando…'
                                            : 'Assinar e salvar'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
