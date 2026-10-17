import { useState, type ReactNode } from 'react';

import type { AppointmentWriteDto } from '@/application/clinic/ports';
import { dsCn, parseTime } from '@/components/ds';
import type { Appointment, AppointmentStatus } from '@/domain/clinic';
import { selectableAppointmentStatuses } from '@/domain/clinic';
import { htmlToPlainText } from '@/lib/html-to-plain-text';

import { DS_STATUS, formatTime, statusLabel } from '../shared';

/** As mesmas props do AppointmentModal v1 (a AgendaPage passa igual). */
export interface ModalPrototypeProps {
    open: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    initialDate: Date | null;
    initialPatientId?: string;
    patients: { id: string; name: string }[];
    clinicUsers: { id: string; name: string; photoUrl?: string }[];
    onSubmit: (dto: AppointmentWriteDto) => Promise<void> | void;
    isSubmitting?: boolean;
    lockedClinicUserId?: string;
    onStatusChange?: (status: AppointmentStatus) => Promise<void> | void;
    onCancelAppointment?: () => Promise<void> | void;
    isMutatingStatus?: boolean;
    /** PROTOTYPE: todas as consultas carregadas, para "N de M consultas". */
    allAppointments?: Appointment[];
}

export const MODAL_PROTOTYPE_VARIANTS = [
    { key: 'O', name: 'Modal atual (v1)' },
    { key: 'F', name: 'Cabeçalho + abas' },
] as const;

/** Tipos frequentes viram atalhos (o campo "título" continua livre). */
export const KIND_SUGGESTIONS = [
    'Avaliação',
    'Sessão',
    'Retorno',
    'Reavaliação',
    'Sessão de Pilates',
];

export const DURATIONS = [30, 45, 60, 90];

export interface Draft {
    patientId: string;
    clinicUserId: string;
    date: Date | null;
    start: string;
    end: string;
    title: string;
    description: string;
    location: string;
}

export type DraftErrors = Partial<Record<keyof Draft, string>>;

function hhmm(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** "09:30" → 570; null se inválido. */
function toMinutes(time: string): number | null {
    const t = parseTime(time);
    return t ? Number(t.hour) * 60 + Number(t.minute) : null;
}

export function addMinutesToTime(time: string, minutes: number): string {
    const base = toMinutes(time);
    if (base === null) return time;
    const total = (base + minutes + 24 * 60) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function minutesBetween(start: string, end: string): number | null {
    const a = toMinutes(start);
    const b = toMinutes(end);
    return a === null || b === null ? null : b - a;
}

function combine(date: Date, time: string): Date {
    const d = new Date(date);
    const m = toMinutes(time) ?? 0;
    d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    return d;
}

function initialDraft(p: ModalPrototypeProps): Draft {
    const apt = p.appointment;
    if (apt) {
        const start = new Date(apt.startsAt);
        return {
            patientId: apt.patientId,
            clinicUserId: apt.clinicUserId,
            date: start,
            start: hhmm(start),
            end: hhmm(new Date(apt.endsAt)),
            title: apt.title ?? '',
            description: htmlToPlainText(apt.description),
            location: apt.location ?? '',
        };
    }
    const base = p.initialDate ?? new Date();
    return {
        patientId: p.initialPatientId ?? '',
        clinicUserId: p.lockedClinicUserId ?? '',
        date: base,
        start: hhmm(base),
        end: hhmm(new Date(base.getTime() + 60 * 60000)),
        title: '',
        description: '',
        location: 'Clínica',
    };
}

/**
 * PROTOTYPE — rascunho em memória com a mesma validação do v1 (paciente
 * obrigatório fora do Google, fisioterapeuta, início < término). Na versão
 * final vira React Hook Form + Zod.
 */
export function useAppointmentDraft(p: ModalPrototypeProps) {
    const [draft, setDraft] = useState<Draft>(() => initialDraft(p));
    const [errors, setErrors] = useState<DraftErrors>({});
    const isEditing = !!p.appointment;
    const isFromGoogle = p.appointment?.source === 'google';
    const isCancelled = p.appointment?.status === 'cancelled';

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
        setDraft((d) => ({ ...d, [key]: value }));
        setErrors((e) => ({ ...e, [key]: undefined }));
    };

    const validate = (): DraftErrors => {
        const e: DraftErrors = {};
        if (!isFromGoogle && !draft.patientId)
            e.patientId = 'Selecione o paciente';
        if (!draft.clinicUserId) e.clinicUserId = 'Selecione o fisioterapeuta';
        if (!draft.date) e.date = 'Informe a data';
        if (!parseTime(draft.start)) e.start = 'Horário inválido';
        if (!parseTime(draft.end)) e.end = 'Horário inválido';
        const minutes = minutesBetween(draft.start, draft.end);
        if (minutes !== null && minutes <= 0)
            e.end = 'O término deve ser depois do início';
        return e;
    };

    /** `override` entra no envio sem esperar o estado atualizar. */
    const submit = async (override: Partial<Draft> = {}) => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0 || !draft.date) return;
        const location = override.location ?? draft.location;
        await p.onSubmit({
            patientId: isFromGoogle ? null : draft.patientId,
            clinicUserId: draft.clinicUserId,
            title: draft.title || null,
            description: draft.description || null,
            location: location || null,
            startsAt: combine(draft.date, draft.start).toISOString(),
            endsAt: combine(draft.date, draft.end).toISOString(),
        });
    };

    const statusOptions = p.appointment
        ? selectableAppointmentStatuses(
              p.appointment.status,
              p.appointment.startsAt,
          )
        : [];

    const patientName =
        p.patients.find((x) => x.id === draft.patientId)?.name ??
        p.appointment?.patientName ??
        '';
    const professionalName =
        p.clinicUsers.find((x) => x.id === draft.clinicUserId)?.name ??
        p.appointment?.clinicUserName ??
        '';

    return {
        draft,
        set,
        errors,
        submit,
        isEditing,
        isFromGoogle,
        isCancelled,
        statusOptions,
        patientName,
        professionalName,
    };
}

export type DraftApi = ReturnType<typeof useAppointmentDraft>;

export function modalTitle(d: DraftApi): string {
    if (!d.isEditing) return 'Nova consulta';
    return d.isFromGoogle ? 'Evento do Google' : 'Consulta';
}

export function formatLongDate(date: Date | null): string {
    if (!date) return '';
    const raw = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Rótulo de campo no padrão dos campos Ds* (os pickers não têm label). */
export function FieldLabel({
    children,
    error,
    className,
}: {
    children: ReactNode;
    error?: string;
    className?: string;
}) {
    return (
        <div className={dsCn('space-y-1.5', className)}>
            {children}
            {error && (
                <p className="text-ds-caption text-ds-content-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

export function LabelText({ children }: { children: ReactNode }) {
    return (
        <span className="block text-ds-body-xs font-medium text-ds-content-secondary">
            {children}
        </span>
    );
}

/** Status como pílulas nas cores do calendário; só as transições válidas. */
export function StatusPills({
    current,
    options,
    onChange,
    disabled,
    layout = 'row',
}: {
    current: AppointmentStatus;
    options: AppointmentStatus[];
    onChange?: (s: AppointmentStatus) => void;
    disabled?: boolean;
    layout?: 'row' | 'column';
}) {
    // Cancelar tem botão próprio (endpoint próprio, como no v1).
    const shown = options.filter((s) => s !== 'cancelled' || s === current);
    return (
        <div
            className={dsCn(
                'flex gap-2',
                layout === 'row' ? 'flex-wrap' : 'flex-col',
            )}
        >
            {shown.map((s) => {
                const tone = DS_STATUS[s];
                const active = s === current;
                return (
                    <button
                        key={s}
                        type="button"
                        disabled={disabled || active || !onChange}
                        aria-pressed={active}
                        onClick={() => onChange?.(s)}
                        className={dsCn(
                            'flex items-center gap-2 rounded-ds-pill border px-3 py-1.5 text-ds-body-xs font-medium transition-colors',
                            layout === 'column' && 'rounded-ds-md',
                            active
                                ? 'cursor-default'
                                : 'cursor-pointer border-ds-border-default bg-ds-surface-default text-ds-content-secondary hover:border-ds-border-strong disabled:cursor-not-allowed disabled:opacity-50',
                        )}
                        style={
                            active
                                ? {
                                      background: tone.surface,
                                      borderColor: tone.accent,
                                      color: tone.content,
                                  }
                                : undefined
                        }
                    >
                        <span
                            className="size-2.5 shrink-0 rounded-ds-full"
                            style={{ background: tone.accent }}
                        />
                        {statusLabel(s)}
                    </button>
                );
            })}
        </div>
    );
}

export { formatTime };

/** Onde a consulta acontece. Por ora vai no campo `location` (texto). */
export type Place = 'clinic' | 'home';
export const HOME_LABEL = 'Domicílio do paciente';
const CLINIC_PREFIX = 'Clínica';

export function parsePlace(location: string): { place: Place; room: string } {
    if (location.startsWith('Domicílio')) return { place: 'home', room: '' };
    const room = location.startsWith(CLINIC_PREFIX)
        ? location.slice(CLINIC_PREFIX.length).replace(/^\s*·\s*/, '')
        : location;
    return { place: 'clinic', room };
}

export function toLocation(place: Place, room: string): string {
    if (place === 'home') return HOME_LABEL;
    return room.trim() ? `${CLINIC_PREFIX} · ${room.trim()}` : CLINIC_PREFIX;
}

export function placeLabel(location: string): string {
    if (!location) return 'Local não informado';
    const { place, room } = parsePlace(location);
    if (place === 'home') return HOME_LABEL;
    return room ? `Na clínica · ${room}` : 'Na clínica';
}

/** Consultas do mesmo paciente em ordem de data e a posição desta. */
export function patientHistory(
    apt: Appointment | null,
    all: Appointment[] = [],
): { list: Appointment[]; index: number } {
    if (!apt || apt.source === 'google') return { list: [], index: -1 };
    const list = all
        .filter((a) => a.patientId === apt.patientId)
        .sort(
            (a, b) =>
                new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        );
    return { list, index: list.findIndex((a) => a.id === apt.id) };
}
