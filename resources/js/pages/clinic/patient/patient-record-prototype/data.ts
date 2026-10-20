/**
 * PROTÓTIPO (descartável): junta tudo o que o prontuário tem do paciente
 * (consultas, evoluções, avaliações, questionários, arquivos e programas)
 * numa lista só, e tira dela os números do acompanhamento.
 *
 * Consultas e programas não têm filtro por paciente na API: o protótipo
 * busca a janela de 12 meses para trás e 6 para frente (e até 200
 * programas) e filtra aqui. Na tela de verdade, viram parâmetros da API
 * (docs/adr/018-prontuario-v2-busca-consultas-e-programas-por-paciente.md).
 */
import { useMemo } from 'react';

import { useAppointments } from '@/application/clinic/use-appointments';
import { usePatientAssessments } from '@/application/clinic/use-assessments';
import { usePatientEvolutions } from '@/application/clinic/use-evolutions';
import { usePatientFiles } from '@/application/clinic/use-patient-files';
import { usePatientQuestionnaires } from '@/application/clinic/use-patient-questionnaires';
import { usePatientDetail } from '@/application/clinic/use-patients';
import { useClinicPrograms } from '@/application/clinic/use-programs';
import type {
    Appointment,
    AssessmentSummary,
    PatientEvolution,
    PatientFile,
    PatientQuestionnaire,
    Program,
} from '@/domain/clinic';
import type { PatientDetail } from '@/domain/clinic/patient';
import { statusLabel } from '@/components/clinic/agenda/agenda-shared';

const DAY = 24 * 60 * 60 * 1000;

export type RecordKind =
    | 'consulta'
    | 'evolucao'
    | 'avaliacao'
    | 'questionario'
    | 'arquivo'
    | 'programa';

export type Tone = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type RecordSource =
    | { kind: 'consulta'; item: Appointment }
    | { kind: 'evolucao'; item: PatientEvolution }
    | { kind: 'avaliacao'; item: AssessmentSummary }
    | { kind: 'questionario'; item: PatientQuestionnaire }
    | { kind: 'arquivo'; item: PatientFile }
    | { kind: 'programa'; item: Program };

export interface RecordItem {
    key: string;
    kind: RecordKind;
    /** null = rascunho sem data (avaliação não assinada). */
    date: Date | null;
    title: string;
    subtitle: string;
    author: string | null;
    status: { label: string; tone: Tone } | null;
    /** Pede ação de alguém (rascunho, questionário pendente). */
    pending: boolean;
    future: boolean;
    source: RecordSource;
}

export const KIND_META: Record<RecordKind, { label: string; plural: string }> =
    {
        consulta: { label: 'Consulta', plural: 'Consultas' },
        evolucao: { label: 'Evolução', plural: 'Evoluções' },
        avaliacao: { label: 'Avaliação', plural: 'Avaliações' },
        questionario: { label: 'Questionário', plural: 'Questionários' },
        arquivo: { label: 'Arquivo', plural: 'Arquivos' },
        programa: { label: 'Programa', plural: 'Programas' },
    };

/** Nomes da agenda v2 (statusLabel); o tom é só o do selo. */
const APPOINTMENT_TONE: Record<Appointment['status'], Tone> = {
    scheduled: 'info',
    confirmed: 'success',
    completed: 'default',
    no_show: 'danger',
    cancelled: 'danger',
};

const PROGRAM_STATUS: Record<Program['status'], { label: string; tone: Tone }> =
    {
        draft: { label: 'Rascunho', tone: 'warning' },
        sent: { label: 'Enviado', tone: 'info' },
        active: { label: 'Em andamento', tone: 'success' },
        completed: { label: 'Concluído', tone: 'default' },
    };

function isoDay(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Janela fixa por dia, para a chave da query não mudar a cada render. */
function appointmentWindow() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
        from: isoDay(new Date(today.getTime() - 365 * DAY)),
        to: isoDay(new Date(today.getTime() + 183 * DAY)),
    };
}

export function formatDate(date: Date | null, withYear = true): string {
    if (!date) return 'Sem data';
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        ...(withYear ? { year: 'numeric' } : {}),
    });
}

export function formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatBytes(size: number): string {
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

/** "há 3 dias", "amanhã", "em 12 dias". */
export function relativeDay(date: Date, now = new Date()): string {
    const a = new Date(date);
    a.setHours(0, 0, 0, 0);
    const b = new Date(now);
    b.setHours(0, 0, 0, 0);
    const diff = Math.round((a.getTime() - b.getTime()) / DAY);
    if (diff === 0) return 'hoje';
    if (diff === 1) return 'amanhã';
    if (diff === -1) return 'ontem';
    if (diff > 0) return `em ${diff} dias`;
    if (diff > -31) return `há ${-diff} dias`;
    const months = Math.round(-diff / 30);
    return months === 1 ? 'há 1 mês' : `há ${months} meses`;
}

export function ageOf(birthDate?: string): number | null {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const beforeBirthday =
        now.getMonth() < birth.getMonth() ||
        (now.getMonth() === birth.getMonth() &&
            now.getDate() < birth.getUTCDate());
    if (beforeBirthday) age -= 1;
    return age;
}

export function formatPhone(phone?: string): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
}

function toItems(sources: {
    appointments: Appointment[];
    evolutions: PatientEvolution[];
    assessments: AssessmentSummary[];
    questionnaires: PatientQuestionnaire[];
    files: PatientFile[];
    programs: Program[];
}): RecordItem[] {
    const now = Date.now();
    const items: RecordItem[] = [];

    for (const a of sources.appointments) {
        const date = new Date(a.startsAt);
        items.push({
            key: `consulta-${a.id}`,
            kind: 'consulta',
            date,
            title: a.title || 'Consulta',
            subtitle: `${formatTime(date)} – ${formatTime(new Date(a.endsAt))}${a.location ? ` · ${a.location}` : ''}`,
            author: a.clinicUserName || null,
            status: {
                label: statusLabel(a.status),
                tone: APPOINTMENT_TONE[a.status],
            },
            pending: false,
            future: date.getTime() > now,
            source: { kind: 'consulta', item: a },
        });
    }
    for (const e of sources.evolutions) {
        items.push({
            key: `evolucao-${e.id}`,
            kind: 'evolucao',
            date: new Date(e.signedAt ?? e.createdAt),
            title: e.title || 'Sessão de fisioterapia',
            subtitle: e.notes || e.generatedText || 'Sem texto',
            author: e.clinicUser?.name ?? null,
            status:
                e.status === 'signed'
                    ? { label: 'Assinada', tone: 'success' }
                    : { label: 'Rascunho', tone: 'warning' },
            pending: e.status === 'draft',
            future: false,
            source: { kind: 'evolucao', item: e },
        });
    }
    for (const a of sources.assessments) {
        items.push({
            key: `avaliacao-${a.id}`,
            kind: 'avaliacao',
            date: a.signedAt ? new Date(a.signedAt) : null,
            title: a.template.name,
            subtitle: 'Avaliação estruturada',
            author: a.clinicUser?.name ?? null,
            status:
                a.status === 'signed'
                    ? { label: 'Assinada', tone: 'success' }
                    : { label: 'Rascunho', tone: 'warning' },
            pending: a.status === 'draft',
            future: false,
            source: { kind: 'avaliacao', item: a },
        });
    }
    for (const q of sources.questionnaires) {
        const answered = q.status === 'answered';
        items.push({
            key: `questionario-${q.id}`,
            kind: 'questionario',
            date: new Date(q.answeredAt ?? q.createdAt),
            title: q.template?.title ?? 'Questionário',
            subtitle:
                q.modality === 'remoto'
                    ? 'Respondido pelo paciente, a distância'
                    : 'Respondido na clínica',
            author: q.clinicUser?.name ?? null,
            status: answered
                ? { label: 'Respondido', tone: 'success' }
                : q.status === 'expired'
                  ? { label: 'Expirado', tone: 'danger' }
                  : { label: 'Aguardando resposta', tone: 'warning' },
            pending: q.status === 'pending',
            future: false,
            source: { kind: 'questionario', item: q },
        });
    }
    for (const f of sources.files) {
        items.push({
            key: `arquivo-${f.id}`,
            kind: 'arquivo',
            date: new Date(f.createdAt),
            title: f.name ?? f.originalName,
            subtitle: `${f.originalName} · ${formatBytes(f.size)}`,
            author: f.clinicUser?.name ?? null,
            status: null,
            pending: false,
            future: false,
            source: { kind: 'arquivo', item: f },
        });
    }
    for (const p of sources.programs) {
        items.push({
            key: `programa-${p.id}`,
            kind: 'programa',
            date: new Date(p.startDate),
            title: p.title,
            subtitle: `${p.exerciseCount} exercícios · ${p.patientCompletedCount} feitos pelo paciente`,
            author: p.professionalName,
            status: PROGRAM_STATUS[p.status],
            pending: p.status === 'draft',
            future: false,
            source: { kind: 'programa', item: p },
        });
    }

    // Mais recente primeiro; rascunho sem data no topo.
    return items.sort(
        (a, b) =>
            (b.date?.getTime() ?? Infinity) - (a.date?.getTime() ?? Infinity),
    );
}

export interface RecordStats {
    completed: number;
    noShow: number;
    /** Comparecimento das consultas já encerradas (0–100), ou null. */
    attendance: number | null;
    next: RecordItem | null;
    last: RecordItem | null;
    /** Desde a primeira consulta ou registro. */
    since: Date | null;
    /** Faltas seguidas mais recentes (alerta de abandono). */
    noShowStreak: number;
    activeProgram: Program | null;
    pending: RecordItem[];
}

function toStats(items: RecordItem[]): RecordStats {
    const visits = items
        .filter((i) => i.kind === 'consulta')
        .map((i) => i.source.item as Appointment);
    const past = visits.filter(
        (a) => a.status === 'completed' || a.status === 'no_show',
    );
    const completed = past.filter((a) => a.status === 'completed').length;
    const noShow = past.length - completed;

    const upcoming = items
        .filter(
            (i) =>
                i.kind === 'consulta' &&
                i.future &&
                (i.source.item as Appointment).status !== 'cancelled',
        )
        .sort((a, b) => a.date!.getTime() - b.date!.getTime());
    const done = items.filter(
        (i) =>
            i.kind === 'consulta' &&
            !i.future &&
            (i.source.item as Appointment).status === 'completed',
    );

    let noShowStreak = 0;
    const pastSorted = [...past].sort(
        (a, b) => +new Date(b.startsAt) - +new Date(a.startsAt),
    );
    for (const a of pastSorted) {
        if (a.status !== 'no_show') break;
        noShowStreak += 1;
    }

    const dated = items.filter((i) => i.date && !i.future);
    const since = dated.length ? dated[dated.length - 1]!.date : null;

    const programs = items
        .filter((i) => i.kind === 'programa')
        .map((i) => i.source.item as Program);

    return {
        completed,
        noShow,
        attendance: past.length
            ? Math.round((completed / past.length) * 100)
            : null,
        next: upcoming[0] ?? null,
        last: done[0] ?? null,
        since,
        noShowStreak,
        activeProgram:
            programs.find(
                (p) => p.status === 'active' || p.status === 'sent',
            ) ?? null,
        pending: items.filter((i) => i.pending),
    };
}

export interface PatientRecordData {
    patient: PatientDetail | null | undefined;
    items: RecordItem[];
    stats: RecordStats;
    isLoading: boolean;
    isError: boolean;
    patientError: boolean;
}

export function usePatientRecord(id: string): PatientRecordData {
    const patient = usePatientDetail(id);
    const evolutions = usePatientEvolutions(id);
    const assessments = usePatientAssessments(id);
    const questionnaires = usePatientQuestionnaires(id);
    const files = usePatientFiles(id);
    const window = useMemo(() => appointmentWindow(), []);
    const appointments = useAppointments(window);
    const programs = useClinicPrograms({ perPage: 200 });

    const items = useMemo(
        () =>
            toItems({
                appointments: (appointments.data ?? []).filter(
                    (a) => a.patientId === id,
                ),
                evolutions: evolutions.data ?? [],
                assessments: assessments.data ?? [],
                questionnaires: questionnaires.data ?? [],
                files: files.data ?? [],
                programs: (programs.data?.items ?? []).filter(
                    (p) => p.patientId === id,
                ),
            }),
        [
            id,
            appointments.data,
            evolutions.data,
            assessments.data,
            questionnaires.data,
            files.data,
            programs.data,
        ],
    );
    const stats = useMemo(() => toStats(items), [items]);

    const all = [
        evolutions,
        assessments,
        questionnaires,
        files,
        appointments,
        programs,
    ];
    return {
        patient: patient.data,
        items,
        stats,
        isLoading: patient.isLoading || all.some((q) => q.isLoading),
        isError: all.some((q) => q.isError),
        patientError: patient.isError || (!patient.isLoading && !patient.data),
    };
}
