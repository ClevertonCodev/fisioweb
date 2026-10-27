/** PROTÓTIPO A: cartões em grade, o mesmo desenho da lista de pacientes v2. */
import { Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DsCard, dsCn, DsTooltip } from '@/components/ds';

import {
    exerciseCountLabel,
    formatLong,
    PersonAvatar,
    PROGRAM_ACTIONS,
    ProgramActionsMenu,
    programPath,
    ProgramStatusBadge,
    uiStatusOf,
    ValidityBar,
    visibleActions,
    type VariantProps,
} from './shared';

const footerCell =
    'flex h-10 cursor-pointer items-center justify-center text-ds-content-secondary transition-colors hover:bg-ds-surface-brand-subtle hover:text-ds-content-brand focus-visible:shadow-ds-focus focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ds-dark:hover:text-ds-primary-60 [&_svg]:size-4';

/** As três primeiras ações viram atalho no rodapé; o resto vai para o "…". */
const SHORTCUTS = PROGRAM_ACTIONS.filter((a) =>
    (['link', 'pdf', 'text'] as const).includes(
        a.key as 'link' | 'pdf' | 'text',
    ),
);

export function VariantA({ programs, onAction }: VariantProps) {
    return (
        <ul
            aria-label="Programas"
            className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
        >
            {programs.map((p) => {
                const draft = uiStatusOf(p) === 'draft';
                const allowed = visibleActions(p).map((a) => a.key);
                return (
                    <li key={p.id}>
                        <DsCard variant="interactive" className="h-full">
                            <div className="flex flex-1 flex-col">
                                <div className="flex items-start gap-3">
                                    <PersonAvatar
                                        name={p.patientName}
                                        photoUrl={p.patientPhotoUrl}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            to={programPath(p)}
                                            className="block truncate text-ds-body-emphasis text-ds-content-primary outline-0 after:absolute after:inset-0 after:rounded-ds-lg after:content-[''] focus-visible:after:shadow-ds-focus"
                                        >
                                            {p.patientName ?? '(sem paciente)'}
                                        </Link>
                                        <p className="truncate text-ds-caption text-ds-content-secondary">
                                            por {p.professionalName ?? '—'} ·{' '}
                                            {formatLong(p.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <ProgramStatusBadge program={p} />
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
                                            {p.title}
                                        </p>
                                        <p className="text-ds-caption text-ds-content-muted">
                                            {exerciseCountLabel(
                                                p.exerciseCount,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 mb-4">
                                    <ValidityBar program={p} compact />
                                </div>
                            </div>

                            <div className="relative z-10 -mx-5 -mb-5 grid grid-cols-4 divide-x divide-ds-border-subtle border-t border-ds-border-subtle">
                                {SHORTCUTS.map((a) => {
                                    const disabled = !allowed.includes(a.key);
                                    return (
                                        <DsTooltip
                                            key={a.key}
                                            content={
                                                disabled
                                                    ? `${a.label} (programa sem paciente)`
                                                    : a.label
                                            }
                                            asChild
                                        >
                                            <button
                                                type="button"
                                                aria-label={a.label}
                                                disabled={disabled}
                                                onClick={() =>
                                                    onAction(a.key, p)
                                                }
                                                className={footerCell}
                                            >
                                                {a.icon}
                                            </button>
                                        </DsTooltip>
                                    );
                                })}
                                <div className="flex items-center justify-center">
                                    <ProgramActionsMenu
                                        program={p}
                                        onAction={onAction}
                                        exclude={['link', 'pdf', 'text']}
                                    />
                                </div>
                            </div>
                        </DsCard>
                    </li>
                );
            })}
        </ul>
    );
}
