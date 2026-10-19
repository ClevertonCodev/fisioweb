/**
 * PROTÓTIPO (descartável): peças do prontuário (drawer, ícones e ações).
 * "Nova avaliação", "Editar paciente", abrir avaliação e "Novo programa"
 * levam às telas reais; nova evolução, enviar questionário, enviar arquivo
 * e agendar são stub (toast).
 */
import {
    Activity,
    CalendarDays,
    ClipboardList,
    Download,
    Dumbbell,
    ExternalLink,
    FileText,
    Paperclip,
    PenLine,
    Upload,
    type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
    DsBadge,
    DsButton,
    dsCn,
    DsDrawer,
    DsList,
    type BadgeVariant,
} from '@/components/ds';
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

/** Abrir nova evolução ou envio de arquivo: ?nova= (ver PatientRecordPrototype). */
export const NEW_PARAM = 'nova';

export function useQuickAction(patientId: string) {
    const navigate = useNavigate();
    const [, setSearchParams] = useSearchParams();
    return (action: QuickAction) => {
        switch (action) {
            case 'evolucao':
            case 'arquivo':
            case 'questionario':
                setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set(NEW_PARAM, action);
                    return next;
                });
                return;
            case 'avaliacao':
                navigate(`/clinica/pacientes/${patientId}/avaliacoes/nova`);
                return;
            case 'programa':
                navigate('/clinica/programas/novo');
                return;
            default: {
                const label = QUICK_ACTIONS.find(
                    (a) => a.key === action,
                )?.label;
                toast.info(`${label}: stub do protótipo`, {
                    description:
                        'Na tela de verdade, abre o mesmo fluxo da v1.',
                });
            }
        }
    };
}

// ------------------------------------------------------------ leitura

/** Conteúdo de um registro, aberto no drawer. */
export function RecordBody({
    item,
    patientId,
}: {
    item: RecordItem;
    patientId: string;
}) {
    const navigate = useNavigate();
    const src = item.source;

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
                <p className="text-ds-body-sm text-ds-content-secondary">
                    No protótipo, as respostas não são carregadas: a tela de
                    verdade mostra cada pergunta com a resposta aqui.
                </p>
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

export function RecordDrawer({
    item,
    patientId,
    onClose,
}: {
    item: RecordItem | null;
    patientId: string;
    onClose: () => void;
}) {
    return (
        <DsDrawer
            open={!!item}
            onOpenChange={(open) => !open && onClose()}
            placement="right"
            size="md"
            title={item?.title ?? ''}
            meta={item ? KIND_META[item.kind].label : undefined}
        >
            {item && <RecordBody item={item} patientId={patientId} />}
        </DsDrawer>
    );
}
