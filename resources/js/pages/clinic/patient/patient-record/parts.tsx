/**
 * Peças do prontuário (drawer, ícones e ações). Overlays v1 que gravam
 * ficam no PatientRecordScreen, não aqui.
 */
import {
    Activity,
    CalendarDays,
    ClipboardList,
    Copy,
    Download,
    Dumbbell,
    ExternalLink,
    FileText,
    Mail,
    MessageCircle,
    Paperclip,
    Pencil,
    PenLine,
    Trash2,
    Upload,
    type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { can } from '@/application/clinic/permissions';
import { useDeleteEvolution } from '@/application/clinic/use-evolutions';
import { useDeletePatientFile } from '@/application/clinic/use-patient-files';
import {
    useDeleteQuestionnaire,
    usePatientQuestionnaire,
} from '@/application/clinic/use-patient-questionnaires';
import {
    DsBadge,
    DsButton,
    dsCn,
    DsDrawer,
    DsList,
    DsModal,
    DsTooltip,
    type BadgeVariant,
} from '@/components/ds';
import type { ClinicRole } from '@/domain/auth/session';
import type { Appointment, PatientEvolution, Program } from '@/domain/clinic';

import {
    formatDate,
    formatTime,
    KIND_META,
    relativeDay,
    type RecordItem,
    type RecordKind,
    type Tone,
} from './data';
import {
    buildMailtoUrl,
    buildWhatsAppUrl,
    questionnaireShareText,
} from './share';

export const KIND_ICON: Record<RecordKind, LucideIcon> = {
    consulta: CalendarDays,
    evolucao: FileText,
    avaliacao: Activity,
    questionario: ClipboardList,
    arquivo: Paperclip,
    programa: Dumbbell,
};

/** Cor de cada tipo: só tokens semânticos, que já trocam no escuro. */
export const KIND_TONE: Record<RecordKind, string> = {
    consulta: 'bg-ds-status-info-surface text-ds-status-info-content',
    evolucao:
        'bg-ds-surface-brand-subtle text-ds-content-brand ds-dark:text-ds-primary-60',
    avaliacao: 'bg-ds-status-success-surface text-ds-status-success-content',
    questionario: 'bg-ds-status-warning-surface text-ds-status-warning-content',
    arquivo: 'bg-ds-surface-subtle text-ds-content-secondary',
    programa:
        'border border-ds-border-brand-subtle bg-ds-surface-default text-ds-content-brand ds-dark:text-ds-primary-60',
};

export function KindIcon({
    kind,
    size = 36,
    className,
}: {
    kind: RecordKind;
    size?: number;
    className?: string;
}) {
    const Icon = KIND_ICON[kind];
    return (
        <span
            aria-hidden="true"
            className={dsCn(
                'flex shrink-0 items-center justify-center rounded-ds-md',
                KIND_TONE[kind],
                className,
            )}
            style={{ width: size, height: size }}
        >
            <Icon style={{ width: size * 0.5, height: size * 0.5 }} />
        </span>
    );
}

const TONE_BADGE: Record<Tone, BadgeVariant> = {
    default: 'default',
    info: 'info',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
};

export function ToneBadge({ status }: { status: RecordItem['status'] }) {
    if (!status) return null;
    return (
        <DsBadge variant={TONE_BADGE[status.tone]} dot>
            {status.label}
        </DsBadge>
    );
}

// ------------------------------------------------------------ ações

export type QuickAction =
    | 'evolucao'
    | 'avaliacao'
    | 'questionario'
    | 'arquivo'
    | 'consulta'
    | 'programa';

export const QUICK_ACTIONS: {
    key: QuickAction;
    label: string;
    short: string;
    icon: ReactNode;
}[] = [
    {
        key: 'evolucao',
        label: 'Nova evolução',
        short: 'Evolução',
        icon: <PenLine />,
    },
    {
        key: 'avaliacao',
        label: 'Nova avaliação',
        short: 'Avaliação',
        icon: <Activity />,
    },
    {
        key: 'questionario',
        label: 'Enviar questionário',
        short: 'Questionário',
        icon: <ClipboardList />,
    },
    {
        key: 'arquivo',
        label: 'Enviar arquivo',
        short: 'Arquivo',
        icon: <Upload />,
    },
    {
        key: 'consulta',
        label: 'Agendar consulta',
        short: 'Consulta',
        icon: <CalendarDays />,
    },
    {
        key: 'programa',
        label: 'Novo programa',
        short: 'Programa',
        icon: <Dumbbell />,
    },
];

export const CLINICAL_DENIED =
    'Apenas admin ou fisioterapeuta podem registrar evolução e avaliação';

export const DELETE_EVOLUTION_DENIED =
    'Apenas o admin da clínica pode excluir evolução';

export const DELETE_FILE_DENIED =
    'Apenas o admin ou quem enviou pode excluir este arquivo';

export const DELETE_QUESTIONNAIRE_DENIED =
    'Apenas o admin ou quem enviou pode excluir este questionário';

export function canEditEvolutionDraft(
    role?: ClinicRole,
    ownerId?: number,
    userId?: number,
): boolean {
    if (can.delete(role)) return true;
    return can.manageClinicalRecords(role) && ownerId === userId;
}

export function canDeleteOwnedRecord(
    role?: ClinicRole,
    ownerId?: number,
    userId?: number,
): boolean {
    if (can.delete(role)) return true;
    return can.deleteOwn(role) && ownerId === userId;
}

/** Botão visível com motivo no tooltip quando a ação não é permitida (ADR 017). */
export function GuardedButton({
    allowed,
    denied,
    label,
    icon,
    onClick,
    size = 'sm',
    variant = 'secondary',
}: {
    allowed: boolean;
    denied: string;
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    size?: 'sm' | 'md';
    variant?: 'secondary' | 'tertiary' | 'destructive-secondary';
}) {
    const button = (
        <DsButton
            size={size}
            variant={variant}
            iconPosition={icon ? 'left' : undefined}
            icon={icon}
            label={label}
            aria-disabled={allowed ? undefined : true}
            className={allowed ? undefined : 'cursor-not-allowed opacity-50'}
            onClick={allowed ? onClick : undefined}
        />
    );
    if (allowed) return button;
    return (
        <DsTooltip content={denied} asChild>
            {button}
        </DsTooltip>
    );
}

// ------------------------------------------------------------ leitura

/** Conteúdo de um registro, aberto no drawer. */
export function RecordBody({
    item,
    patientId,
    patientName,
    patientPhone,
    patientEmail,
}: {
    item: RecordItem;
    patientId: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
}) {
    const navigate = useNavigate();
    const src = item.source;
    const questionnaireId =
        src.kind === 'questionario' ? String(src.item.id) : null;
    const questionnaireDetail = usePatientQuestionnaire(
        patientId,
        questionnaireId,
    );

    const meta = (
        <DsList
            mode="kv"
            items={[
                {
                    label: 'Data',
                    value: item.date
                        ? `${formatDate(item.date)} (${relativeDay(item.date)})`
                        : 'Sem data',
                },
                { label: 'Por', value: item.author ?? '—' },
                ...(item.status
                    ? [{ label: 'Situação', value: item.status.label }]
                    : []),
            ]}
        />
    );

    if (src.kind === 'evolucao') {
        const ev: PatientEvolution = src.item;
        return (
            <div className="flex flex-col gap-5">
                {meta}
                {ev.notes && (
                    <blockquote className="rounded-ds-lg border-l-4 border-ds-primary-80 bg-ds-surface-brand-subtle px-4 py-3 text-ds-body-sm text-ds-content-primary italic ds-dark:border-ds-primary-60">
                        “{ev.notes}”
                    </blockquote>
                )}
                <section>
                    <h3 className="mb-2 text-ds-eyebrow text-ds-content-muted uppercase">
                        Condutas
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {(ev.generatedText ?? '')
                            .split(/(?<=\.)\s+/)
                            .filter(Boolean)
                            .map((line, i) => (
                                <li
                                    key={i}
                                    className="flex gap-2 text-ds-body-sm text-ds-content-secondary"
                                >
                                    <span className="mt-2 size-1.5 shrink-0 rounded-ds-full bg-ds-primary-80 ds-dark:bg-ds-primary-60" />
                                    {line}
                                </li>
                            ))}
                    </ul>
                </section>
                {ev.template && (
                    <p className="text-ds-caption text-ds-content-muted">
                        Modelo: {ev.template.name}
                    </p>
                )}
            </div>
        );
    }

    if (src.kind === 'avaliacao') {
        return (
            <div className="flex flex-col gap-5">
                {meta}
                <p className="text-ds-body-sm text-ds-content-secondary">
                    As respostas ficam na tela da avaliação, com as seções do
                    modelo.
                </p>
                <div>
                    <DsButton
                        variant="secondary"
                        iconPosition="left"
                        icon={<ExternalLink />}
                        label={
                            src.item.status === 'draft'
                                ? 'Continuar avaliação'
                                : 'Abrir avaliação'
                        }
                        onClick={() =>
                            navigate(
                                `/clinica/pacientes/${patientId}/avaliacoes/${src.item.id}/editar`,
                            )
                        }
                    />
                </div>
            </div>
        );
    }

    if (src.kind === 'questionario') {
        const q = src.item;
        return (
            <div className="flex flex-col gap-5">
                <DsList
                    mode="kv"
                    items={[
                        {
                            label: 'Enviado em',
                            value: formatDate(new Date(q.createdAt)),
                        },
                        {
                            label: 'Respondido em',
                            value: q.answeredAt
                                ? formatDate(new Date(q.answeredAt))
                                : '—',
                        },
                        {
                            label: 'Modalidade',
                            value:
                                q.modality === 'remoto'
                                    ? 'A distância'
                                    : 'Presencial',
                        },
                        { label: 'Por', value: item.author ?? '—' },
                    ]}
                />
                {q.status === 'answered' ? (
                    <QuestionnaireAnswers
                        loading={questionnaireDetail.isLoading}
                        sections={
                            questionnaireDetail.data?.template?.sections ?? []
                        }
                        answers={questionnaireDetail.data?.answers ?? []}
                    />
                ) : (
                    <>
                        <p className="text-ds-body-sm text-ds-content-secondary">
                            Aguardando o paciente responder. Envie o link:
                        </p>
                        <QuestionnaireShareButtons
                            shareUrl={q.shareUrl}
                            title={q.template?.title ?? item.title}
                            patientName={patientName}
                            patientPhone={patientPhone}
                            patientEmail={patientEmail}
                        />
                    </>
                )}
            </div>
        );
    }

    if (src.kind === 'arquivo') {
        const f = src.item;
        const isImage = f.mimeType?.startsWith('image/');
        return (
            <div className="flex flex-col gap-5">
                {isImage && (
                    <a
                        href={f.cdnUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-ds-lg border border-ds-border-subtle bg-ds-surface-subtle"
                    >
                        <img
                            src={f.cdnUrl}
                            alt={f.name ?? f.originalName}
                            className="max-h-80 w-full object-contain"
                        />
                    </a>
                )}
                <DsList
                    mode="kv"
                    items={[
                        { label: 'Arquivo', value: f.originalName },
                        { label: 'Tipo', value: f.mimeType },
                        { label: 'Enviado', value: formatDate(item.date) },
                        { label: 'Por', value: item.author ?? '—' },
                    ]}
                />
                <div>
                    <DsButton
                        variant="secondary"
                        iconPosition="left"
                        icon={<Download />}
                        label="Baixar"
                        onClick={() => window.open(f.cdnUrl, '_blank')}
                    />
                </div>
            </div>
        );
    }

    if (src.kind === 'consulta') {
        const a: Appointment = src.item;
        return (
            <div className="flex flex-col gap-5">
                <DsList
                    mode="kv"
                    items={[
                        { label: 'Dia', value: formatDate(item.date) },
                        {
                            label: 'Horário',
                            value: `${formatTime(new Date(a.startsAt))} – ${formatTime(new Date(a.endsAt))}`,
                        },
                        {
                            label: 'Profissional',
                            value: a.clinicUserName || '—',
                        },
                        { label: 'Situação', value: item.status?.label ?? '—' },
                        ...(a.location
                            ? [{ label: 'Local', value: a.location }]
                            : []),
                    ]}
                />
                {a.description && (
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        {a.description}
                    </p>
                )}
                <div>
                    <DsButton
                        variant="secondary"
                        iconPosition="left"
                        icon={<CalendarDays />}
                        label="Ver na agenda"
                        onClick={() =>
                            navigate(`/clinica/agenda?patientId=${patientId}`)
                        }
                    />
                </div>
            </div>
        );
    }

    const p: Program = src.item;
    return (
        <div className="flex flex-col gap-5">
            {meta}
            <DsList
                mode="kv"
                items={[
                    { label: 'Exercícios', value: String(p.exerciseCount) },
                    {
                        label: 'Feitos pelo paciente',
                        value: String(p.patientCompletedCount),
                    },
                    {
                        label: 'Visto pelo paciente',
                        value: p.patientViewedAt
                            ? formatDate(new Date(p.patientViewedAt))
                            : 'Ainda não',
                    },
                ]}
            />
            <div>
                <DsButton
                    variant="secondary"
                    iconPosition="left"
                    icon={<ExternalLink />}
                    label="Abrir programa"
                    onClick={() =>
                        navigate(`/clinica/programas/${p.id}/editar`)
                    }
                />
            </div>
        </div>
    );
}

function formatAnswer(answer: string | string[] | null): string {
    if (answer === null) return '—';
    return Array.isArray(answer) ? answer.join(', ') : answer;
}

async function copyShareUrl(shareUrl: string | null) {
    if (!shareUrl) return;
    try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiado');
    } catch {
        toast.error('Não foi possível copiar o link');
    }
}

export function QuestionnaireShareButtons({
    shareUrl,
    title,
    patientName,
    patientPhone,
    patientEmail,
}: {
    shareUrl: string | null;
    title: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
}) {
    const text = questionnaireShareText(patientName, title, shareUrl ?? '');
    const whatsappUrl = buildWhatsAppUrl(patientPhone, text);
    const mailtoUrl = buildMailtoUrl(
        patientEmail,
        `Questionário: ${title}`,
        text,
    );

    return (
        <div className="flex flex-col gap-2">
            <GuardedButton
                allowed={!!shareUrl}
                denied="Link de acesso indisponível"
                label="Copiar link"
                icon={<Copy />}
                onClick={() => void copyShareUrl(shareUrl)}
            />
            <GuardedButton
                allowed={!!whatsappUrl}
                denied="Paciente sem telefone cadastrado"
                label="WhatsApp"
                icon={<MessageCircle />}
                onClick={() => {
                    if (whatsappUrl) {
                        window.open(
                            whatsappUrl,
                            '_blank',
                            'noopener,noreferrer',
                        );
                    }
                }}
            />
            <GuardedButton
                allowed={!!mailtoUrl}
                denied="Paciente sem e-mail cadastrado"
                label="E-mail"
                icon={<Mail />}
                onClick={() => {
                    if (mailtoUrl) window.location.href = mailtoUrl;
                }}
            />
        </div>
    );
}

function QuestionnaireAnswers({
    loading,
    sections,
    answers,
}: {
    loading: boolean;
    sections: Array<{
        id: number;
        title: string;
        questions: Array<{ id: number; label: string }>;
    }>;
    answers: Array<{
        questionnaireQuestionId: number;
        answer: string | string[] | null;
    }>;
}) {
    if (loading) {
        return (
            <p className="text-ds-body-sm text-ds-content-secondary">
                Carregando respostas…
            </p>
        );
    }
    const byQuestion = new Map(
        answers.map((a) => [a.questionnaireQuestionId, a.answer]),
    );
    if (sections.length === 0) {
        return (
            <p className="text-ds-body-sm text-ds-content-secondary">
                Sem respostas registradas.
            </p>
        );
    }
    return (
        <div className="flex flex-col gap-4">
            {sections.map((section) => (
                <section key={section.id}>
                    <h3 className="mb-2 text-ds-eyebrow text-ds-content-muted uppercase">
                        {section.title}
                    </h3>
                    <ul className="flex flex-col gap-3">
                        {section.questions.map((question) => (
                            <li key={question.id}>
                                <p className="text-ds-caption text-ds-content-muted">
                                    {question.label}
                                </p>
                                <p className="text-ds-body-sm text-ds-content-primary">
                                    {formatAnswer(
                                        byQuestion.get(question.id) ?? null,
                                    )}
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

type DeleteKind = 'evolucao' | 'arquivo' | 'questionario';

export function RecordDrawer({
    item,
    patientId,
    patientName,
    patientPhone,
    patientEmail,
    currentUserId,
    role,
    onClose,
    onEditEvolution,
}: {
    item: RecordItem | null;
    patientId: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
    currentUserId?: number;
    role?: ClinicRole;
    onClose: () => void;
    onEditEvolution?: (evolution: PatientEvolution) => void;
}) {
    const [pendingDelete, setPendingDelete] = useState<DeleteKind | null>(null);
    const deleteEvolution = useDeleteEvolution(patientId);
    const deleteFile = useDeletePatientFile(patientId);
    const deleteQuestionnaire = useDeleteQuestionnaire(patientId);
    const deleting =
        deleteEvolution.isPending ||
        deleteFile.isPending ||
        deleteQuestionnaire.isPending;

    const closeDelete = () => {
        if (!deleting) setPendingDelete(null);
    };

    const confirmDelete = () => {
        if (!item) return;
        if (pendingDelete === 'evolucao' && item.source.kind === 'evolucao') {
            deleteEvolution.mutate(String(item.source.item.id), {
                onSuccess: () => {
                    setPendingDelete(null);
                    onClose();
                },
            });
            return;
        }
        if (pendingDelete === 'arquivo' && item.source.kind === 'arquivo') {
            deleteFile.mutate(String(item.source.item.id), {
                onSuccess: () => {
                    setPendingDelete(null);
                    onClose();
                },
            });
            return;
        }
        if (
            pendingDelete === 'questionario' &&
            item.source.kind === 'questionario'
        ) {
            deleteQuestionnaire.mutate(String(item.source.item.id), {
                onSuccess: () => {
                    setPendingDelete(null);
                    onClose();
                },
            });
        }
    };

    const deleteCopy =
        pendingDelete === 'evolucao'
            ? {
                  title: 'Excluir rascunho de evolução',
                  body: 'Esta ação não pode ser desfeita.',
              }
            : pendingDelete === 'arquivo'
              ? {
                    title: 'Excluir arquivo',
                    body: 'O arquivo sai do prontuário. Esta ação não pode ser desfeita.',
                }
              : {
                    title: 'Excluir questionário',
                    body: 'O envio sai do prontuário. Esta ação não pode ser desfeita.',
                };

    return (
        <>
            <DsDrawer
                open={!!item}
                onOpenChange={(open) => !open && onClose()}
                placement="right"
                size="md"
                title={item?.title ?? ''}
                meta={item ? KIND_META[item.kind].label : undefined}
                footer={
                    item ? (
                        <RecordFooter
                            item={item}
                            role={role}
                            currentUserId={currentUserId}
                            onEditEvolution={onEditEvolution}
                            onRequestDelete={setPendingDelete}
                        />
                    ) : undefined
                }
            >
                {item && (
                    <RecordBody
                        item={item}
                        patientId={patientId}
                        patientName={patientName}
                        patientPhone={patientPhone}
                        patientEmail={patientEmail}
                    />
                )}
            </DsDrawer>
            <DsModal
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open) closeDelete();
                }}
                size="sm"
                title={deleteCopy.title}
                footer={
                    <div className="flex w-full justify-end gap-3">
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            disabled={deleting}
                            onClick={closeDelete}
                        />
                        <DsButton
                            variant="destructive"
                            label="Excluir"
                            loading={deleting}
                            onClick={confirmDelete}
                        />
                    </div>
                }
            >
                <p className="text-ds-body-sm text-ds-content-secondary">
                    {deleteCopy.body}
                </p>
            </DsModal>
        </>
    );
}

function RecordFooter({
    item,
    role,
    currentUserId,
    onEditEvolution,
    onRequestDelete,
}: {
    item: RecordItem;
    role?: ClinicRole;
    currentUserId?: number;
    onEditEvolution?: (evolution: PatientEvolution) => void;
    onRequestDelete: (kind: DeleteKind) => void;
}) {
    if (
        item.source.kind === 'evolucao' &&
        item.source.item.status === 'draft'
    ) {
        const evolution = item.source.item;
        const ownerId = evolution.clinicUserId;
        const canEdit = canEditEvolutionDraft(role, ownerId, currentUserId);
        const canRemove = can.delete(role);
        return (
            <div className="flex w-full flex-wrap justify-end gap-2">
                <GuardedButton
                    allowed={canEdit}
                    denied={CLINICAL_DENIED}
                    label="Editar rascunho"
                    icon={<Pencil />}
                    onClick={() => onEditEvolution?.(evolution)}
                />
                <GuardedButton
                    allowed={canRemove}
                    denied={DELETE_EVOLUTION_DENIED}
                    label="Excluir rascunho"
                    icon={<Trash2 />}
                    variant="destructive-secondary"
                    onClick={() => onRequestDelete('evolucao')}
                />
            </div>
        );
    }

    if (item.source.kind === 'arquivo') {
        const allowed = canDeleteOwnedRecord(
            role,
            item.source.item.clinicUserId,
            currentUserId,
        );
        return (
            <div className="flex w-full flex-wrap justify-end gap-2">
                <GuardedButton
                    allowed={allowed}
                    denied={DELETE_FILE_DENIED}
                    label="Excluir arquivo"
                    icon={<Trash2 />}
                    variant="destructive-secondary"
                    onClick={() => onRequestDelete('arquivo')}
                />
            </div>
        );
    }

    if (item.source.kind === 'questionario') {
        const allowed = canDeleteOwnedRecord(
            role,
            item.source.item.clinicUserId,
            currentUserId,
        );
        return (
            <div className="flex w-full flex-wrap justify-end gap-2">
                <GuardedButton
                    allowed={allowed}
                    denied={DELETE_QUESTIONNAIRE_DENIED}
                    label="Excluir questionário"
                    icon={<Trash2 />}
                    variant="destructive-secondary"
                    onClick={() => onRequestDelete('questionario')}
                />
            </div>
        );
    }

    return null;
}
