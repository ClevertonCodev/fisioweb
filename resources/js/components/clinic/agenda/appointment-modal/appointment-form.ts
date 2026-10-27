import { z } from 'zod';

import type { AppointmentWriteDto } from '@/application/clinic/ports';
import { parseTime } from '@/components/ds';
import type { Appointment } from '@/domain/clinic';
import { htmlToPlainText } from '@/lib/html-to-plain-text';

export const DURATIONS = [30, 45, 60, 90];

/** Onde a consulta acontece. Vai como texto no `location` da consulta. */
export type Place = 'clinic' | 'home';
export const HOME_LABEL = 'Domicílio do paciente';
const CLINIC_PREFIX = 'Clínica';
const ROOM_SEPARATOR = ' · ';

/** O `location` segue o formato fixo gravado pela agenda v2? */
export function isStructuredLocation(
    location: string | null | undefined,
): boolean {
    const text = (location ?? '').trim();
    return (
        text === HOME_LABEL ||
        text === CLINIC_PREFIX ||
        text.startsWith(CLINIC_PREFIX + ROOM_SEPARATOR)
    );
}

/**
 * Lê o `location` gravado: "Clínica", "Clínica · Sala 3" ou "Domicílio do
 * paciente". Qualquer outro texto (Google, consultas antigas) é "na clínica"
 * com a sala igual ao texto; ele só é regravado se o usuário mexer no local.
 */
export function parsePlace(location: string | null | undefined): {
    place: Place;
    room: string;
} {
    const text = (location ?? '').trim();
    if (text === HOME_LABEL) return { place: 'home', room: '' };
    if (text === CLINIC_PREFIX) return { place: 'clinic', room: '' };
    if (text.startsWith(CLINIC_PREFIX + ROOM_SEPARATOR)) {
        return {
            place: 'clinic',
            room: text.slice((CLINIC_PREFIX + ROOM_SEPARATOR).length).trim(),
        };
    }
    return { place: 'clinic', room: text };
}

export function toLocation(place: Place, room: string): string {
    if (place === 'home') return HOME_LABEL;
    const trimmed = room.trim();
    return trimmed
        ? `${CLINIC_PREFIX}${ROOM_SEPARATOR}${trimmed}`
        : CLINIC_PREFIX;
}

/** Texto fora do formato fixo aparece como está. */
export function placeLabel(location: string | null | undefined): string {
    if (!location?.trim()) return 'Local não informado';
    if (!isStructuredLocation(location)) return location.trim();
    const { place, room } = parsePlace(location);
    if (place === 'home') return HOME_LABEL;
    return room ? `Na clínica · ${room}` : 'Na clínica';
}

function hhmm(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** "09:30" → 570; null se inválido. */
function toMinutes(time: string): number | null {
    const t = parseTime(time);
    return t ? Number(t.hour) * 60 + Number(t.minute) : null;
}

const MINUTES_PER_DAY = 24 * 60;

function formatHHMM(minutesOfDay: number): string {
    return `${String(Math.floor(minutesOfDay / 60)).padStart(2, '0')}:${String(minutesOfDay % 60).padStart(2, '0')}`;
}

/*
 * Horário do formulário: a duração (`durationMinutes`) é a fonte de verdade.
 * O `end` é só o texto do campo Término; o dia dele sai de início + duração.
 * Os campos de hora emitem a cada tecla, então horário incompleto nunca mexe
 * no outro campo.
 */

/** Campos que uma regra de horário muda (nunca o que está sendo digitado). */
export type TimePatch = Partial<
    Pick<TimeFields, 'end' | 'durationMinutes' | 'referenceMinutes'>
>;

type TimeFields = Pick<
    AppointmentFormValues,
    'start' | 'end' | 'durationMinutes' | 'referenceMinutes'
>;

/** Horário e dia (0 = mesmo dia do início) do término. `null` se não dá para calcular. */
export function endAt(
    start: string,
    durationMinutes: number,
): { end: string; dayOffset: number } | null {
    const base = toMinutes(start);
    if (base === null || !(durationMinutes > 0)) return null;
    const total = base + durationMinutes;
    return {
        end: formatHHMM(total % MINUTES_PER_DAY),
        dayOffset: Math.floor(total / MINUTES_PER_DAY),
    };
}

/*
 * As regras abaixo devolvem só os OUTROS campos: o campo que o usuário está
 * digitando é gravado pelo próprio `onChange` dele (regravá-lo move o cursor).
 */

/**
 * Mudou o início: o término acompanha mantendo a duração. Com a duração
 * inválida (término igual ou antes do início), recalcula a partir do término
 * que está na tela.
 */
export function startChanged(v: TimeFields, start: string): TimePatch {
    if (toMinutes(start) === null) return {};
    if (!(v.durationMinutes > 0)) return endChanged({ ...v, start }, v.end);
    const next = endAt(start, v.durationMinutes);
    return next ? { end: next.end } : {};
}

/**
 * Digitou o término: a duração vem do horário digitado. O dia do término é
 * decidido pela referência (duração ao abrir ou do último atalho), que a
 * digitação não muda; assim corrigir o término várias vezes dá o mesmo que
 * digitar o valor final (decisão do usuário, rodada 6).
 * - Referência de 24 h ou mais (vários dias): o término fica no dia em que a
 *   referência o põe.
 * - Referência curta: término depois do início fica no mesmo dia; antes do
 *   início vai para o dia seguinte só se a referência já terminava nele.
 *   Término igual ao início (ou antes, no mesmo dia) é erro de digitação.
 * Com o início incompleto, a duração fica indefinida (0) e o término digitado
 * manda quando o início for completado.
 */
export function endChanged(v: TimeFields, end: string): TimePatch {
    const endMin = toMinutes(end);
    if (endMin === null) return {};
    const startMin = toMinutes(v.start);
    if (startMin === null) return { durationMinutes: 0 };
    const diff = endMin - startMin;
    const reference = v.referenceMinutes;
    const endDay = endAt(v.start, reference)?.dayOffset ?? 0;
    if (reference >= MINUTES_PER_DAY) {
        return { durationMinutes: endDay * MINUTES_PER_DAY + diff };
    }
    if (diff < 0 && endDay >= 1) {
        return { durationMinutes: diff + MINUTES_PER_DAY };
    }
    return { durationMinutes: diff };
}

/** Atalho de duração (ou de tipo de serviço). */
export function durationChosen(v: TimeFields, minutes: number): TimePatch {
    const next = endAt(v.start, minutes);
    const patch = { durationMinutes: minutes, referenceMinutes: minutes };
    return next ? { ...patch, end: next.end } : patch;
}

function combine(date: Date, time: string): Date {
    const d = new Date(date);
    const m = toMinutes(time) ?? 0;
    d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    return d;
}

/** `Clínica · ` + sala cabe nos 255 caracteres do `location` no backend. */
export const MAX_ROOM_LENGTH = 255 - (CLINIC_PREFIX + ROOM_SEPARATOR).length;

/**
 * Campos do formulário de consulta. `requirePatient` é falso para evento do
 * Google, que não tem paciente.
 */
export function appointmentFormSchema(
    requirePatient: boolean,
    /** Sala lida do `location` gravado: se não mudou, não é validada. */
    originalRoom?: string,
) {
    return z
        .object({
            patientId: z.string(),
            clinicUserId: z.string().min(1, 'Selecione o fisioterapeuta'),
            date: z
                .date()
                .nullable()
                .refine((d) => d !== null && !Number.isNaN(d.getTime()), {
                    message: 'Informe a data',
                }),
            start: z
                .string()
                .refine((v) => parseTime(v) !== null, 'Horário inválido'),
            end: z
                .string()
                .refine((v) => parseTime(v) !== null, 'Horário inválido'),
            place: z.enum(['clinic', 'home']),
            room: z.string(),
            title: z.string().max(255, 'Use até 255 caracteres'),
            description: z.string(),
            /** Fonte de verdade do término (pode passar de um dia). */
            durationMinutes: z.number().int(),
            /**
             * Duração de referência para decidir o dia do término digitado:
             * a do evento ao abrir, ou a do último atalho de duração/tipo.
             */
            referenceMinutes: z.number().int(),
        })
        .superRefine((v, ctx) => {
            if (requirePatient && !v.patientId) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['patientId'],
                    message: 'Selecione o paciente',
                });
            }
            // Só a sala que aparece (clínica, fora do Google) e que o usuário
            // mexeu: texto antigo ou campo escondido não pode barrar o salvar.
            if (
                requirePatient &&
                v.place === 'clinic' &&
                v.room !== originalRoom &&
                v.room.trim().length > MAX_ROOM_LENGTH
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['room'],
                    message: `Use até ${MAX_ROOM_LENGTH} caracteres`,
                });
            }
            if (v.durationMinutes <= 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['end'],
                    message: 'O término deve ser depois do início',
                });
            }
        });
}

export type AppointmentFormValues = z.input<
    ReturnType<typeof appointmentFormSchema>
>;

export function initialFormValues(input: {
    appointment: Appointment | null;
    initialDate: Date | null;
    initialPatientId?: string;
    lockedClinicUserId?: string;
}): AppointmentFormValues {
    const apt = input.appointment;
    if (apt) {
        const start = new Date(apt.startsAt);
        const end = new Date(apt.endsAt);
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);
        const { place, room } = parsePlace(apt.location);
        return {
            patientId: apt.patientId ?? '',
            clinicUserId: apt.clinicUserId,
            date: start,
            start: hhmm(start),
            end: hhmm(end),
            durationMinutes: duration,
            referenceMinutes: duration,
            place,
            room,
            title: apt.title ?? '',
            description: htmlToPlainText(apt.description),
        };
    }
    const base = input.initialDate ?? new Date();
    const start = hhmm(base);
    return {
        patientId: input.initialPatientId ?? '',
        clinicUserId: input.lockedClinicUserId ?? '',
        date: base,
        start,
        // Uma hora; perto da meia-noite, o término cai no dia seguinte.
        end: endAt(start, 60)?.end ?? start,
        durationMinutes: 60,
        referenceMinutes: 60,
        place: 'clinic',
        room: '',
        title: '',
        description: '',
    };
}

/**
 * O `location` só é remontado quando o usuário mexeu no local ou na sala. Na
 * edição sem mexer (e sempre em evento do Google, que não tem o campo), ele
 * volta como estava: texto antigo fora do formato não vira "Clínica · …".
 */
export function toWriteDto(
    values: AppointmentFormValues,
    location: {
        isFromGoogle: boolean;
        /** `location` gravado; `undefined` em consulta nova. */
        original: string | null | undefined;
        placeTouched: boolean;
    },
    /**
     * Horário gravado da consulta em edição. Sem mexer em data e horários,
     * início e término voltam exatamente como estavam.
     */
    timing?: { startsAt: string; endsAt: string; touched: boolean },
): AppointmentWriteDto {
    const startsAt = combine(values.date as Date, values.start);
    const keepOriginal =
        location.original !== undefined &&
        (location.isFromGoogle || !location.placeTouched);
    return {
        patientId: location.isFromGoogle ? null : values.patientId,
        clinicUserId: values.clinicUserId,
        title: values.title.trim() || null,
        description: values.description.trim() || null,
        location: keepOriginal
            ? (location.original ?? null)
            : toLocation(values.place, values.room),
        startsAt:
            timing && !timing.touched
                ? timing.startsAt
                : startsAt.toISOString(),
        endsAt:
            timing && !timing.touched
                ? timing.endsAt
                : new Date(
                      startsAt.getTime() + values.durationMinutes * 60000,
                  ).toISOString(),
    };
}
