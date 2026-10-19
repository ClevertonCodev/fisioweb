/**
 * PROTÓTIPO (descartável): a lateral "Seu programa" da etapa de escolher
 * (SelectedExercisesList da v1 no DS). Os grupos aparecem desde o começo;
 * tocar no grupo faz dele o que recebe os próximos exercícios marcados.
 */
import { CircleDot, MousePointerClick, Plus, X } from 'lucide-react';

import { DsButton, dsCn } from '@/components/ds';

import { exerciseCount, type ProgramBuilder } from './builder';

export function ProgramTray({ builder }: { builder: ProgramBuilder }) {
    const { groups, target, total } = builder;
    return (
        <div className="flex flex-col gap-3">
            {total === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-ds-lg border border-dashed border-ds-border-default px-4 py-6 text-center">
                    <MousePointerClick className="size-6 text-ds-content-subtle" />
                    <p className="text-ds-body-xs text-ds-content-secondary">
                        Toque no <strong>+</strong> dos vídeos para montar o
                        programa.
                    </p>
                </div>
            )}
            {groups.map((g) => {
                const active = target?.id === g.id;
                return (
                    <section
                        key={g.id}
                        aria-label={g.name}
                        className={dsCn(
                            'rounded-ds-lg border transition-colors',
                            active
                                ? 'border-ds-primary-60 bg-ds-surface-brand-subtle/50'
                                : 'border-ds-border-subtle',
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => builder.setTargetId(g.id)}
                            aria-pressed={active}
                            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left outline-0 focus-visible:rounded-ds-lg focus-visible:shadow-ds-focus"
                        >
                            <CircleDot
                                className={dsCn(
                                    'size-4 shrink-0',
                                    active
                                        ? 'text-ds-content-brand ds-dark:text-ds-primary-60'
                                        : 'text-ds-content-subtle',
                                )}
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-ds-body-xs font-semibold text-ds-content-primary">
                                    {g.name || 'Sem nome'}
                                </span>
                                <span className="block text-ds-caption text-ds-content-muted">
                                    {active
                                        ? 'Recebe os próximos que você marcar'
                                        : 'Toque para adicionar aqui'}
                                </span>
                            </span>
                            <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                                {g.exercises.length}
                            </span>
                        </button>
                        {g.exercises.length > 0 && (
                            <ul className="flex flex-col gap-1 px-2 pb-2">
                                {g.exercises.map((e) => (
                                    <li
                                        key={e.id}
                                        className="flex items-center gap-2.5 rounded-ds-md bg-ds-surface-default p-1.5"
                                    >
                                        <img
                                            src={e.thumbnailUrl}
                                            alt=""
                                            className="size-10 shrink-0 rounded-ds-sm object-cover"
                                        />
                                        <span className="line-clamp-2 min-w-0 flex-1 text-ds-caption font-medium text-ds-content-primary">
                                            {e.title}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                builder.removeExercise(
                                                    g.id,
                                                    e.id,
                                                )
                                            }
                                            aria-label={`Tirar ${e.title}`}
                                            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-ds-full text-ds-content-muted outline-0 hover:bg-ds-surface-subtle hover:text-ds-content-danger focus-visible:shadow-ds-focus [&_svg]:size-3.5"
                                        >
                                            <X />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                );
            })}
            <DsButton
                variant="tertiary"
                size="sm"
                iconPosition="left"
                icon={<Plus />}
                label="Novo grupo"
                onClick={() => builder.addGroup()}
            />
            <p className="sr-only" aria-live="polite">
                {exerciseCount(total)} no programa
            </p>
        </div>
    );
}
