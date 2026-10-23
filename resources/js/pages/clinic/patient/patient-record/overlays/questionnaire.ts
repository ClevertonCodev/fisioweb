/**
 * Enviar questionário: modelos e histórico reais; o envio grava e devolve
 * o shareUrl com token.
 */
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

export type Modality = 'presencial' | 'remoto';

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

function toApiDatetime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function useQuestionnaireSend(patientId: string, onClose: () => void) {
    const navigate = useNavigate();
    const templates = useQuestionnaireTemplates();
    const history = usePatientQuestionnaires(patientId);
    const sendMutation = useSendQuestionnaire(patientId);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [modality, setModality] = useState<Modality>('remoto');
    const [deadline, setDeadline] = useState<string>('3');
    const [sent, setSent] = useState<PatientQuestionnaire | null>(null);
    const [now] = useState(() => Date.now());

    const active = useMemo(
        () => (templates.data ?? []).filter((t) => t.isActive),
        [templates.data],
    );
    const selected = active.find((t) => t.id === selectedId) ?? null;

    const lastSentOf = (templateId: number) =>
        [...(history.data ?? [])]
            .filter((q) => q.questionnaireTemplateId === templateId)
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];

    const days = DEADLINES.find((d) => d.key === deadline)?.days ?? 0;
    const expiresAt = days ? new Date(now + days * 24 * 60 * 60 * 1000) : null;

    const reset = () => {
        setSelectedId(null);
        setModality('remoto');
        setDeadline('3');
        setSent(null);
    };

    return {
        loading: templates.isLoading,
        sending: sendMutation.isPending,
        templates: active,
        selected,
        select: setSelectedId,
        modality,
        setModality,
        deadline,
        setDeadline,
        expiresAt,
        lastSentOf,
        sent,
        reset,
        send: async () => {
            if (!selected) return;
            const expiresAtApi =
                modality === 'remoto' && expiresAt
                    ? toApiDatetime(expiresAt)
                    : undefined;
            try {
                const created = await sendMutation.mutateAsync({
                    questionnaireTemplateId: selected.id,
                    modality,
                    expiresAt: expiresAtApi,
                });
                setSent(created);
            } catch {
                // toast no hook
            }
        },
        createNew: () => {
            reset();
            onClose();
            navigate(
                `/clinica/questionarios/novo?returnTo=${encodeURIComponent(
                    `/clinica/pacientes/${patientId}?nova=questionario`,
                )}`,
            );
        },
        finish: () => {
            reset();
            onClose();
        },
    };
}

export type QuestionnaireSend = ReturnType<typeof useQuestionnaireSend>;
