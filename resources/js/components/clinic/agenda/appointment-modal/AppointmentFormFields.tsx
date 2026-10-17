import { Building2, House, Pencil } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import {
    DsButton,
    DsDatepicker,
    DsFieldSelect,
    DsInput,
    DsSelect,
    DsTextarea,
    DsTimepicker,
} from '@/components/ds';
import type { ServiceType } from '@/domain/clinic';

import {
    DURATIONS,
    durationChosen,
    endAt,
    endChanged,
    startChanged,
    type AppointmentFormValues,
    type TimePatch,
} from './appointment-form';
import {
    Chip,
    FieldLabel,
    LabelText,
    PlaceOption,
} from './AppointmentFormParts';

interface AppointmentFormFieldsProps {
    form: UseFormReturn<AppointmentFormValues>;
    patients: { id: string; name: string }[];
    clinicUsers: { id: string; name: string }[];
    lockedClinicUserId?: string;
    isFromGoogle: boolean;
    serviceTypes: ServiceType[];
    /** Presente só para quem edita os tipos (admin e secretária). */
    onEditServiceTypes?: () => void;
}

/**
 * Campos de criar/editar consulta, em três blocos: quem e onde (paciente +
 * local Clínica/Domiciliar), quando (data, início, duração, fisioterapeuta) e
 * o quê (tipo de serviço + observações).
 */
export function AppointmentFormFields({
    form,
    patients,
    clinicUsers,
    lockedClinicUserId,
    isFromGoogle,
    serviceTypes,
    onEditServiceTypes,
}: AppointmentFormFieldsProps) {
    const {
        control,
        register,
        setValue,
        getValues,
        getFieldState,
        trigger,
        watch,
        formState: { errors },
    } = form;
    const [place, start, title, date, duration] = watch([
        'place',
        'start',
        'title',
        'date',
        'durationMinutes',
    ]);
    const setOpts = { shouldDirty: true, shouldValidate: !!errors.end };

    /** Aplica o resultado das regras de horário (`appointment-form.ts`). */
    const applyTime = (patch: TimePatch) => {
        if (patch.end !== undefined) setValue('end', patch.end, setOpts);
        if (patch.referenceMinutes !== undefined) {
            setValue('referenceMinutes', patch.referenceMinutes);
        }
        if (patch.durationMinutes !== undefined) {
            setValue('durationMinutes', patch.durationMinutes, setOpts);
            // O erro de duração aparece no Término: revalida para ele sair
            // quando a correção vem pelo Início.
            if (getFieldState('end').error) void trigger('end');
        }
    };
    const endDayOffset = endAt(start, duration)?.dayOffset ?? 0;
    const endDayLabel =
        endDayOffset > 0 && date instanceof Date
            ? new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate() + endDayOffset,
              ).toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
              })
            : null;

    return (
        <div className="space-y-5 font-ds">
            {!isFromGoogle && (
                <>
                    <Controller
                        control={control}
                        name="patientId"
                        render={({ field, fieldState }) => (
                            <DsFieldSelect
                                mode="search"
                                label="Paciente"
                                placeholder="Buscar paciente"
                                options={patients.map((p) => ({
                                    value: p.id,
                                    label: p.name,
                                }))}
                                value={field.value}
                                onValueChange={(v) => field.onChange(String(v))}
                                onBlur={field.onBlur}
                                state={fieldState.error ? 'error' : 'default'}
                                helper={fieldState.error?.message}
                            />
                        )}
                    />
                    <div className="space-y-2">
                        <LabelText>Local de atendimento</LabelText>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <PlaceOption
                                active={place === 'clinic'}
                                icon={<Building2 />}
                                title="Na clínica"
                                sub="Paciente vem até a clínica"
                                onClick={() =>
                                    setValue('place', 'clinic', setOpts)
                                }
                            />
                            <PlaceOption
                                active={place === 'home'}
                                icon={<House />}
                                title="Domiciliar"
                                sub="Na casa do paciente"
                                onClick={() =>
                                    setValue('place', 'home', setOpts)
                                }
                            />
                        </div>
                        {place === 'clinic' && (
                            <DsInput
                                placeholder="Sala (opcional) — ex.: Sala 3"
                                aria-label="Sala"
                                {...register('room')}
                                state={errors.room ? 'error' : 'default'}
                                helper={errors.room?.message}
                            />
                        )}
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_168px]">
                <Controller
                    control={control}
                    name="date"
                    render={({ field, fieldState }) => (
                        <FieldLabel error={fieldState.error?.message}>
                            <LabelText>Data</LabelText>
                            <DsDatepicker
                                mode="single"
                                value={field.value}
                                onValueChange={(v) =>
                                    field.onChange(v instanceof Date ? v : null)
                                }
                                className="w-full"
                            />
                        </FieldLabel>
                    )}
                />
                <Controller
                    control={control}
                    name="start"
                    render={({ field, fieldState }) => (
                        <FieldLabel error={fieldState.error?.message}>
                            <LabelText>Início</LabelText>
                            <DsTimepicker
                                ariaLabel="Início"
                                value={field.value}
                                onValueChange={(v) => {
                                    field.onChange(v);
                                    applyTime(startChanged(getValues(), v));
                                }}
                            />
                        </FieldLabel>
                    )}
                />
            </div>

            <Controller
                control={control}
                name="end"
                render={({ field, fieldState }) => (
                    <FieldLabel error={fieldState.error?.message}>
                        <LabelText>Duração</LabelText>
                        <div className="flex flex-wrap items-center gap-2">
                            {DURATIONS.map((m) => (
                                <Chip
                                    key={m}
                                    active={duration === m}
                                    onClick={() =>
                                        applyTime(
                                            durationChosen(getValues(), m),
                                        )
                                    }
                                >
                                    {m} min
                                </Chip>
                            ))}
                            <span className="text-ds-body-xs text-ds-content-muted">
                                até
                            </span>
                            <div className="w-[168px]">
                                <DsTimepicker
                                    ariaLabel="Término"
                                    value={field.value}
                                    onValueChange={(v) => {
                                        // Duração antes do término: a revalidação
                                        // do término já lê a duração nova.
                                        applyTime(endChanged(getValues(), v));
                                        field.onChange(v);
                                    }}
                                />
                            </div>
                            {endDayLabel && (
                                <span className="text-ds-body-xs font-medium text-ds-content-secondary">
                                    de {endDayLabel} (outro dia)
                                </span>
                            )}
                        </div>
                    </FieldLabel>
                )}
            />

            <Controller
                control={control}
                name="clinicUserId"
                render={({ field, fieldState }) => (
                    <DsSelect
                        label="Fisioterapeuta"
                        placeholder="Selecione"
                        options={clinicUsers.map((u) => ({
                            value: u.id,
                            label: u.name,
                        }))}
                        value={field.value}
                        onValueChange={(v) => field.onChange(String(v))}
                        onBlur={field.onBlur}
                        disabled={!!lockedClinicUserId}
                        state={fieldState.error ? 'error' : 'default'}
                        helper={fieldState.error?.message}
                    />
                )}
            />

            <div className="space-y-2">
                <DsInput
                    label="Tipo de serviço"
                    placeholder="Escolha abaixo ou digite"
                    {...register('title')}
                    state={errors.title ? 'error' : 'default'}
                    helper={errors.title?.message}
                />
                <div className="flex flex-wrap items-center gap-2">
                    {serviceTypes.map((type) => (
                        <Chip
                            key={type.id}
                            active={title === type.name}
                            onClick={() => {
                                setValue('title', type.name, setOpts);
                                applyTime(
                                    durationChosen(
                                        getValues(),
                                        type.durationMinutes,
                                    ),
                                );
                            }}
                        >
                            {type.name}
                            <span className="ml-1 opacity-70">
                                {type.durationMinutes} min
                            </span>
                        </Chip>
                    ))}
                    {onEditServiceTypes && (
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            iconPosition="left"
                            icon={<Pencil />}
                            label="Editar tipos"
                            onClick={onEditServiceTypes}
                        />
                    )}
                </div>
            </div>

            <DsTextarea
                label="Observações"
                rows={3}
                placeholder="Anotações sobre a consulta…"
                {...register('description')}
            />
        </div>
    );
}
