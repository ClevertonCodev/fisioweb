import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    CircleAlert,
    Copy,
    Plus,
    Save,
    Trash2,
} from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { can } from '@/application/clinic/permissions';
import {
    useCreateEvolutionTemplate,
    useUpdateEvolutionTemplate,
} from '@/application/clinic/use-evolutions';
import {
    DsAlert,
    DsButton,
    DsInput,
    DsSwitch,
    DsTextarea,
    DsTooltip,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type { EvolutionTemplate } from '@/domain/clinic';

import { TryTemplate } from '../TryTemplate';

import {
    emptyItem,
    emptySection,
    evolutionTemplateFormSchema,
    problemsOf,
    toFormValues,
    toWriteDto,
    type EvolutionTemplateFormValues,
    type EvolutionTemplateItemFormValue,
    type EvolutionTemplateSectionFormValue,
} from './schema';

const WRITE_DENIED_REASON =
    'Apenas administradores ou fisioterapeutas podem gerenciar modelos';

function move<T>(list: T[], from: number, to: number): T[] {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [picked] = next.splice(from, 1);
    if (picked !== undefined) {
        next.splice(to, 0, picked);
    }
    return next;
}

export function EvolutionTemplateEditorScreen({
    template,
}: {
    template: EvolutionTemplate | null;
}) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo');
    const destination = returnTo || '/clinica/templates/evolucoes';

    const { user } = useAuth();
    const role = user?.role as ClinicRole | undefined;
    const canWrite = can.manageEvolutionTemplates(role);

    const createTemplate = useCreateEvolutionTemplate();
    const updateTemplate = useUpdateEvolutionTemplate();

    const isSystem = template?.isSystem ?? false;
    const saving = createTemplate.isPending || updateTemplate.isPending;

    const form = useForm<EvolutionTemplateFormValues>({
        resolver: zodResolver(evolutionTemplateFormSchema),
        defaultValues: toFormValues(template),
        mode: 'onSubmit',
    });

    const watchedName = useWatch({ control: form.control, name: 'name' }) ?? '';
    const watchedDescription =
        useWatch({ control: form.control, name: 'description' }) ?? '';
    const watchedSections = (useWatch({
        control: form.control,
        name: 'sections',
    }) ?? []) as EvolutionTemplateSectionFormValue[];

    const problems = problemsOf(
        watchedName,
        watchedSections,
        watchedDescription,
    );
    const itemTotal = watchedSections.reduce(
        (sum, s) => sum + s.items.length,
        0,
    );

    const updateSections = (
        updater: (
            prev: EvolutionTemplateSectionFormValue[],
        ) => EvolutionTemplateSectionFormValue[],
    ) => {
        const current = form.getValues('sections');
        form.setValue('sections', updater(current), {
            shouldDirty: true,
        });
    };

    const patchSection = (
        key: string,
        patch: Partial<EvolutionTemplateSectionFormValue>,
    ) => {
        updateSections((all) =>
            all.map((s) => (s.key === key ? { ...s, ...patch } : s)),
        );
    };

    const patchItem = (
        sectionKey: string,
        itemKey: string,
        patch: Partial<EvolutionTemplateItemFormValue>,
    ) => {
        updateSections((all) =>
            all.map((s) =>
                s.key === sectionKey
                    ? {
                          ...s,
                          items: s.items.map((i) =>
                              i.key === itemKey ? { ...i, ...patch } : i,
                          ),
                      }
                    : s,
            ),
        );
    };

    const handleSave = form.handleSubmit(
        async (values) => {
            if (!canWrite) return;
            try {
                if (!template || isSystem) {
                    await createTemplate.mutateAsync(
                        toWriteDto(values, { includeIds: false }),
                    );
                } else {
                    await updateTemplate.mutateAsync({
                        id: String(template.id),
                        dto: toWriteDto(values, {
                            includeIds: true,
                            isActive: template.isActive,
                        }),
                    });
                }
                navigate(destination);
            } catch {
                // toast exibido pelo hook
            }
        },
        () => {
            const currentProblems = problemsOf(
                form.getValues('name'),
                form.getValues('sections'),
                form.getValues('description'),
            );
            if (currentProblems[0]) {
                toast.error(currentProblems[0]);
            }
        },
    );

    const saveButton = (
        <DsButton
            iconPosition="left"
            icon={isSystem ? <Copy /> : <Save />}
            label={isSystem ? 'Salvar como cópia' : 'Salvar'}
            loading={saving}
            disabled={saving}
            aria-disabled={canWrite ? undefined : 'true'}
            onClick={canWrite ? () => void handleSave() : undefined}
            className={canWrite ? undefined : 'cursor-not-allowed opacity-50'}
        />
    );

    return (
        <div className="flex h-full flex-col bg-ds-surface-body font-ds text-ds-content-primary">
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-(--breakpoint-ds-xl) flex-col gap-5 px-4 py-6 lg:px-8">
                    <header className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => navigate(destination)}
                            className="flex w-fit cursor-pointer items-center gap-1.5 text-ds-body-xs text-ds-content-secondary hover:text-ds-content-brand ds-dark:hover:text-ds-primary-60"
                        >
                            <ArrowLeft className="size-4" />
                            Modelos de evolução
                        </button>
                        <h1 className="text-ds-h4 font-semibold">
                            {template
                                ? watchedName || template.name
                                : 'Novo modelo'}
                        </h1>
                    </header>

                    {isSystem && (
                        <DsAlert
                            variant="info"
                            mode="rich"
                            title="Modelo do sistema"
                        >
                            Ele é igual para todas as clínicas e não muda. Ao
                            salvar, vira uma cópia da sua clínica, e o original
                            continua aqui.
                        </DsAlert>
                    )}

                    {!canWrite && (
                        <DsAlert
                            variant="info"
                            mode="rich"
                            title="Somente leitura"
                        >
                            {WRITE_DENIED_REASON}.
                        </DsAlert>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <div className="flex min-w-0 flex-col gap-4">
                            <section className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs">
                                <Controller
                                    control={form.control}
                                    name="name"
                                    render={({ field, fieldState }) => (
                                        <DsInput
                                            label="Nome do modelo"
                                            placeholder="Ex.: Pós-operatório de joelho"
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            onBlur={field.onBlur}
                                            state={
                                                fieldState.error
                                                    ? 'error'
                                                    : 'default'
                                            }
                                            helper={fieldState.error?.message}
                                        />
                                    )}
                                />
                                <Controller
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <DsTextarea
                                            label="Para que serve (opcional)"
                                            rows={2}
                                            placeholder="Aparece para quem escolhe o modelo na evolução"
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
                            </section>

                            {watchedSections.map((s, si) => (
                                <section
                                    key={s.key}
                                    className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs"
                                >
                                    <header className="flex items-center gap-2 border-b border-ds-border-subtle px-4 py-3">
                                        <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                                            {si + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <DsInput
                                                size="sm"
                                                aria-label={`Título da seção ${si + 1}`}
                                                placeholder="Título da seção (ex.: Condutas)"
                                                value={s.title}
                                                onValueChange={(v) =>
                                                    patchSection(s.key, {
                                                        title: v,
                                                    })
                                                }
                                            />
                                        </div>
                                        <DsButton
                                            iconPosition="only"
                                            size="sm"
                                            variant="tertiary"
                                            icon={<ArrowUp />}
                                            label="Subir seção"
                                            tooltip="Subir seção"
                                            disabled={si === 0}
                                            onClick={() =>
                                                updateSections((all) =>
                                                    move(all, si, si - 1),
                                                )
                                            }
                                        />
                                        <DsButton
                                            iconPosition="only"
                                            size="sm"
                                            variant="tertiary"
                                            icon={<ArrowDown />}
                                            label="Descer seção"
                                            tooltip="Descer seção"
                                            disabled={
                                                si ===
                                                watchedSections.length - 1
                                            }
                                            onClick={() =>
                                                updateSections((all) =>
                                                    move(all, si, si + 1),
                                                )
                                            }
                                        />
                                        <DsButton
                                            iconPosition="only"
                                            size="sm"
                                            variant="destructive-tertiary"
                                            icon={<Trash2 />}
                                            label="Remover seção"
                                            tooltip="Remover seção"
                                            onClick={() =>
                                                updateSections((all) =>
                                                    all.filter(
                                                        (sec) =>
                                                            sec.key !== s.key,
                                                    ),
                                                )
                                            }
                                        />
                                    </header>
                                    <ol className="flex flex-col divide-y divide-ds-border-subtle">
                                        {s.items.map((it, ii) => (
                                            <li
                                                key={it.key}
                                                className="flex flex-col gap-2 px-4 py-3"
                                            >
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]">
                                                    <DsInput
                                                        size="sm"
                                                        aria-label="Nome do item"
                                                        placeholder="Nome no botão (ex.: Crioterapia)"
                                                        value={it.label}
                                                        onValueChange={(v) =>
                                                            patchItem(
                                                                s.key,
                                                                it.key,
                                                                { label: v },
                                                            )
                                                        }
                                                    />
                                                    <DsInput
                                                        size="sm"
                                                        aria-label="Texto no prontuário"
                                                        placeholder="Texto no prontuário (ex.: Realizada crioterapia.)"
                                                        value={it.printText}
                                                        onValueChange={(v) =>
                                                            patchItem(
                                                                s.key,
                                                                it.key,
                                                                {
                                                                    printText:
                                                                        v,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    <div className="flex items-center gap-0.5">
                                                        <DsButton
                                                            iconPosition="only"
                                                            size="sm"
                                                            variant="tertiary"
                                                            icon={<ArrowUp />}
                                                            label="Subir"
                                                            tooltip="Subir"
                                                            disabled={ii === 0}
                                                            onClick={() =>
                                                                updateSections(
                                                                    (all) =>
                                                                        all.map(
                                                                            (
                                                                                sec,
                                                                            ) =>
                                                                                sec.key ===
                                                                                s.key
                                                                                    ? {
                                                                                          ...sec,
                                                                                          items: move(
                                                                                              sec.items,
                                                                                              ii,
                                                                                              ii -
                                                                                                  1,
                                                                                          ),
                                                                                      }
                                                                                    : sec,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <DsButton
                                                            iconPosition="only"
                                                            size="sm"
                                                            variant="tertiary"
                                                            icon={<ArrowDown />}
                                                            label="Descer"
                                                            tooltip="Descer"
                                                            disabled={
                                                                ii ===
                                                                s.items.length -
                                                                    1
                                                            }
                                                            onClick={() =>
                                                                updateSections(
                                                                    (all) =>
                                                                        all.map(
                                                                            (
                                                                                sec,
                                                                            ) =>
                                                                                sec.key ===
                                                                                s.key
                                                                                    ? {
                                                                                          ...sec,
                                                                                          items: move(
                                                                                              sec.items,
                                                                                              ii,
                                                                                              ii +
                                                                                                  1,
                                                                                          ),
                                                                                      }
                                                                                    : sec,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <DsButton
                                                            iconPosition="only"
                                                            size="sm"
                                                            variant="destructive-tertiary"
                                                            icon={<Trash2 />}
                                                            label="Remover item"
                                                            tooltip="Remover item"
                                                            onClick={() =>
                                                                updateSections(
                                                                    (all) =>
                                                                        all.map(
                                                                            (
                                                                                sec,
                                                                            ) =>
                                                                                sec.key ===
                                                                                s.key
                                                                                    ? {
                                                                                          ...sec,
                                                                                          items: sec.items.filter(
                                                                                              (
                                                                                                  item,
                                                                                              ) =>
                                                                                                  item.key !==
                                                                                                  it.key,
                                                                                          ),
                                                                                      }
                                                                                    : sec,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <DsSwitch
                                                        label="Pede complemento"
                                                        checked={it.hasFreeText}
                                                        onCheckedChange={(v) =>
                                                            patchItem(
                                                                s.key,
                                                                it.key,
                                                                {
                                                                    hasFreeText:
                                                                        v,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    {it.hasFreeText && (
                                                        <div className="min-w-0 flex-1">
                                                            <DsInput
                                                                size="sm"
                                                                aria-label="Dica do complemento"
                                                                placeholder="Dica (ex.: minutos, nota de 0 a 10)"
                                                                value={
                                                                    it.placeholder
                                                                }
                                                                onValueChange={(
                                                                    v,
                                                                ) =>
                                                                    patchItem(
                                                                        s.key,
                                                                        it.key,
                                                                        {
                                                                            placeholder:
                                                                                v,
                                                                        },
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                    <div className="px-4 pb-3">
                                        <DsButton
                                            size="sm"
                                            variant="tertiary"
                                            iconPosition="left"
                                            icon={<Plus />}
                                            label="Item"
                                            onClick={() =>
                                                updateSections((all) =>
                                                    all.map((sec) =>
                                                        sec.key === s.key
                                                            ? {
                                                                  ...sec,
                                                                  items: [
                                                                      ...sec.items,
                                                                      emptyItem(),
                                                                  ],
                                                              }
                                                            : sec,
                                                    ),
                                                )
                                            }
                                        />
                                    </div>
                                </section>
                            ))}
                            <DsButton
                                variant="secondary"
                                iconPosition="left"
                                icon={<Plus />}
                                label="Nova seção"
                                onClick={() =>
                                    updateSections((all) => [
                                        ...all,
                                        emptySection(),
                                    ])
                                }
                            />
                        </div>

                        <aside className="min-w-0 lg:sticky lg:top-0 lg:self-start">
                            <section className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
                                <h2 className="text-ds-body-sm font-semibold">
                                    Experimente
                                </h2>
                                <p className="mb-3 text-ds-caption text-ds-content-muted">
                                    Como fica na hora de escrever a evolução.
                                </p>
                                <TryTemplate
                                    sections={watchedSections.map((s) => ({
                                        key: s.key,
                                        title: s.title,
                                        items: s.items,
                                    }))}
                                />
                            </section>
                        </aside>
                    </div>
                </div>
            </div>

            <footer className="flex flex-wrap items-center gap-3 border-t border-ds-border-subtle bg-ds-surface-default px-4 py-3 lg:px-8">
                <p className="flex min-w-0 flex-1 items-center gap-1.5 text-ds-caption text-ds-content-secondary">
                    {problems.length > 0 ? (
                        <>
                            <CircleAlert className="size-4 shrink-0 text-ds-status-danger-content" />
                            <span className="truncate">
                                {problems[0]}
                                {problems.length > 1 &&
                                    ` (+${problems.length - 1})`}
                            </span>
                        </>
                    ) : (
                        <span className="font-ds-mono">
                            {watchedSections.length} seções · {itemTotal} itens
                        </span>
                    )}
                </p>
                <DsButton
                    variant="secondary"
                    label="Cancelar"
                    onClick={() => navigate(destination)}
                />
                {canWrite ? (
                    saveButton
                ) : (
                    <DsTooltip content={WRITE_DENIED_REASON} asChild>
                        {saveButton}
                    </DsTooltip>
                )}
            </footer>
        </div>
    );
}
