/**
 * O painel de dose de um exercício (RHF + Zod), com os atalhos "3 × 10" e o
 * "Aplicar ao grupo", que copia a dose para todos os exercícios do grupo.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import type { Dose } from '@/application/clinic/program-builder';
import {
    DsButton,
    DsCheckbox,
    dsCn,
    DsDrawer,
    DsInput,
    DsSelect,
    DsTextarea,
} from '@/components/ds';
import type { ProgramExercise } from '@/domain/clinic';
import { CardVideo } from '@/pages/clinic/program/exercise-library/media';
import { useIsMobile } from '@/pages/clinic/use-media-query';

const DAYS = [
    { value: 1, short: 'S', label: 'Segunda' },
    { value: 2, short: 'T', label: 'Terça' },
    { value: 3, short: 'Q', label: 'Quarta' },
    { value: 4, short: 'Q', label: 'Quinta' },
    { value: 5, short: 'S', label: 'Sexta' },
    { value: 6, short: 'S', label: 'Sábado' },
    { value: 0, short: 'D', label: 'Domingo' },
];

const PERIODS = [
    { value: 'manha', label: 'Manhã' },
    { value: 'tarde', label: 'Tarde' },
    { value: 'noite', label: 'Noite' },
] as const;

const SETS = Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
}));

const REST = [15, 30, 45, 60, 90, 120].map((s) => ({
    value: String(s),
    label: `${s} s`,
}));

/** Atalhos de dose comuns: séries × repetições. */
const PRESETS = [
    [3, 10],
    [3, 12],
    [2, 15],
    [4, 8],
] as const;

const number = z
    .string()
    .refine((v) => v === '' || /^\d+([.,]\d+)?$/.test(v), 'Só números');

const schema = z
    .object({
        days: z.array(z.number()),
        period: z.enum(['manha', 'tarde', 'noite']).nullable(),
        setsMin: z.string(),
        setsMax: z.string(),
        repsMin: number,
        repsMax: number,
        loadMin: number,
        loadMax: number,
        rest: z.string(),
        notes: z.string().max(300, 'Até 300 caracteres'),
    })
    .superRefine((v, ctx) => {
        const pairs = [
            ['setsMin', 'setsMax'],
            ['repsMin', 'repsMax'],
            ['loadMin', 'loadMax'],
        ] as const;
        for (const [min, max] of pairs) {
            const a = parseFloat(v[min].replace(',', '.'));
            const b = parseFloat(v[max].replace(',', '.'));
            if (!Number.isNaN(a) && !Number.isNaN(b) && b < a) {
                ctx.addIssue({
                    code: 'custom',
                    path: [max],
                    message: 'Menor que o mínimo',
                });
            }
        }
    });

type DoseForm = z.infer<typeof schema>;

const text = (n: number | null | undefined) => (n == null ? '' : String(n));
const toNum = (s: string) =>
    s === '' ? null : parseFloat(s.replace(',', '.'));

function toForm(e: ProgramExercise): DoseForm {
    return {
        days: e.days,
        period: e.period,
        setsMin: text(e.seriesMin),
        setsMax: text(e.seriesMax),
        repsMin: text(e.repetitionsMin),
        repsMax: text(e.repetitionsMax),
        loadMin: text(e.loadMin),
        loadMax: text(e.loadMax),
        rest: text(e.restTime),
        notes: e.notes ?? '',
    };
}

function toDose(v: DoseForm): Dose {
    return {
        days: v.days,
        period: v.period,
        seriesMin: toNum(v.setsMin),
        seriesMax: toNum(v.setsMax),
        repetitionsMin: toNum(v.repsMin),
        repetitionsMax: toNum(v.repsMax),
        loadMin: toNum(v.loadMin),
        loadMax: toNum(v.loadMax),
        restTime: toNum(v.rest),
        notes: v.notes.trim() || null,
    };
}

const chip =
    'flex h-10 cursor-pointer items-center justify-center rounded-ds-md border text-ds-body-xs font-medium outline-0 transition-colors focus-visible:shadow-ds-focus';
const chipOn =
    'border-ds-primary-80 bg-ds-primary-80 text-white ds-dark:border-ds-primary-70 ds-dark:bg-ds-primary-70';
const chipOff =
    'border-ds-border-default bg-ds-surface-default text-ds-content-secondary hover:border-ds-primary-40';

function Legend({ children }: { children: string }) {
    return (
        <legend className="mb-2 text-ds-body-xs font-semibold text-ds-content-primary">
            {children}
        </legend>
    );
}

function Form({
    exercise,
    groupName,
    groupSize,
    onApply,
    onApplyToGroup,
}: {
    exercise: ProgramExercise;
    groupName: string;
    groupSize: number;
    onApply: (dose: Dose) => void;
    onApplyToGroup: (dose: Dose) => void;
}) {
    const isMobile = useIsMobile();
    const {
        control,
        register,
        handleSubmit,
        getValues,
        setValue,
        formState: { errors },
    } = useForm<DoseForm>({
        resolver: zodResolver(schema),
        defaultValues: toForm(exercise),
    });
    const days = useWatch({ control, name: 'days' });

    return (
        <form
            id="dose-form"
            onSubmit={handleSubmit((v) => onApply(toDose(v)))}
            className="flex flex-col gap-6"
        >
            <div className="flex items-center gap-4">
                <CardVideo
                    exercise={exercise}
                    className="size-20 shrink-0 rounded-ds-lg"
                />
                <div className="min-w-0">
                    <p className="text-ds-caption text-ds-content-muted">
                        {groupName}
                    </p>
                    <p className="line-clamp-2 text-ds-body-sm font-medium text-ds-content-primary">
                        {exercise.title}
                    </p>
                </div>
            </div>

            <div>
                <p className="mb-2 text-ds-caption text-ds-content-muted">
                    Atalhos
                </p>
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map(([sets, reps]) => (
                        <button
                            key={`${sets}x${reps}`}
                            type="button"
                            onClick={() => {
                                // Máximo igual ao mínimo: vazio, o backend
                                // completaria com o padrão do catálogo.
                                setValue('setsMin', String(sets));
                                setValue('setsMax', String(sets));
                                setValue('repsMin', String(reps));
                                setValue('repsMax', String(reps));
                            }}
                            className="h-8 cursor-pointer rounded-ds-full border border-ds-border-default bg-ds-surface-default px-3 font-ds-mono text-ds-caption text-ds-content-secondary outline-0 hover:border-ds-primary-40 hover:text-ds-content-brand focus-visible:shadow-ds-focus"
                        >
                            {sets} × {reps}
                        </button>
                    ))}
                </div>
            </div>

            <fieldset>
                <Legend>Séries</Legend>
                <div className="grid grid-cols-2 gap-3">
                    <DsSelect
                        aria-label="Séries, mínimo"
                        placeholder="Mínimo"
                        options={SETS}
                        {...register('setsMin')}
                    />
                    <DsSelect
                        aria-label="Séries, máximo"
                        placeholder="Máximo"
                        options={SETS}
                        state={errors.setsMax ? 'error' : 'default'}
                        helper={errors.setsMax?.message}
                        {...register('setsMax')}
                    />
                </div>
            </fieldset>

            <fieldset>
                <Legend>Repetições</Legend>
                <div className="grid grid-cols-2 gap-3">
                    <DsInput
                        aria-label="Repetições, mínimo"
                        placeholder="Mínimo"
                        inputMode="numeric"
                        state={errors.repsMin ? 'error' : 'default'}
                        helper={errors.repsMin?.message}
                        {...register('repsMin')}
                    />
                    <DsInput
                        aria-label="Repetições, máximo"
                        placeholder="Máximo"
                        inputMode="numeric"
                        state={errors.repsMax ? 'error' : 'default'}
                        helper={errors.repsMax?.message}
                        {...register('repsMax')}
                    />
                </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                <fieldset>
                    <Legend>Carga (kg)</Legend>
                    <div className="grid grid-cols-2 gap-2">
                        <DsInput
                            aria-label="Carga, mínimo"
                            placeholder="Mín."
                            inputMode="decimal"
                            state={errors.loadMin ? 'error' : 'default'}
                            {...register('loadMin')}
                        />
                        <DsInput
                            aria-label="Carga, máximo"
                            placeholder="Máx."
                            inputMode="decimal"
                            state={errors.loadMax ? 'error' : 'default'}
                            {...register('loadMax')}
                        />
                    </div>
                    {(errors.loadMin ?? errors.loadMax) && (
                        <p className="mt-1 text-ds-caption text-ds-content-danger">
                            {(errors.loadMin ?? errors.loadMax)?.message}
                        </p>
                    )}
                </fieldset>
                <fieldset>
                    <Legend>Descanso</Legend>
                    <DsSelect
                        aria-label="Descanso entre séries"
                        placeholder="Padrão do exercício"
                        options={REST}
                        {...register('rest')}
                    />
                </fieldset>
            </div>

            <fieldset>
                <Legend>Dias da semana</Legend>
                <Controller
                    control={control}
                    name="days"
                    render={({ field }) => (
                        <div className="grid grid-cols-7 gap-1.5">
                            {DAYS.map((d) => {
                                const on = field.value.includes(d.value);
                                return (
                                    <button
                                        key={d.value}
                                        type="button"
                                        aria-pressed={on}
                                        aria-label={d.label}
                                        title={d.label}
                                        onClick={() => {
                                            // Lê o valor da hora: cliques seguidos não se perdem.
                                            const now = getValues('days');
                                            field.onChange(
                                                now.includes(d.value)
                                                    ? now.filter(
                                                          (x) => x !== d.value,
                                                      )
                                                    : [...now, d.value],
                                            );
                                        }}
                                        className={dsCn(
                                            chip,
                                            on ? chipOn : chipOff,
                                        )}
                                    >
                                        {d.short}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                />
                <div className="mt-3">
                    <DsCheckbox
                        label="Todos os dias"
                        checked={days.length === 7}
                        onCheckedChange={(on) =>
                            setValue(
                                'days',
                                on === true ? DAYS.map((d) => d.value) : [],
                            )
                        }
                    />
                </div>
            </fieldset>

            <fieldset>
                <Legend>Período</Legend>
                <Controller
                    control={control}
                    name="period"
                    render={({ field }) => (
                        <div className="grid grid-cols-3 gap-2">
                            {PERIODS.map((p) => {
                                const on = field.value === p.value;
                                return (
                                    <button
                                        key={p.value}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() =>
                                            field.onChange(on ? null : p.value)
                                        }
                                        className={dsCn(
                                            chip,
                                            on ? chipOn : chipOff,
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                />
            </fieldset>

            <DsTextarea
                label="Observações"
                placeholder="Orientações para este exercício (ex.: sem dor, ritmo lento)"
                rows={3}
                maxlength={300}
                state={errors.notes ? 'error' : 'default'}
                helper={errors.notes?.message}
                {...register('notes')}
            />
            {/* Novo: copiar a dose para o grupo inteiro de uma vez. */}
            {groupSize > 1 && (
                <DsButton
                    type="button"
                    variant="tertiary"
                    size={isMobile ? 'full' : 'md'}
                    label={`Usar esta dose nos ${groupSize} exercícios do grupo`}
                    onClick={handleSubmit((v) => onApplyToGroup(toDose(v)))}
                />
            )}
        </form>
    );
}

export function DoseDrawer({
    exercise,
    groupName,
    groupSize,
    onClose,
    onApply,
    onApplyToGroup,
}: {
    exercise: ProgramExercise | null;
    groupName: string;
    groupSize: number;
    onClose: () => void;
    onApply: (dose: Dose) => void;
    onApplyToGroup: (dose: Dose) => void;
}) {
    const isMobile = useIsMobile();
    return (
        <DsDrawer
            open={exercise !== null}
            onOpenChange={(o) => !o && onClose()}
            placement={isMobile ? 'bottom' : 'right'}
            size="md"
            surfaceClass={isMobile ? 'max-h-[92dvh]' : 'max-w-[480px]'}
            title="Dose do exercício"
            footer={
                <div className="flex w-full justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        onClick={onClose}
                    />
                    <DsButton type="submit" form="dose-form" label="Aplicar" />
                </div>
            }
        >
            {exercise && (
                <Form
                    key={exercise.id}
                    exercise={exercise}
                    groupName={groupName}
                    groupSize={groupSize}
                    onApply={onApply}
                    onApplyToGroup={onApplyToGroup}
                />
            )}
        </DsDrawer>
    );
}
