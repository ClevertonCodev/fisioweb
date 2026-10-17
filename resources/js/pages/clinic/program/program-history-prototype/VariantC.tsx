/**
 * PROTÓTIPO C: linha do tempo. Os programas agrupados pelo mês em que foram
 * criados, cada um numa linha larga com a data à esquerda.
 */
import { Dumbbell, FileDown, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DsButton, dsCn } from '@/components/ds';
import type { Program } from '@/domain/clinic';

import {
    exerciseCountLabel,
    parseDate,
    PersonAvatar,
    ProgramActionsMenu,
    programPath,
    ProgramStatusBadge,
    uiStatusOf,
    ValidityBar,
    type UiStatus,
    type VariantProps,
} from './shared';

const DOT: Record<UiStatus, string> = {
    not_viewed: 'bg-ds-status-warning-content',
    viewed: 'bg-ds-status-info-content',
    completed: 'bg-ds-status-success-content',
    draft: 'bg-ds-content-subtle',
};

function monthKey(date: Date | null): string {
    if (!date) return 'sem-data';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthTitle(date: Date | null): string {
    if (!date) return 'Sem data';
    const text = date.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function groupByMonth(programs: Program[]) {
    const groups: { key: string; title: string; items: Program[] }[] = [];
    for (const p of programs) {
        const date = parseDate(p.createdAt);
        const key = monthKey(date);
        let group = groups.find((g) => g.key === key);
        if (!group) {
            group = { key, title: monthTitle(date), items: [] };
            groups.push(group);
        }
        group.items.push(p);
    }
    return groups;
}

export function VariantC({ programs, onAction }: VariantProps) {
    const groups = groupByMonth(programs);
    return (
        <div className="flex flex-col gap-8">
            {groups.map((group) => (
                <section key={group.key} aria-label={group.title}>
                    <h2 className="mb-3 flex items-baseline gap-2 text-ds-body-md font-semibold text-ds-content-primary">
                        {group.title}
                        <span className="text-ds-caption font-normal text-ds-content-muted">
                            {group.items.length}{' '}
                            {group.items.length === 1
                                ? 'programa'
                                : 'programas'}
                        </span>
                    </h2>
                    <ol className="relative flex flex-col gap-3 border-l border-ds-border-subtle pl-6 sm:ml-16">
                        {group.items.map((p) => {
                            const created = parseDate(p.createdAt);
                            const status = uiStatusOf(p);
                            return (
                                <li key={p.id} className="relative">
                                    {/* Data na margem (some no celular). */}
                                    <div className="absolute top-4 -left-[5.5rem] hidden w-14 text-right sm:block">
                                        <p className="text-ds-body-md leading-none font-semibold text-ds-content-primary">
                                            {created?.getDate() ?? '—'}
                                        </p>
                                        <p className="mt-1 text-ds-caption text-ds-content-muted capitalize">
                                            {created
                                                ?.toLocaleDateString('pt-BR', {
                                                    weekday: 'short',
                                                })
                                                .replace('.', '')}
                                        </p>
                                    </div>
                                    <span
                                        aria-hidden="true"
                                        className={dsCn(
                                            'absolute top-5 -left-[1.85rem] size-2.5 rounded-ds-full ring-4 ring-ds-surface-body',
                                            DOT[status],
                                        )}
                                    />
                                    <article className="relative grid gap-4 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs transition-[border-color,box-shadow] hover:border-ds-primary-40 hover:shadow-ds-md md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_17rem] md:items-center ds-dark:hover:border-ds-primary-60">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <PersonAvatar
                                                name={p.patientName}
                                                photoUrl={p.patientPhotoUrl}
                                                size={40}
                                            />
                                            <div className="min-w-0">
                                                <Link
                                                    to={programPath(p)}
                                                    className="block truncate text-ds-body-emphasis text-ds-content-primary outline-0 after:absolute after:inset-0 after:rounded-ds-lg after:content-[''] focus-visible:after:shadow-ds-focus"
                                                >
                                                    {p.patientName ??
                                                        '(sem paciente)'}
                                                </Link>
                                                <p className="flex items-center gap-1.5 truncate text-ds-caption text-ds-content-secondary [&_svg]:size-3.5 [&_svg]:shrink-0">
                                                    <Dumbbell />
                                                    <span className="truncate">
                                                        {p.title} ·{' '}
                                                        {exerciseCountLabel(
                                                            p.exerciseCount,
                                                        )}
                                                    </span>
                                                </p>
                                                <p className="truncate text-ds-caption text-ds-content-muted">
                                                    por{' '}
                                                    {p.professionalName ?? '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <ValidityBar program={p} />
                                        <div className="relative z-10 flex items-center justify-between gap-2 md:justify-end">
                                            <ProgramStatusBadge program={p} />
                                            <div className="flex items-center gap-1">
                                                {p.patientId && (
                                                    <DsButton
                                                        variant="tertiary"
                                                        size="sm"
                                                        iconPosition="only"
                                                        icon={<Link2 />}
                                                        label="Copiar link do programa"
                                                        onClick={() =>
                                                            onAction('link', p)
                                                        }
                                                    />
                                                )}
                                                <DsButton
                                                    variant="tertiary"
                                                    size="sm"
                                                    iconPosition="only"
                                                    icon={<FileDown />}
                                                    label="Baixar PDF"
                                                    onClick={() =>
                                                        onAction('pdf', p)
                                                    }
                                                />
                                                <ProgramActionsMenu
                                                    program={p}
                                                    onAction={onAction}
                                                    exclude={['link', 'pdf']}
                                                />
                                            </div>
                                        </div>
                                    </article>
                                </li>
                            );
                        })}
                    </ol>
                </section>
            ))}
        </div>
    );
}
