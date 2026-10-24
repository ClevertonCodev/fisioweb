import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
import {
    buildMailtoUrl,
    buildWhatsAppUrl,
    questionnaireShareText,
} from '@/pages/clinic/patient/patient-record/share';

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

export function useQuestionnaireSend(
    patientId: string,
    patientName: string,
    patientPhone: string | undefined,
    patientEmail: string | undefined,
    onClose: () => void,
) {
    const navigate = useNavigate();
    const templates = useQuestionnaireTemplates();
    const history = usePatientQuestionnaires(patientId);
    const sendMutation = useSendQuestionnaire(patientId);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [deadline, setDeadline] = useState<string>('3');
    const [sent, setSent] = useState<PatientQuestionnaire | null>(null);
    const [copied, setCopied] = useState(false);
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

    const shareUrl = sent?.shareUrl ?? null;
    const title = selected?.title ?? sent?.template?.title ?? 'Questionário';
    const text = questionnaireShareText(patientName, title, shareUrl ?? '');
    const whatsappUrl = buildWhatsAppUrl(patientPhone, text);
    const mailtoUrl = buildMailtoUrl(
        patientEmail,
        `Questionário: ${title}`,
        text,
    );

    const send = async () => {
        if (!selected) return;
        try {
            const created = await sendMutation.mutateAsync({
                questionnaireTemplateId: selected.id,
                modality: 'remoto',
                expiresAt: expiresAtPayload(days, now),
            });
            setSent(created);
        } catch {
            // toast no hook
        }
    };

    const copyLink = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Link copiado');
        } catch {
            toast.error('Não foi possível copiar o link');
        }
    };

    const openWhatsApp = () => {
        if (!whatsappUrl) return;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    const openEmail = () => {
        if (!mailtoUrl) return;
        window.location.href = mailtoUrl;
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
        sent,
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
        shareUrl,
        copied,
        copyLink,
        whatsappUrl,
        openWhatsApp,
        mailtoUrl,
        openEmail,
        finish: onClose,
    };
}

export type QuestionnaireSend = ReturnType<typeof useQuestionnaireSend>;
