import { parseDate } from '@/application/clinic/dates';
import type { Appointment, Program } from '@/domain/clinic';

const DAY = 24 * 60 * 60 * 1000;

export const PATIENT_APPOINTMENTS_MONTHS_BACK = 12;
export const PATIENT_APPOINTMENTS_MONTHS_AHEAD = 6;

export interface PatientAppointmentsWindow {
    from: string;
    to: string;
}

function isoDay(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

/**
 * Janela do prontuário: 12 meses para trás e 6 para frente, por dia (a chave
 * da query não muda a cada render). O `to` é o dia seguinte ao último dia
 * porque a API compara `starts_at <= to` e uma data pura cortaria o próprio
 * dia (ADR 018).
 */
export function patientAppointmentsWindow(
    now: Date = new Date(),
): PatientAppointmentsWindow {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const lastDay = addMonths(today, PATIENT_APPOINTMENTS_MONTHS_AHEAD);
    return {
        from: isoDay(addMonths(today, -PATIENT_APPOINTMENTS_MONTHS_BACK)),
        to: isoDay(new Date(lastDay.getTime() + DAY)),
    };
}

export interface PatientCareStats {
    /** Consultas encerradas com comparecimento. */
    completed: number;
    noShow: number;
    /** Comparecimento das consultas já encerradas (0–100), ou null. */
    attendance: number | null;
    /** Faltas seguidas mais recentes (alerta de abandono). */
    noShowStreak: number;
    next: Appointment | null;
    last: Appointment | null;
    /** Início do acompanhamento: primeira consulta ou programa já começado. */
    since: Date | null;
    /** Meses desde `since`, no mínimo 1; null sem acompanhamento. */
    monthsInCare: number | null;
    activeProgram: Program | null;
}

function time(value: string): number {
    return new Date(value).getTime();
}

function dayTime(value: string): number {
    return parseDate(value)?.getTime() ?? Number.NaN;
}

/**
 * Números do painel do prontuário a partir das consultas e programas que a
 * API já devolveu filtrados pelo paciente. Para o fisioterapeuta, a lista
 * só tem as consultas dele, então os números são "suas consultas".
 */
export function patientCareStats(
    appointments: Appointment[],
    programs: Program[],
    now: Date = new Date(),
): PatientCareStats {
    const nowTime = now.getTime();

    const closed = appointments
        .filter((a) => a.status === 'completed' || a.status === 'no_show')
        .sort((a, b) => time(b.startsAt) - time(a.startsAt));
    const completed = closed.filter((a) => a.status === 'completed').length;
    const noShow = closed.length - completed;

    let noShowStreak = 0;
    for (const a of closed) {
        if (a.status !== 'no_show') break;
        noShowStreak += 1;
    }

    const next =
        appointments
            .filter(
                (a) => a.status !== 'cancelled' && time(a.startsAt) > nowTime,
            )
            .sort((a, b) => time(a.startsAt) - time(b.startsAt))[0] ?? null;

    const last =
        closed.find(
            (a) => a.status === 'completed' && time(a.startsAt) <= nowTime,
        ) ?? null;

    // Consulta cancelada não conta como início do acompanhamento.
    const startTimes = [
        ...appointments
            .filter((a) => a.status !== 'cancelled')
            .map((a) => time(a.startsAt)),
        ...programs.map((p) => dayTime(p.startDate)),
    ].filter((t) => !Number.isNaN(t) && t <= nowTime);
    const since = startTimes.length ? new Date(Math.min(...startTimes)) : null;

    const activeProgram =
        [...programs]
            .filter((p) => p.status === 'active' || p.status === 'sent')
            .sort((a, b) => dayTime(b.startDate) - dayTime(a.startDate))[0] ??
        null;

    return {
        completed,
        noShow,
        attendance: closed.length
            ? Math.round((completed / closed.length) * 100)
            : null,
        noShowStreak,
        next,
        last,
        since,
        monthsInCare: since
            ? Math.max(1, Math.round((nowTime - since.getTime()) / (30 * DAY)))
            : null,
        activeProgram,
    };
}
