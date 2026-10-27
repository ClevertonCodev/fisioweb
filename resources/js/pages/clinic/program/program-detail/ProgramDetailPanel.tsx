/**
 * Painel do programa (DS v2): no topo, o paciente, o status e a validade em
 * barra; uma faixa de números; embaixo, os grupos com cada exercício em
 * cartão, a dose em pedaços e o vídeo num modal. O rascunho troca os números
 * que só fazem sentido depois do envio por um aviso.
 */
import {
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    Dumbbell,
    Eye,
    MessageCircle,
    Pencil,
    Play,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
    doseParts,
    type PanelStatKey,
    programBackPath,
    programPanel,
    scheduleOf,
} from '@/application/clinic/program-detail';
import { programWhatsAppUrl } from '@/application/clinic/program-share';
import { DsAlert, DsButton, DsKpi, DsModal, DsTooltip } from '@/components/ds';
import type { Program, ProgramExercise } from '@/domain/clinic';
import {
    ProgramActionsMenu,
    useProgramHistoryActions,
} from '@/pages/clinic/program/program-history/ProgramHistoryActions';
import {
    PersonAvatar,
    ProgramStatusBadge,
    ValidityBar,
} from '@/pages/clinic/program/program-history/ProgramHistoryCard';

const STAT_ICON: Record<PanelStatKey, ReactNode> = {
    exercises: <Dumbbell />,
    validity: <CalendarClock />,
    completed: <CheckCircle2 />,
    viewed: <Eye />,
};

function editPath(program: Program) {
    return `/clinica/programas/${program.id}/editar`;
}

/** Por que o WhatsApp não pode ser usado agora, ou null se pode. */
function whatsAppBlockedReason(program: Program, url: string | null) {
    if (program.status === 'draft') {
        return 'Rascunho: o paciente ainda não recebeu';
    }
    if (!url) return 'Paciente sem telefone';
    return null;
}

function WhatsAppButton({ program }: { program: Program }) {
    const url = programWhatsAppUrl(program);
    const blocked = whatsAppBlockedReason(program, url);
    const button = (
        <DsButton
            variant="secondary"
            iconPosition="left"
            icon={<MessageCircle />}
            label="WhatsApp"
            disabled={blocked !== null}
            onClick={() => {
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
            }}
        />
    );
    if (!blocked) return button;
    // Botão desabilitado não recebe hover: a dica fica no invólucro.
    return (
        <DsTooltip content={blocked} asChild>
            <span tabIndex={0} className="inline-flex rounded-ds-md">
                {button}
            </span>
        </DsTooltip>
    );
}

function DetailActions({ program }: { program: Program }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { run, deleteModal } = useProgramHistoryActions({
        // A cópia herda a origem: o "Voltar" dela volta para o mesmo lugar.
        onDuplicated: (copy) =>
            navigate(`/clinica/programas/${copy.id}`, {
                state: location.state,
            }),
        onDeleted: () => navigate('/clinica/programas/historico'),
    });
    return (
        <div className="flex flex-wrap items-center gap-2">
            <DsButton
                variant="secondary"
                iconPosition="left"
                icon={<ArrowLeft />}
                label="Voltar"
                onClick={() => navigate(programBackPath(location.state))}
            />
            {program.patientId && <WhatsAppButton program={program} />}
            <DsButton
                iconPosition="left"
                icon={<Pencil />}
                label="Editar"
                onClick={() => navigate(editPath(program))}
            />
            <ProgramActionsMenu
                program={program}
                onAction={run}
                withShortcuts
            />
            {deleteModal}
        </div>
    );
}

function Thumb({ e }: { e: ProgramExercise }) {
    return (
        <span className="block size-20 shrink-0 overflow-hidden rounded-ds-md bg-ds-surface-subtle">
            {e.thumbnailUrl && (
                <img
                    src={e.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                />
            )}
        </span>
    );
}

function ExerciseCard({
    e,
    index,
    onPlay,
}: {
    e: ProgramExercise;
    index: number;
    onPlay: () => void;
}) {
    return (
        <li className="flex min-w-0 gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs">
            <button
                type="button"
                aria-label={`Ver vídeo de ${e.title}`}
                onClick={onPlay}
                className="group relative cursor-pointer"
            >
                <Thumb e={e} />
                <span className="absolute inset-0 flex items-center justify-center rounded-ds-md bg-ds-black/25 opacity-80 group-hover:opacity-100">
                    <Play className="size-6 fill-ds-white text-ds-white" />
                </span>
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="text-ds-body-xs font-medium">
                    <span className="mr-1.5 font-ds-mono text-ds-content-muted">
                        {index + 1}.
                    </span>
                    {e.title}
                </p>
                <div className="flex flex-wrap gap-1">
                    {doseParts(e).map((d) => (
                        <span
                            key={d.key}
                            className="rounded-ds-sm bg-ds-surface-subtle px-1.5 py-0.5 text-ds-caption"
                        >
                            <b className="font-ds-mono font-semibold">
                                {d.value}
                            </b>{' '}
                            {d.unit}
                        </span>
                    ))}
                </div>
                <p className="text-ds-caption text-ds-content-muted">
                    {scheduleOf(e)}
                </p>
                {e.notes && (
                    <p className="text-ds-caption text-ds-content-secondary italic">
                        {e.notes}
                    </p>
                )}
            </div>
        </li>
    );
}

export function ProgramDetailPanel({ program: p }: { program: Program }) {
    const navigate = useNavigate();
    const [video, setVideo] = useState<ProgramExercise | null>(null);
    const panel = programPanel(p);

    return (
        <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <div className="mx-auto flex w-full max-w-(--breakpoint-ds-xl) flex-col gap-5 px-4 py-6 lg:px-8">
                <section className="flex flex-col gap-4 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <PersonAvatar
                                name={p.patientName}
                                photoUrl={p.patientPhotoUrl}
                                size={52}
                            />
                            <div className="min-w-0">
                                <p className="truncate text-ds-body-xs text-ds-content-secondary">
                                    {p.patientName ?? 'Sem paciente (modelo)'}
                                    {p.professionalName &&
                                        ` · com ${p.professionalName}`}
                                </p>
                                <h1 className="text-ds-h4 font-semibold">
                                    {p.title}
                                </h1>
                                <div className="mt-1">
                                    <ProgramStatusBadge program={p} />
                                </div>
                            </div>
                        </div>
                        <DetailActions program={p} />
                    </div>
                    <ValidityBar program={p} />
                    {p.message && (
                        <blockquote className="rounded-ds-md border-l-4 border-ds-primary-60 bg-ds-surface-subtle px-4 py-2.5 text-ds-body-xs text-ds-content-secondary">
                            “{p.message}”
                        </blockquote>
                    )}
                </section>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {panel.stats.map((s) => (
                        <DsKpi
                            key={s.key}
                            label={s.label}
                            value={s.value}
                            icon={STAT_ICON[s.key]}
                        />
                    ))}
                    {panel.isDraft && (
                        <div className="col-span-2 lg:col-span-3">
                            <DsAlert
                                variant="warning"
                                mode="rich"
                                title="Rascunho: o paciente ainda não recebeu"
                                actions={
                                    <DsButton
                                        variant="secondary"
                                        size="sm"
                                        label="Continuar editando"
                                        onClick={() => navigate(editPath(p))}
                                    />
                                }
                            >
                                Termine a edição e envie para o paciente
                                começar.
                            </DsAlert>
                        </div>
                    )}
                </div>

                {p.groups.map((g) => (
                    <section
                        key={g.id}
                        aria-labelledby={`grupo-${g.id}`}
                        className="flex flex-col gap-3"
                    >
                        <h2
                            id={`grupo-${g.id}`}
                            className="flex items-center gap-2 text-ds-body-sm font-semibold"
                        >
                            {g.name}
                            <span className="font-ds-mono text-ds-caption font-normal text-ds-content-muted">
                                {g.exercises.length}
                            </span>
                        </h2>
                        <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {g.exercises.map((e, i) => (
                                <ExerciseCard
                                    key={e.id}
                                    e={e}
                                    index={i}
                                    onPlay={() => setVideo(e)}
                                />
                            ))}
                        </ol>
                    </section>
                ))}
            </div>

            <DsModal
                open={video !== null}
                onOpenChange={(o) => !o && setVideo(null)}
                title={video?.title ?? ''}
                size="md"
            >
                {video?.videoUrl ? (
                    <video
                        src={video.videoUrl}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-[70vh] w-full rounded-ds-md bg-ds-black"
                    />
                ) : (
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        Este exercício não tem vídeo.
                    </p>
                )}
            </DsModal>
        </div>
    );
}
