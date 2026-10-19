/**
 * PROTÓTIPO A, "Painel do programa": no topo, o paciente, o status e a
 * validade em barra; uma faixa de números (exercícios, dias que faltam,
 * vezes que completou, quando abriu); embaixo, os blocos com cada
 * exercício em cartão, a dose em pedaços e o vídeo a um toque.
 */
import { CalendarClock, CheckCircle2, Dumbbell, Eye, Play } from 'lucide-react';
import { useState } from 'react';

import { DsKpi, DsModal } from '@/components/ds';
import type { Program, ProgramExercise } from '@/domain/clinic';
import {
    PersonAvatar,
    ProgramStatusBadge,
    ValidityBar,
    validityOf,
} from '@/pages/clinic/program/program-history-prototype/shared';

import { DetailActions, doseParts, scheduleOf, Thumb } from './shared';

export function VariantA({ program: p }: { program: Program }) {
    const [video, setVideo] = useState<ProgramExercise | null>(null);
    const v = validityOf(p);
    const total = p.groups.reduce((n, g) => n + g.exercises.length, 0);

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
                    <DsKpi
                        label="Exercícios"
                        value={String(total)}
                        icon={<Dumbbell />}
                    />
                    <DsKpi
                        label={
                            v.daysLeft != null && v.daysLeft < 0
                                ? 'Terminou há'
                                : 'Faltam'
                        }
                        value={
                            v.daysLeft == null
                                ? 'Sem fim'
                                : `${Math.abs(v.daysLeft)} dias`
                        }
                        icon={<CalendarClock />}
                    />
                    <DsKpi
                        label="Vezes que completou"
                        value={String(p.patientCompletedCount)}
                        icon={<CheckCircle2 />}
                    />
                    <DsKpi
                        label="Paciente abriu"
                        value={
                            p.patientViewedAt
                                ? new Date(
                                      p.patientViewedAt,
                                  ).toLocaleDateString('pt-BR')
                                : 'Ainda não'
                        }
                        icon={<Eye />}
                    />
                </div>

                {p.groups.map((g) => (
                    <section key={g.id} className="flex flex-col gap-3">
                        <h2 className="flex items-center gap-2 text-ds-body-sm font-semibold">
                            {g.name}
                            <span className="font-ds-mono text-ds-caption font-normal text-ds-content-muted">
                                {g.exercises.length}
                            </span>
                        </h2>
                        <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {g.exercises.map((e, i) => (
                                <li
                                    key={e.id}
                                    className="flex min-w-0 gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs"
                                >
                                    <button
                                        type="button"
                                        aria-label={`Ver vídeo de ${e.title}`}
                                        onClick={() => setVideo(e)}
                                        className="group relative cursor-pointer"
                                    >
                                        <Thumb e={e} className="size-20" />
                                        <span className="absolute inset-0 flex items-center justify-center rounded-ds-md bg-ds-black/25 opacity-80 group-hover:opacity-100">
                                            <Play className="size-6 fill-ds-white text-ds-white" />
                                        </span>
                                    </button>
                                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                        <p className="text-ds-body-xs font-medium">
                                            <span className="mr-1.5 font-ds-mono text-ds-content-muted">
                                                {i + 1}.
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
                                            {scheduleOf(e) ?? 'Todos os dias'}
                                        </p>
                                        {e.notes && (
                                            <p className="text-ds-caption text-ds-content-secondary italic">
                                                {e.notes}
                                            </p>
                                        )}
                                    </div>
                                </li>
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
