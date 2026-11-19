/**
 * A última etapa do assistente (RHF + Zod) e o diálogo de envio. Programa:
 * paciente, período de acesso e mensagem; sem paciente, o novo vai para Meus
 * modelos e a edição volta ao painel. Modelo: só nome e mensagem padrão.
 * Salvar cria ou edita de verdade; com paciente, o diálogo de envio sempre
 * abre (e o backend ativa o rascunho, ADR 025).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarRange, Dumbbell, Layers, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { usePatient, usePatients } from '@/application/clinic';
import { toDateOnly } from '@/application/clinic/dates';
import {
    exerciseCount,
    type ProgramBuilder,
} from '@/application/clinic/program-builder';
import {
    programDetailsSchema,
    startOfToday,
    type ProgramDetailsForm,
} from '@/application/clinic/program-details-form';
import { programWhatsAppUrl } from '@/application/clinic/program-share';
import {
    buildProgramWriteDto,
    type SavedIds,
} from '@/application/clinic/program-write';
import {
    useCreateClinicProgram,
    useSendClinicProgramEmail,
    useUpdateClinicProgram,
} from '@/application/clinic/use-programs';
import { getValidationErrors } from '@/application/clinic/validation-errors';
import { SendToPatientModal } from '@/components/clinic/SendToPatientModal';
import {
    DsAlert,
    DsButton,
    DsCard,
    DsDatepicker,
    DsFieldSelect,
    DsInput,
    DsModal,
    DsTextarea,
} from '@/components/ds';
import type { Program } from '@/domain/clinic';

const DAY = 86_400_000;
const today = startOfToday;
/** Atalhos de duração: o término a partir do início. */
const DURATIONS = [30, 60, 90];

export interface DetailsInitial {
    title: string;
    message: string;
    patientId: string;
    /** Nome do paciente que já vem escolhido (edição), para não depender da lista. */
    patientName?: string | null;
    startDate: Date | null;
    endDate: Date | null;
}

/** O que salvar: programa novo, edição de um programa, ou modelo. */
export interface SaveTarget {
    kind: 'program' | 'model';
    /** Com id, edita esse programa; sem, cria um novo. */
    programId?: string;
    /** Na edição, ids de grupos e exercícios que já existem no servidor. */
    saved?: SavedIds;
}

function accessLabel(start: Date | null, end: Date | null): string {
    if (!end) return 'Sem data de término';
    const from = start ?? today();
    const days = Math.round((end.getTime() - from.getTime()) / DAY);
    return `${days} ${days === 1 ? 'dia' : 'dias'} (até ${end.toLocaleDateString('pt-BR')})`;
}

// ---------------------------------------------------------------- resumo

function Summary({
    builder,
    rows,
    onReview,
}: {
    builder: ProgramBuilder;
    rows: { icon: React.ReactNode; label: string; value: string }[];
    onReview: () => void;
}) {
    const missing = builder.total - builder.configured;
    return (
        <div className="flex flex-col gap-4">
            <dl className="flex flex-col gap-3">
                {rows.map((r) => (
                    <div key={r.label} className="flex items-start gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-ds-md bg-ds-surface-subtle text-ds-content-secondary [&_svg]:size-4">
                            {r.icon}
                        </span>
                        <div className="min-w-0">
                            <dt className="text-ds-caption text-ds-content-muted">
                                {r.label}
                            </dt>
                            <dd className="text-ds-body-xs font-medium text-ds-content-primary">
                                {r.value}
                            </dd>
                        </div>
                    </div>
                ))}
            </dl>
            {missing > 0 && (
                <DsAlert
                    variant="warning"
                    mode="rich"
                    title={`${exerciseCount(missing)} sem dose`}
                    actions={
                        <DsButton
                            variant="secondary"
                            size="sm"
                            label="Revisar doses"
                            onClick={onReview}
                        />
                    }
                >
                    Vai com a dose padrão do exercício, quando ele tiver uma.
                </DsAlert>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- envio

type Phase = 'closed' | 'saving' | 'ready' | 'error';

function SaveProgressModal({
    phase,
    title,
    errorMessage,
    onClose,
}: {
    phase: Phase;
    title: string;
    errorMessage: string | null;
    onClose: () => void;
}) {
    const [lastActivePhase, setLastActivePhase] = useState<'saving' | 'error'>(
        'saving',
    );
    if (
        (phase === 'saving' || phase === 'error') &&
        lastActivePhase !== phase
    ) {
        setLastActivePhase(phase);
    }
    const open = phase === 'saving' || phase === 'error';
    const activePhase = open ? phase : lastActivePhase;
    const heading =
        activePhase === 'saving'
            ? 'Salvando programa'
            : 'Não foi possível salvar';

    return (
        <DsModal
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen && phase === 'error') onClose();
            }}
            closeOnBackdrop={phase === 'error'}
            size="sm"
            title={heading}
            footer={
                activePhase === 'error' ? (
                    <div className="flex w-full justify-end">
                        <DsButton
                            variant="secondary"
                            label="Voltar e corrigir"
                            onClick={onClose}
                        />
                    </div>
                ) : null
            }
        >
            {activePhase === 'saving' && (
                <div className="flex flex-col items-center gap-3 py-6">
                    <span className="size-8 animate-spin rounded-ds-full border-3 border-ds-primary-20 border-t-ds-primary-80" />
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        Salvando “{title}”…
                    </p>
                </div>
            )}
            {activePhase === 'error' && (
                <p className="text-ds-body-sm text-ds-content-secondary">
                    {errorMessage ??
                        'Ocorreu um erro ao salvar o programa. Tente novamente.'}{' '}
                    O que você montou continua aqui.
                </p>
            )}
        </DsModal>
    );
}

// ---------------------------------------------------------------- etapa

function firstError(error: unknown): string | null {
    const v = getValidationErrors(error);
    if (!v) return null;
    return Object.values(v.fields)[0]?.[0] ?? v.message ?? null;
}

export function DetailsStep({
    builder,
    initial,
    target,
    onReview,
    onSaved,
    onDirtyChange,
}: {
    builder: ProgramBuilder;
    initial: DetailsInitial;
    target: SaveTarget;
    onReview: () => void;
    /** Salvou: limpa o rascunho e libera a saída da tela. */
    onSaved?: () => void;
    /** Avisa quando nome, paciente, datas ou mensagem mudam. */
    onDirtyChange?: (dirty: boolean) => void;
}) {
    const navigate = useNavigate();
    const isModel = target.kind === 'model';
    const isEdit = Boolean(target.programId);
    const createProgram = useCreateClinicProgram();
    const updateProgram = useUpdateClinicProgram();
    const sendEmail = useSendClinicProgramEmail();
    const { data } = usePatients({ perPage: 200 });
    const listed = data?.data;
    // O paciente que já vem escolhido pode estar fora da lista carregada.
    const preselectedMissing =
        initial.patientId !== '' &&
        listed !== undefined &&
        !listed.some((p) => p.id === initial.patientId);
    const { data: preselected } = usePatient(
        preselectedMissing && !initial.patientName
            ? initial.patientId
            : undefined,
    );
    const patients = useMemo(() => {
        const all = (listed ?? []).map((p) => ({ id: p.id, name: p.name }));
        if (preselectedMissing) {
            const name = initial.patientName ?? preselected?.name;
            if (name) all.unshift({ id: initial.patientId, name });
        }
        return all;
    }, [
        listed,
        preselectedMissing,
        preselected,
        initial.patientId,
        initial.patientName,
    ]);

    const [phase, setPhase] = useState<Phase>('closed');
    const [saved, setSaved] = useState<Program | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const keptStart = isEdit ? initial.startDate : null;
    const schema = useMemo(() => programDetailsSchema(keptStart), [keptStart]);
    const {
        control,
        register,
        handleSubmit,
        setValue,
        formState: { errors, isDirty },
    } = useForm<ProgramDetailsForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: initial.title,
            patientId: initial.patientId,
            startDate: initial.startDate,
            endDate: initial.endDate,
            message: initial.message,
        },
    });
    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);
    const patientId = useWatch({ control, name: 'patientId' });
    const startDate = useWatch({ control, name: 'startDate' }) ?? null;
    const endDate = useWatch({ control, name: 'endDate' }) ?? null;
    const title = useWatch({ control, name: 'title' });
    const patientName = isModel
        ? null
        : (patients.find((p) => p.id === patientId)?.name ?? null);

    const save = handleSubmit(async (values) => {
        const dto = buildProgramWriteDto({
            details: {
                title: values.title,
                patientId: values.patientId,
                message: values.message,
                startDate: toDateOnly(values.startDate),
                endDate: toDateOnly(values.endDate),
            },
            groups: builder.groups,
            saved: target.saved,
            asModel: isModel,
        });
        const withPatient = dto.patientId !== null;
        if (withPatient) {
            setSaved(null);
            setErrorMessage(null);
            setPhase('saving');
        }
        try {
            const program = target.programId
                ? await updateProgram.mutateAsync({
                      id: target.programId,
                      dto,
                  })
                : await createProgram.mutateAsync(dto);
            onSaved?.();
            if (withPatient) {
                setSaved(program);
                setPhase('ready');
                return;
            }
            if (isModel || !isEdit) {
                toast.success(
                    isModel ? 'Modelo salvo.' : 'Salvo em Meus modelos.',
                );
                navigate('/clinica/programas/meus-modelos');
                return;
            }
            toast.success('Programa atualizado.');
            navigate(`/clinica/programas/${program.id}`);
        } catch (error) {
            if (!withPatient) return;
            setErrorMessage(firstError(error));
            setPhase('error');
        }
    });

    const saving = createProgram.isPending || updateProgram.isPending;
    const saveLabel = isModel
        ? 'Salvar modelo'
        : isEdit
          ? 'Salvar alterações'
          : patientName
            ? `Salvar e enviar para ${patientName.split(' ')[0]}`
            : 'Salvar em Meus modelos';

    const rows = [
        {
            icon: <Dumbbell />,
            label: 'Exercícios',
            value: `${exerciseCount(builder.total)} em ${builder.groups.length} ${builder.groups.length === 1 ? 'grupo' : 'grupos'}`,
        },
        {
            icon: <Layers />,
            label: 'Com dose',
            value: `${builder.configured} de ${builder.total}`,
        },
        ...(isModel
            ? []
            : [
                  {
                      icon: <CalendarRange />,
                      label: 'Acesso',
                      value: accessLabel(startDate, endDate),
                  },
                  {
                      icon: <UserRound />,
                      label: 'Paciente',
                      value: patientName ?? 'Nenhum: vai para Meus modelos',
                  },
              ]),
    ];

    return (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
            <DsCard className="sm:p-2">
                <form
                    id="details-form"
                    onSubmit={save}
                    className="flex flex-col gap-5"
                    noValidate
                >
                    <DsInput
                        label={isModel ? 'Nome do modelo' : 'Nome do programa'}
                        placeholder="Ex.: Reabilitação de joelho — fase 2"
                        state={errors.title ? 'error' : 'default'}
                        helper={errors.title?.message}
                        {...register('title')}
                    />
                    {!isModel && (
                        <Controller
                            control={control}
                            name="patientId"
                            render={({ field }) => (
                                <DsFieldSelect
                                    mode="search"
                                    label="Paciente"
                                    placeholder="Escolha o paciente (opcional)"
                                    searchPlaceholder="Pesquisar paciente"
                                    iconLeft={<UserRound />}
                                    options={[
                                        // Sem esta opção, o seletor de escolha
                                        // única não deixa tirar o paciente. Só
                                        // aparece quando já veio um paciente,
                                        // senão toma o lugar do placeholder.
                                        ...(initial.patientId
                                            ? [
                                                  {
                                                      value: '',
                                                      label: 'Nenhum paciente (vai para Meus modelos)',
                                                  },
                                              ]
                                            : []),
                                        ...patients.map((p) => ({
                                            value: p.id,
                                            label: p.name,
                                        })),
                                    ]}
                                    value={field.value}
                                    onValueChange={(v) =>
                                        field.onChange((v as string) ?? '')
                                    }
                                    onBlur={field.onBlur}
                                    helper={
                                        field.value
                                            ? 'Ele recebe o link ao salvar.'
                                            : 'Sem paciente, o programa fica em Meus modelos para usar depois.'
                                    }
                                />
                            )}
                        />
                    )}
                    {!isModel && (
                        <fieldset className="flex flex-col gap-2">
                            <legend className="mb-2 text-ds-body-xs font-medium text-ds-content-primary">
                                Período de acesso
                            </legend>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Controller
                                    control={control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-ds-caption text-ds-content-secondary">
                                                Início
                                            </span>
                                            <DsDatepicker
                                                mode="single"
                                                placeholder="Escolha a data"
                                                minDate={today()}
                                                value={field.value ?? null}
                                                onValueChange={(v) =>
                                                    field.onChange(
                                                        v as Date | null,
                                                    )
                                                }
                                            />
                                            {errors.startDate && (
                                                <span className="text-ds-caption text-ds-content-danger">
                                                    {errors.startDate.message}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                />
                                <Controller
                                    control={control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-ds-caption text-ds-content-secondary">
                                                Término
                                            </span>
                                            <DsDatepicker
                                                mode="single"
                                                placeholder="Sem término"
                                                minDate={
                                                    startDate &&
                                                    startDate > today()
                                                        ? startDate
                                                        : today()
                                                }
                                                value={field.value ?? null}
                                                onValueChange={(v) =>
                                                    field.onChange(
                                                        v as Date | null,
                                                    )
                                                }
                                            />
                                            {errors.endDate && (
                                                <span className="text-ds-caption text-ds-content-danger">
                                                    {errors.endDate.message}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-ds-caption text-ds-content-muted">
                                    {accessLabel(startDate, endDate)}
                                </span>
                                <span className="text-ds-caption text-ds-content-subtle">
                                    ·
                                </span>
                                {DURATIONS.map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() =>
                                            setValue(
                                                'endDate',
                                                new Date(
                                                    (
                                                        startDate ?? today()
                                                    ).getTime() +
                                                        n * DAY,
                                                ),
                                                { shouldValidate: true },
                                            )
                                        }
                                        className="h-7 cursor-pointer rounded-ds-full border border-ds-border-subtle bg-ds-surface-default px-2.5 text-ds-caption text-ds-content-secondary outline-0 hover:border-ds-primary-40 hover:text-ds-content-brand focus-visible:shadow-ds-focus"
                                    >
                                        {n} dias
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    )}
                    <DsTextarea
                        label={
                            isModel
                                ? 'Mensagem padrão'
                                : 'Mensagem para o paciente'
                        }
                        placeholder="Ex.: Faça os exercícios pela manhã. Se doer, pare e me avise."
                        rows={4}
                        maxlength={600}
                        state={errors.message ? 'error' : 'default'}
                        helper={errors.message?.message}
                        {...register('message')}
                    />
                </form>
            </DsCard>

            <aside
                aria-label={isModel ? 'Resumo do modelo' : 'Resumo do programa'}
                className="flex flex-col gap-4 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs lg:sticky lg:top-28"
            >
                <Summary builder={builder} rows={rows} onReview={onReview} />
                <DsButton
                    type="submit"
                    form="details-form"
                    size="full"
                    label={saveLabel}
                    loading={saving}
                    disabled={saving}
                />
            </aside>

            <SaveProgressModal
                phase={phase}
                title={title}
                errorMessage={errorMessage}
                onClose={() => setPhase('closed')}
            />
            <SendToPatientModal
                open={phase === 'ready' && saved !== null}
                onClose={() => {
                    const programId = saved?.id;
                    setPhase('closed');
                    if (programId) navigate(`/clinica/programas/${programId}`);
                }}
                meta={saved?.title}
                description={
                    saved?.patientName
                        ? `O programa está pronto para ${saved.patientName}. Escolha como enviar o link.`
                        : 'Escolha como o paciente vai receber o link do programa.'
                }
                patientEmail={saved?.patientEmail ?? null}
                patientPhone={saved?.patientPhone ?? null}
                whatsappUrl={saved ? programWhatsAppUrl(saved) : null}
                shareUrl={saved?.shareUrl ?? null}
                onSendEmail={() =>
                    saved ? sendEmail.mutateAsync(saved.id) : Promise.resolve()
                }
            />
        </div>
    );
}
