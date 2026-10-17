import { Building2, House } from 'lucide-react';
import type { ReactNode } from 'react';

import {
    DsDatepicker,
    DsFieldSelect,
    DsInput,
    DsSelect,
    DsTextarea,
    DsTimepicker,
    dsCn,
} from '@/components/ds';

import {
    DURATIONS,
    FieldLabel,
    KIND_SUGGESTIONS,
    LabelText,
    addMinutesToTime,
    minutesBetween,
    parsePlace,
    toLocation,
    type DraftApi,
    type ModalPrototypeProps,
} from './modal-shared';

export type FormSection = 'who' | 'when' | 'what';

export function Chip({
    active,
    children,
    onClick,
}: {
    active: boolean;
    children: ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={dsCn(
                'cursor-pointer rounded-ds-pill border px-3 py-1 text-ds-body-xs transition-colors',
                active
                    ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-semibold text-ds-content-brand'
                    : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-strong',
            )}
        >
            {children}
        </button>
    );
}

function PlaceOption({
    active,
    icon,
    title,
    sub,
    onClick,
}: {
    active: boolean;
    icon: ReactNode;
    title: string;
    sub: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={dsCn(
                'flex flex-1 cursor-pointer items-center gap-3 rounded-ds-lg border px-4 py-3 text-left transition-colors [&_svg]:size-5',
                active
                    ? 'border-ds-primary-80 bg-ds-surface-brand-subtle text-ds-content-brand'
                    : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-strong',
            )}
        >
            {icon}
            <span>
                <span className="block text-ds-body-sm font-semibold">
                    {title}
                </span>
                <span className="block text-ds-caption opacity-80">{sub}</span>
            </span>
        </button>
    );
}

/**
 * PROTOTYPE — campos de criar/editar consulta, em três blocos: quem e onde
 * (paciente + local Clínica/Domiciliar), quando (data, início, duração,
 * fisioterapeuta) e o quê (tipo de serviço + observações).
 */
export function AppointmentFormFields({
    d,
    props,
    sections = ['who', 'when', 'what'],
}: {
    d: DraftApi;
    props: ModalPrototypeProps;
    sections?: FormSection[];
}) {
    const { draft, set, errors } = d;
    const { place, room } = parsePlace(draft.location);
    const duration = minutesBetween(draft.start, draft.end);

    return (
        <div className="space-y-5 font-ds">
            {sections.includes('who') && (
                <>
                    {!d.isFromGoogle && (
                        <DsFieldSelect
                            mode="search"
                            label="Paciente"
                            placeholder="Buscar paciente"
                            options={props.patients.map((p) => ({
                                value: p.id,
                                label: p.name,
                            }))}
                            value={draft.patientId}
                            onValueChange={(v) => set('patientId', String(v))}
                            state={errors.patientId ? 'error' : 'default'}
                            helper={errors.patientId}
                        />
                    )}
                    {!d.isFromGoogle && (
                        <div className="space-y-2">
                            <LabelText>Local de atendimento</LabelText>
                            <div className="flex gap-3">
                                <PlaceOption
                                    active={place === 'clinic'}
                                    icon={<Building2 />}
                                    title="Na clínica"
                                    sub="Paciente vem até a clínica"
                                    onClick={() =>
                                        set(
                                            'location',
                                            toLocation('clinic', room),
                                        )
                                    }
                                />
                                <PlaceOption
                                    active={place === 'home'}
                                    icon={<House />}
                                    title="Domiciliar"
                                    sub="Na casa do paciente"
                                    onClick={() =>
                                        set('location', toLocation('home', ''))
                                    }
                                />
                            </div>
                            {place === 'clinic' && (
                                <DsInput
                                    placeholder="Sala (opcional) — ex.: Sala 3"
                                    value={room}
                                    onValueChange={(v) =>
                                        set('location', toLocation('clinic', v))
                                    }
                                />
                            )}
                        </div>
                    )}
                </>
            )}

            {sections.includes('when') && (
                <>
                    <div className="grid grid-cols-[1fr_168px] items-start gap-3">
                        <FieldLabel error={errors.date}>
                            <LabelText>Data</LabelText>
                            <DsDatepicker
                                mode="single"
                                value={draft.date}
                                onValueChange={(v) =>
                                    set('date', v instanceof Date ? v : null)
                                }
                                className="w-full"
                            />
                        </FieldLabel>
                        <FieldLabel error={errors.start}>
                            <LabelText>Início</LabelText>
                            <DsTimepicker
                                ariaLabel="Início"
                                value={draft.start}
                                onValueChange={(v) => {
                                    set('start', v);
                                    if (duration && duration > 0) {
                                        set(
                                            'end',
                                            addMinutesToTime(v, duration),
                                        );
                                    }
                                }}
                            />
                        </FieldLabel>
                    </div>
                    <FieldLabel error={errors.end}>
                        <LabelText>Duração</LabelText>
                        <div className="flex flex-wrap items-center gap-2">
                            {DURATIONS.map((m) => (
                                <Chip
                                    key={m}
                                    active={duration === m}
                                    onClick={() =>
                                        set(
                                            'end',
                                            addMinutesToTime(draft.start, m),
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
                                    value={draft.end}
                                    onValueChange={(v) => set('end', v)}
                                />
                            </div>
                        </div>
                    </FieldLabel>
                    <DsSelect
                        label="Fisioterapeuta"
                        placeholder="Selecione"
                        options={props.clinicUsers.map((u) => ({
                            value: u.id,
                            label: u.name,
                        }))}
                        value={draft.clinicUserId}
                        onValueChange={(v) => set('clinicUserId', String(v))}
                        disabled={!!props.lockedClinicUserId}
                        state={errors.clinicUserId ? 'error' : 'default'}
                        helper={errors.clinicUserId}
                    />
                </>
            )}

            {sections.includes('what') && (
                <>
                    <div className="space-y-2">
                        <DsInput
                            label="Tipo de serviço"
                            placeholder="Escolha abaixo ou digite"
                            value={draft.title}
                            onValueChange={(v) => set('title', v)}
                        />
                        <div className="flex flex-wrap gap-2">
                            {KIND_SUGGESTIONS.map((k) => (
                                <Chip
                                    key={k}
                                    active={draft.title === k}
                                    onClick={() => set('title', k)}
                                >
                                    {k}
                                </Chip>
                            ))}
                        </div>
                    </div>
                    <DsTextarea
                        label="Observações"
                        rows={3}
                        placeholder="Anotações sobre a consulta…"
                        value={draft.description}
                        onValueChange={(v) => set('description', v)}
                    />
                </>
            )}
        </div>
    );
}
