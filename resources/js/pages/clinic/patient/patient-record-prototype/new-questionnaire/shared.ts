/**
 * PROTÓTIPO (descartável): enviar questionário ao paciente, comum às
 * variantes. Modelos e envios anteriores são reais; enviar, copiar link e
 * WhatsApp são stub. Hoje o "link" de verdade não existe como página: a API
 * pública (/api/questionnaires/{id}) usa o id sequencial, sem token.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { usePatientQuestionnaires } from '@/application/clinic/use-patient-questionnaires';
import { useQuestionnaireTemplates } from '@/application/clinic/use-questionnaire-templates';
import type {
    PatientQuestionnaire,
    QuestionnaireQuestion,
    QuestionnaireTemplate,
} from '@/domain/clinic';

import { DEMO_TEMPLATES, demoLastSent } from './demo-data';

export const QUESTIONNAIRE_VARIANTS = [
    { key: 'O', name: 'Gaveta atual (v1)' },
    { key: 'A', name: 'Escolher e prever' },
] as const;

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

/** Uns 15 segundos por pergunta, para dar ideia do tamanho. */
export function minutesFor(n: number): string {
    return `cerca de ${Math.max(1, Math.round((n * 15) / 60))} min`;
}

export const STATUS_LABEL: Record<PatientQuestionnaire['status'], string> = {
    pending: 'Aguardando resposta',
    answered: 'Respondido',
    expired: 'Expirou',
};

export function useQuestionnaireSend(patientId: string, onClose: () => void) {
    const navigate = useNavigate();
    const templates = useQuestionnaireTemplates();
    const history = usePatientQuestionnaires(patientId);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [modality, setModality] = useState<Modality>('remoto');
    const [deadline, setDeadline] = useState<string>('3');
    const [sent, setSent] = useState(false);

    // Os reais da clínica e, depois, os de exemplo (demo-data.ts).
    const active = useMemo(
        () => [
            ...(templates.data ?? []).filter((t) => t.isActive),
            ...DEMO_TEMPLATES,
        ],
        [templates.data],
    );
    const selected = active.find((t) => t.id === selectedId) ?? null;

    /** Último envio deste modelo para o paciente (para não repetir à toa). */
    const lastSentOf = (templateId: number) =>
        [...(history.data ?? [])]
            .filter((q) => q.questionnaireTemplateId === templateId)
            .sort(
                (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
            )[0] ?? demoLastSent(templateId);

    const [now] = useState(() => Date.now());
    const days = DEADLINES.find((d) => d.key === deadline)?.days ?? 0;
    const expiresAt = days ? new Date(now + days * 24 * 60 * 60 * 1000) : null;

    return {
        loading: templates.isLoading,
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
        send: () => {
            if (!selected) return;
            setSent(true);
        },
        createNew: () =>
            navigate(
                `/clinica/questionarios/novo?returnTo=${encodeURIComponent(
                    `/clinica/pacientes/${patientId}?nova=questionario`,
                )}`,
            ),
        copyLink: () =>
            toast.info('Protótipo: ainda não existe link para o paciente.', {
                description:
                    'A página de responder não existe no front, e a API usa o id sem token.',
            }),
        whatsapp: () => toast.info('Protótipo: WhatsApp é stub.'),
        finish: () => {
            toast.success('Protótipo: nada foi enviado.');
            onClose();
        },
    };
}

export type QuestionnaireSend = ReturnType<typeof useQuestionnaireSend>;
