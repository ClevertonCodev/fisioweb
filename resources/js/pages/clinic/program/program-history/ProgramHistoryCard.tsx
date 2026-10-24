import { Dumbbell } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import {
    exerciseCountLabel,
    formatLong,
    formatShort,
    programPath,
    uiStatusOf,
    validityOf,
    type UiStatus,
} from '@/application/clinic/program-history-filters';
import { DsBadge, DsCard, dsCn, type BadgeVariant } from '@/components/ds';
import type { Program } from '@/domain/clinic';

const STATUS_BADGE: Record<UiStatus, { label: string; variant: BadgeVariant }> =
    {
        not_viewed: { label: 'Não visualizado', variant: 'warning' },
        viewed: { label: 'Visualizado', variant: 'info' },
        completed: { label: 'Completou', variant: 'success' },
        draft: { label: 'Rascunho', variant: 'default' },
    };

const BAR_COLOR: Record<UiStatus, { fill: string; track: string }> = {
    not_viewed: {
        fill: 'bg-[var(--ds-color-warning-content)] ds-dark:bg-ds-status-warning-content',
        track: 'bg-[var(--ds-color-warning-surface)] ds-dark:bg-ds-status-warning-surface',
    },
    viewed: {
        fill: 'bg-[var(--ds-color-info-content)] ds-dark:bg-ds-status-info-content',
        track: 'bg-[var(--ds-color-info-surface)] ds-dark:bg-ds-status-info-surface',
    },
    completed: {
        fill: 'bg-[var(--ds-color-success-content)] ds-dark:bg-ds-status-success-content',
        track: 'bg-[var(--ds-color-success-surface)] ds-dark:bg-ds-status-success-surface',
    },
    draft: {
        fill: 'bg-ds-content-muted',
        track: 'bg-ds-surface-subtle',
    },
};

function initialOf(name: string | null): string {
    return name?.trim()[0]?.toUpperCase() ?? '?';
}

export function PersonAvatar({
    name,
    photoUrl,
    size = 44,
}: {
    name: string | null;
    photoUrl: string | null;
    size?: number;
}) {
    return (
        <span
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-surface-brand-subtle font-semibold text-ds-content-brand ds-dark:text-ds-primary-60"
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.38),
            }}
        >
            {photoUrl ? (
                <img src={photoUrl} alt="" className="size-full object-cover" />
            ) : (
                initialOf(name)
            )}
        </span>
    );
}

export function ProgramStatusBadge({ program }: { program: Program }) {
    const ui = uiStatusOf(program);
    const option = STATUS_BADGE[ui];
    const times =
        ui === 'completed' && program.patientCompletedCount > 0
            ? ` · ${program.patientCompletedCount}x`
            : '';
    return (
        <DsBadge variant={option.variant} dot>
            {option.label}
            {times}
        </DsBadge>
    );
}

export function ValidityBar({ program }: { program: Program }) {
    const v = validityOf(program);
    const ui = uiStatusOf(program);
    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-ds-caption">
                <span className="truncate text-ds-content-secondary">
                    {!program.startDate && !program.endDate
                        ? 'Sem datas definidas'
                        : `${formatShort(program.startDate)} → ${
                              program.endDate
                                  ? formatShort(program.endDate)
                                  : 'sem fim'
                          }`}
                </span>
                <span
                    className={dsCn(
                        'shrink-0 font-medium',
                        v.key === 'ending'
                            ? 'text-ds-status-warning-content'
                            : 'text-ds-content-muted',
                    )}
                >
                    {v.text}
                </span>
            </div>
            <div
                className={dsCn(
                    'h-1.5 overflow-hidden rounded-ds-pill',
                    BAR_COLOR[ui].track,
                )}
            >
                <div
                    className={dsCn(
                        'h-full rounded-ds-pill',
                        BAR_COLOR[ui].fill,
                    )}
                    style={{ width: `${v.key === 'open' ? 0 : v.progress}%` }}
                />
            </div>
        </div>
    );
}

export function ProgramHistoryCard({
    program,
    footer,
}: {
    program: Program;
    footer?: ReactNode;
}) {
    const draft = uiStatusOf(program) === 'draft';
    return (
        <DsCard variant="interactive" className="h-full">
            <div className="flex flex-1 flex-col">
                <div className="flex items-start gap-3">
                    <PersonAvatar
                        name={program.patientName}
                        photoUrl={program.patientPhotoUrl}
                    />
                    <div className="min-w-0 flex-1">
                        <Link
                            to={programPath(program)}
                            className="block truncate text-ds-body-emphasis text-ds-content-primary outline-0 after:absolute after:inset-0 after:rounded-ds-lg after:content-[''] focus-visible:after:shadow-ds-focus"
                        >
                            {program.patientName ?? '(sem paciente)'}
                        </Link>
                        <p className="truncate text-ds-caption text-ds-content-secondary">
                            por {program.professionalName ?? '—'} ·{' '}
                            {formatLong(program.createdAt)}
                        </p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    <ProgramStatusBadge program={program} />
                </div>

                <div
                    className={dsCn(
                        'mt-3 flex flex-1 items-start gap-2.5',
                        draft && 'opacity-60',
                    )}
                >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-ds-md bg-ds-surface-subtle text-ds-content-muted [&_svg]:size-4">
                        <Dumbbell />
                    </span>
                    <div className="min-w-0">
                        <p className="line-clamp-2 min-h-[2lh] text-ds-body-sm font-medium text-ds-content-primary">
                            {program.title}
                        </p>
                        <p className="text-ds-caption text-ds-content-muted">
                            {exerciseCountLabel(program.exerciseCount)}
                        </p>
                    </div>
                </div>

                <div className="mt-4 mb-4">
                    <ValidityBar program={program} />
                </div>
            </div>
            {footer}
        </DsCard>
    );
}

export function ProgramHistoryCardGrid({
    programs,
    renderFooter,
}: {
    programs: Program[];
    renderFooter?: (program: Program) => ReactNode;
}) {
    return (
        <ul
            aria-label="Programas"
            className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
        >
            {programs.map((p) => (
                <li key={p.id}>
                    <ProgramHistoryCard
                        program={p}
                        footer={renderFooter?.(p)}
                    />
                </li>
            ))}
        </ul>
    );
}
