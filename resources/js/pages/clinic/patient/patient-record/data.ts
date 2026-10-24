/**
 * Junta o que o prontuário lê do paciente numa lista só. Consultas e
 * programas já vêm filtrados pela API (ADR 018); os números saem de
 * `patientCareStats`.
 */
import { useMemo } from 'react';

import {
    evolutionDetailBlocks,
    evolutionListPreview,
    type EvolutionSheetBlock,
} from '@/application/clinic/evolution-sheet-text';
import { patientCareStats } from '@/application/clinic/patient-care';
import { usePatientAppointments } from '@/application/clinic/use-appointments';
import { usePatientAssessments } from '@/application/clinic/use-assessments';
import { usePatientEvolutions } from '@/application/clinic/use-evolutions';
import { usePatientFiles } from '@/application/clinic/use-patient-files';
import { usePatientQuestionnaires } from '@/application/clinic/use-patient-questionnaires';
import { usePatientDetail } from '@/application/clinic/use-patients';
import { usePatientPrograms } from '@/application/clinic/use-programs';
import { statusLabel } from '@/components/clinic/agenda/agenda-shared';
import type {
    Appointment,
    AssessmentSummary,
    PatientEvolution,
    PatientFile,
    PatientQuestionnaire,
    Program,
} from '@/domain/clinic';
import type { PatientDetail } from '@/domain/clinic/patient';

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
    /** Folha da evolução (modelo), igual ao cadastro; omitido se só há notas. */
    evolutionSheet?: EvolutionSheetBlock[];
    author: string | null;
    status: { label: string; tone: Tone } | null;
    /** Pede ação de alguém (rascunho, questionário pendente). */
    pending: boolean;
    future: boolean;
    source: RecordSource;
}

export const RECORD_TABS = [
    'clinico',
    'agenda',
    'programas',
    'arquivos',
] as const;

export type RecordTab = (typeof RECORD_TABS)[number];

export const SEARCHABLE_KINDS: RecordKind[] = [
    'evolucao',
    'avaliacao',
    'questionario',
    'arquivo',
];

export function tabFromSearchParam(value: string | null): RecordTab {
    if (value && (RECORD_TABS as readonly string[]).includes(value)) {
        return value as RecordTab;
    }
    return 'clinico';
}

export function matchesSearch(item: RecordItem, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (!SEARCHABLE_KINDS.includes(item.kind)) return true;
    return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );
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

/** Monta itens da lista do prontuário (exportado para testes). */
export function buildRecordItems(sources: {
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
            subtitle:
                e.notes || evolutionListPreview(e.generatedText) || 'Sem texto',
            evolutionSheet: e.notes ? undefined : evolutionDetailBlocks(e),
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
            subtitle: answered
                ? q.modality === 'remoto'
                    ? 'Respondido pelo paciente, a distância'
                    : 'Respondido na clínica'
                : q.status === 'expired'
                  ? 'Prazo encerrado'
                  : q.modality === 'remoto'
                    ? 'Aguardando resposta do paciente'
                    : 'Aguardando resposta na clínica',
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
    attendance: number | null;
    next: RecordItem | null;
    last: RecordItem | null;
    since: Date | null;
    monthsInCare: number | null;
    noShowStreak: number;
    activeProgram: Program | null;
    pending: RecordItem[];
}

function consultaItem(
    items: RecordItem[],
    appointment: Appointment | null,
): RecordItem | null {
    if (!appointment) return null;
    return (
        items.find(
            (i) =>
                i.kind === 'consulta' &&
                i.source.kind === 'consulta' &&
                i.source.item.id === appointment.id,
        ) ?? null
    );
}

export interface ListErrors {
    evolutions: boolean;
    assessments: boolean;
    questionnaires: boolean;
    files: boolean;
    appointments: boolean;
    programs: boolean;
}

export interface PatientRecordData {
    patient: PatientDetail | null | undefined;
    items: RecordItem[];
    stats: RecordStats;
    isLoading: boolean;
    isError: boolean;
    patientError: boolean;
    listErrors: ListErrors;
}

export function usePatientRecord(id: string): PatientRecordData {
    const patient = usePatientDetail(id);
    const evolutions = usePatientEvolutions(id);
    const assessments = usePatientAssessments(id);
    const questionnaires = usePatientQuestionnaires(id);
    const files = usePatientFiles(id);
    const appointments = usePatientAppointments(id);
    const programs = usePatientPrograms(id);

    const items = useMemo(
        () =>
            buildRecordItems({
                appointments: appointments.data ?? [],
                evolutions: evolutions.data ?? [],
                assessments: assessments.data ?? [],
                questionnaires: questionnaires.data ?? [],
                files: files.data ?? [],
                programs: programs.data ?? [],
            }),
        [
            appointments.data,
            evolutions.data,
            assessments.data,
            questionnaires.data,
            files.data,
            programs.data,
        ],
    );

    const stats = useMemo(() => {
        const care = patientCareStats(
            appointments.data ?? [],
            programs.data ?? [],
        );
        return {
            completed: care.completed,
            noShow: care.noShow,
            attendance: care.attendance,
            next: consultaItem(items, care.next),
            last: consultaItem(items, care.last),
            since: care.since,
            monthsInCare: care.monthsInCare,
            noShowStreak: care.noShowStreak,
            activeProgram: care.activeProgram,
            pending: items.filter((i) => i.pending),
        };
    }, [appointments.data, programs.data, items]);

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
        listErrors: {
            evolutions: evolutions.isError,
            assessments: assessments.isError,
            questionnaires: questionnaires.isError,
            files: files.isError,
            appointments: appointments.isError,
            programs: programs.isError,
        },
    };
}
