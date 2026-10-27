/** PROTÓTIPO (descartável): campos do exercício com RHF + componentes Ds*. */
import { Controller } from 'react-hook-form';

import {
    DsInput,
    DsRadio,
    DsRadioGroup,
    DsSelect,
    DsTextarea,
} from '@/components/ds';

import { DIFFICULTIES } from './shared';
import type { SubmitDraft } from './SubmitExercisePrototype';

export function InfoFields({ draft }: { draft: SubmitDraft }) {
    const {
        register,
        control,
        formState: { errors },
    } = draft.form;
    const autoDuration = draft.video !== null && draft.values.duration !== '';

    return (
        <div className="flex flex-col gap-5">
            <DsInput
                label="Nome do exercício"
                placeholder="Ex.: Ponte glútea"
                {...register('name')}
                state={errors.name ? 'error' : 'default'}
                helper={errors.name?.message}
            />
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px]">
                <DsSelect
                    label="Categoria"
                    placeholder="Selecione a categoria"
                    options={draft.areas.map((a) => ({
                        value: String(a.id),
                        label: a.name,
                    }))}
                    {...register('physioAreaId')}
                    state={errors.physioAreaId ? 'error' : 'default'}
                    helper={errors.physioAreaId?.message}
                />
                <DsInput
                    label="Duração (segundos)"
                    type="number"
                    placeholder="Ex.: 45"
                    {...register('duration')}
                    helper={autoDuration ? 'Lida do vídeo' : 'Opcional'}
                />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-ds-body-xs font-medium text-ds-content-primary">
                    Dificuldade
                </span>
                <Controller
                    control={control}
                    name="difficultyLevel"
                    render={({ field }) => (
                        <DsRadioGroup
                            name={field.name}
                            orientation="horizontal"
                            value={field.value}
                            onValueChange={(v) => field.onChange(v)}
                            onBlur={field.onBlur}
                            className="grid gap-3 sm:grid-cols-3"
                        >
                            {DIFFICULTIES.map((d) => (
                                <DsRadio
                                    key={d.value}
                                    value={d.value}
                                    label={d.label}
                                    description={d.description}
                                    className="rounded-ds-lg border border-ds-border-subtle p-3 has-[[data-state=checked]]:border-ds-primary-80 has-[[data-state=checked]]:bg-ds-surface-brand-subtle"
                                />
                            ))}
                        </DsRadioGroup>
                    )}
                />
            </div>
            <DsTextarea
                label="Como fazer"
                placeholder="Descreva a posição inicial, o movimento e o que o paciente deve sentir. Uma frase por passo."
                rows={5}
                maxlength={1000}
                {...register('description')}
            />
        </div>
    );
}
