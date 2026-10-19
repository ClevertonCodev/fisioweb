/**
 * PROTÓTIPO (descartável): a última etapa (StepProgramDetails da v1 no DS,
 * RHF + Zod) e o diálogo de envio (ProgramShareDialog). Salvar é simulado:
 * nada vai para a API e o link é de exemplo. Sem paciente, o programa
 * vai para "Meus modelos" (é o que a v1 faz: sem paciente = rascunho sem
 * paciente), e o botão diz isso.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CalendarRange,
    CircleCheck,
    Copy,
    Dumbbell,
    Layers,
    Mail,
    MessageCircle,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { usePatients } from '@/application/clinic';
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

import { exerciseCount, type ProgramBuilder } from './builder';

const schema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, 'Dê um nome ao programa')
            .max(120, 'Até 120 caracteres'),
        patientId: z.string(),
        startDate: z.date().nullable(),
        endDate: z.date().nullable(),
        message: z.string().max(600, 'Até 600 caracteres'),
    })
    .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
        path: ['endDate'],
        message: 'O término vem antes do início',
    });

type DetailsForm = z.infer<typeof schema>;

const DAY = 86_400_000;
const today = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};
/** Atalhos de duração: o término a partir do início. */
const DURATIONS = [30, 60, 90];

function accessLabel(start: Date | null, end: Date | null): string {
    if (!end) return 'Sem data de término';
    const from = start ?? today();
    const days = Math.round((end.getTime() - from.getTime()) / DAY);
    return `${days} ${days === 1 ? 'dia' : 'dias'} (até ${end.toLocaleDateString('pt-BR')})`;
}

// ---------------------------------------------------------------- resumo

function Summary({
    builder,
    patientName,
    access,
    onReview,
}: {
    builder: ProgramBuilder;
    patientName: string | null;
    access: string;
    onReview: () => void;
}) {
    const { groups, total, configured } = builder;
    const missing = total - configured;
    const rows = [
        {
            icon: <Dumbbell />,
            label: 'Exercícios',
            value: `${exerciseCount(total)} em ${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}`,
        },
        {
            icon: <Layers />,
            label: 'Com dose',
            value: `${configured} de ${total}`,
        },
        {
            icon: <CalendarRange />,
            label: 'Acesso',
            value: access,
        },
        {
            icon: <UserRound />,
            label: 'Paciente',
            value: patientName ?? 'Nenhum: vai para Meus modelos',
        },
    ];
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
                    O paciente verá só o vídeo, sem séries nem repetições.
                </DsAlert>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- envio

type Phase = 'closed' | 'saving' | 'ready';

function ShareDialog({
    phase,
    title,
    patientName,
    onDone,
}: {
    phase: Phase;
    title: string;
    patientName: string;
    onDone: () => void;
}) {
    const stub = (what: string) => toast.info(`Protótipo: ${what}.`);
    return (
        <DsModal
            open={phase !== 'closed'}
            onOpenChange={(o) => !o && phase === 'ready' && onDone()}
            closeOnBackdrop={phase === 'ready'}
            size="sm"
            title={
                phase === 'saving' ? 'Salvando programa' : 'Programa enviado'
            }
            footer={
                phase === 'ready' && (
                    <div className="flex w-full justify-end">
                        <DsButton label="Concluir" onClick={onDone} />
                    </div>
                )
            }
        >
            {phase === 'saving' ? (
                <div className="flex flex-col items-center gap-3 py-6">
                    <span className="size-8 animate-spin rounded-ds-full border-3 border-ds-primary-20 border-t-ds-primary-80" />
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        Salvando “{title}”…
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <CircleCheck className="size-10 shrink-0 text-ds-status-success-content" />
                        <p className="text-ds-body-sm text-ds-content-secondary">
                            <strong className="text-ds-content-primary">
                                {title}
                            </strong>{' '}
                            está pronto para {patientName}. Mande o link por
                            onde for mais fácil.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-ds-md border border-ds-border-subtle bg-ds-surface-subtle px-3 py-2">
                        <span className="min-w-0 flex-1 truncate font-ds-mono text-ds-caption text-ds-content-secondary">
                            fisioelite.app/p/exemplo-do-prototipo
                        </span>
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            iconPosition="left"
                            icon={<Copy />}
                            label="Copiar"
                            onClick={() =>
                                stub('link de exemplo, nada copiado')
                            }
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <DsButton
                            variant="secondary"
                            size="full"
                            iconPosition="left"
                            icon={<MessageCircle />}
                            label="WhatsApp"
                            onClick={() => stub('o WhatsApp não foi aberto')}
                        />
                        <DsButton
                            variant="secondary"
                            size="full"
                            iconPosition="left"
                            icon={<Mail />}
                            label="E-mail"
                            onClick={() => stub('nenhum e-mail foi enviado')}
                        />
                    </div>
                </div>
            )}
        </DsModal>
    );
}

// ---------------------------------------------------------------- etapa

export function DetailsStep({
    builder,
    initialTitle,
    initialMessage,
    editMode,
    onReview,
}: {
    builder: ProgramBuilder;
    initialTitle: string;
    initialMessage: string;
    editMode: boolean;
    onReview: () => void;
}) {
    const navigate = useNavigate();
    const { data } = usePatients({ perPage: 200 });
    const patients = data?.data ?? [];
    const [phase, setPhase] = useState<Phase>('closed');

    const {
        control,
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<DetailsForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: initialTitle,
            patientId: '',
            startDate: today(),
            endDate: null,
            message: initialMessage,
        },
    });
    const patientId = useWatch({ control, name: 'patientId' });
    const startDate = useWatch({ control, name: 'startDate' }) ?? null;
    const endDate = useWatch({ control, name: 'endDate' }) ?? null;
    const title = useWatch({ control, name: 'title' });
    const patientName = patients.find((p) => p.id === patientId)?.name ?? null;

    const save = handleSubmit(() => {
        if (!patientName) {
            toast.info(
                'Protótipo: nada foi salvo. Sem paciente, o programa iria para Meus modelos.',
            );
            navigate('/clinica/programas/meus-modelos');
            return;
        }
        setPhase('saving');
        setTimeout(() => setPhase('ready'), 1200);
    });

    const saveLabel = patientName
        ? `Salvar e enviar para ${patientName.split(' ')[0]}`
        : editMode
          ? 'Salvar alterações'
          : 'Salvar em Meus modelos';

    return (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
            <DsCard className="sm:p-2">
                <form
                    id="details-form"
                    onSubmit={save}
                    className="flex flex-col gap-5"
                >
                    <DsInput
                        label="Nome do programa"
                        placeholder="Ex.: Reabilitação de joelho — fase 2"
                        state={errors.title ? 'error' : 'default'}
                        helper={errors.title?.message}
                        {...register('title')}
                    />
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
                                options={patients.map((p) => ({
                                    value: p.id,
                                    label: p.name,
                                }))}
                                value={field.value}
                                onValueChange={(v) =>
                                    field.onChange(v as string)
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
                    {/* Início e término separados, um calendário cada (como a v1). */}
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
                                                field.onChange(v as Date | null)
                                            }
                                        />
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
                                            minDate={startDate ?? today()}
                                            value={field.value ?? null}
                                            onValueChange={(v) =>
                                                field.onChange(v as Date | null)
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
                    <DsTextarea
                        label="Mensagem para o paciente"
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
                aria-label="Resumo do programa"
                className="flex flex-col gap-4 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs lg:sticky lg:top-28"
            >
                <Summary
                    builder={builder}
                    patientName={patientName}
                    access={accessLabel(startDate, endDate)}
                    onReview={onReview}
                />
                <DsButton
                    type="submit"
                    form="details-form"
                    size="full"
                    label={saveLabel}
                />
            </aside>

            <ShareDialog
                phase={phase}
                title={title}
                patientName={patientName ?? ''}
                onDone={() => {
                    setPhase('closed');
                    navigate('/clinica/programas/historico');
                }}
            />
        </div>
    );
}
