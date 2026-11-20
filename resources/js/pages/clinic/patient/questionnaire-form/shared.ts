import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    usePatientQuestionnaires,
    useSendQuestionnaire,
} from '@/application/clinic/use-patient-questionnaires';
import { useQuestionnaireTemplates } from '@/application/clinic/use-questionnaire-templates';
import type {
    PatientQuestionnaire,
    QuestionnaireQuestion,
    QuestionnaireTemplate,
} from '@/domain/clinic';

export const DEADLINES = [
    { key: '1', label: '24 horas', days: 1 },
    { key: '3', label: '3 dias', days: 3 },
    { key: '7', label: '1 semana', days: 7 },
    { key: '0', label: 'Sem prazo', days: 0 },
] as const;

export function questionsOf(t: QuestionnaireTemplate): QuestionnaireQuestion[] {
    return [...t.sections]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .flatMap((s) =>
            [...s.questions].sort((a, b) => a.sortOrder - b.sortOrder),
        );
}

export function minutesFor(n: number): string {
    return `cerca de ${Math.max(1, Math.round((n * 15) / 60))} min`;
}

export const STATUS_LABEL: Record<PatientQuestionnaire['status'], string> = {
    pending: 'Aguardando resposta',
    answered: 'Respondido',
    expired: 'Expirou',
};

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function expiresAtPayload(days: number, now: Date): string | null {
    if (!days) return null;
    const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export function useQuestionnaireSend(patientId: string, onClose: () => void) {
    const navigate = useNavigate();
    const templates = useQuestionnaireTemplates();
    const history = usePatientQuestionnaires(patientId);
    const sendMutation = useSendQuestionnaire(patientId);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [deadline, setDeadline] = useState<string>('3');
    const [now] = useState(() => new Date());

    const active = useMemo(
        () => (templates.data ?? []).filter((t) => t.isActive),
        [templates.data],
    );
    const selected = active.find((t) => t.id === selectedId) ?? null;
    const days = DEADLINES.find((d) => d.key === deadline)?.days ?? 0;
    const expiresAt = days
        ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        : null;

    const lastSentOf = (templateId: number) =>
        [...(history.data ?? [])]
            .filter((q) => q.questionnaireTemplateId === templateId)
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];

    const send = async (): Promise<PatientQuestionnaire | null> => {
        if (!selected) return null;
        try {
            return await sendMutation.mutateAsync({
                questionnaireTemplateId: selected.id,
                modality: 'remoto',
                expiresAt: expiresAtPayload(days, now),
            });
        } catch {
            return null;
        }
    };

    return {
        loading: templates.isLoading,
        templates: active,
        selected,
        select: setSelectedId,
        deadline,
        setDeadline,
        expiresAt,
        lastSentOf,
        sending: sendMutation.isPending,
        send,
        createNew: () => {
            onClose();
            navigate(
                `/clinica/questionarios/novo?returnTo=${encodeURIComponent(
                    `/clinica/pacientes/${patientId}`,
                )}`,
            );
        },
    };
}

export type QuestionnaireSend = ReturnType<typeof useQuestionnaireSend>;
