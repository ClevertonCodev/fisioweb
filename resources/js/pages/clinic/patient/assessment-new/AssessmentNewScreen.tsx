/**
 * Prévia B: lista de modelos por área, já aberta no indicado pelo
 * diagnóstico; a prévia é o formulário de verdade para mexer antes de
 * começar. “Responder agora” cria a avaliação vazia e abre a ficha.
 */
import { ArrowLeft, ClipboardList, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DsBadge, DsButton, dsCn, DsInput } from '@/components/ds';

import { FieldTry } from './parts';
import { minutesFor, shortName, type AssessmentPicker } from './shared';

export function AssessmentNewScreen({
    p,
    patientId,
}: {
    p: AssessmentPicker;
    patientId: string;
}) {
    const navigate = useNavigate();
    const sections = [...(p.selected?.sections ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
    );
    const go = (sectionId: number) =>
        document
            .getElementById(`sec-${sectionId}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    return (
        <div className="flex h-full bg-ds-surface-body font-ds text-ds-content-primary">
            <aside
                className={dsCn(
                    'w-full shrink-0 flex-col border-ds-border-subtle bg-ds-surface-default md:flex md:w-80 md:border-r',
                    p.chosen ? 'hidden' : 'flex',
                )}
            >
                <div className="flex flex-col gap-3 border-b border-ds-border-subtle p-4">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(`/clinica/pacientes/${patientId}`)
                        }
                        className="flex w-fit cursor-pointer items-center gap-1.5 text-ds-body-xs text-ds-content-secondary hover:text-ds-content-brand ds-dark:hover:text-ds-primary-60"
                    >
                        <ArrowLeft className="size-4" />
                        {p.patient?.name ?? 'Prontuário'}
                    </button>
                    <h1 className="text-ds-body-lg font-semibold">
                        Nova avaliação
                    </h1>
                    <DsInput
                        size="sm"
                        type="search"
                        aria-label="Procurar modelo"
                        placeholder="Procurar modelo"
                        iconLeft={<Search />}
                        value={p.search}
                        onValueChange={p.setSearch}
                        onCleared={() => p.setSearch('')}
                    />
                </div>
                <nav
                    aria-label="Modelos"
                    className="min-h-0 flex-1 overflow-y-auto py-2"
                >
                    {p.groups.map((g) => (
                        <div key={g.area} className="mb-2">
                            <p className="px-4 py-1.5 text-ds-eyebrow text-ds-content-muted uppercase">
                                {g.area}
                            </p>
                            {g.items.map((t) => {
                                const on = p.selectedId === String(t.id);
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        aria-current={on || undefined}
                                        onClick={() => p.select(t.id)}
                                        className={dsCn(
                                            'relative flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-ds-body-xs transition-colors',
                                            on
                                                ? 'bg-ds-surface-brand-subtle font-medium text-ds-content-brand before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-ds-primary-80 ds-dark:text-ds-primary-60'
                                                : 'hover:bg-ds-surface-subtle',
                                        )}
                                    >
                                        <span className="flex-1">
                                            {shortName(t.name)}
                                        </span>
                                        {p.suggested?.id === t.id && (
                                            <Sparkles className="size-3.5 shrink-0 text-ds-content-brand ds-dark:text-ds-primary-60" />
                                        )}
                                        <span className="font-ds-mono text-ds-micro text-ds-content-muted">
                                            {t.fieldCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </aside>

            <main
                className={dsCn(
                    'min-w-0 flex-1 flex-col md:flex',
                    p.chosen ? 'flex' : 'hidden',
                )}
            >
                <header className="flex flex-wrap items-center gap-3 border-b border-ds-border-subtle bg-ds-surface-default px-4 py-3 sm:px-6">
                    <DsButton
                        variant="tertiary"
                        iconPosition="only"
                        icon={<ArrowLeft />}
                        label="Voltar à lista"
                        className="md:hidden"
                        onClick={() => p.select(null)}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-ds-body-emphasis">
                                {p.selectedSummary?.name ?? '…'}
                            </h2>
                            {p.suggested != null &&
                                p.suggested.id === p.selectedSummary?.id && (
                                    <DsBadge
                                        variant="primary"
                                        icon={<Sparkles />}
                                    >
                                        Indicada pelo diagnóstico
                                    </DsBadge>
                                )}
                        </div>
                        {p.selectedSummary && (
                            <p className="text-ds-caption text-ds-content-muted">
                                {p.selectedSummary.fieldCount} perguntas ·{' '}
                                {minutesFor(p.selectedSummary.fieldCount)} ·
                                prévia: pode mexer à vontade, nada é salvo
                            </p>
                        )}
                    </div>
                    <DsButton
                        iconPosition="left"
                        icon={<ClipboardList />}
                        label={p.creating ? 'Criando...' : 'Responder agora'}
                        disabled={p.creating || !p.selectedId}
                        onClick={() => p.start()}
                    />
                </header>

                <div className="flex min-h-0 flex-1">
                    <div className="min-w-0 flex-1 overflow-y-auto scroll-smooth">
                        <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 sm:p-6">
                            {p.selectedLoading || !p.selected ? (
                                <p className="text-ds-body-sm text-ds-content-muted">
                                    Carregando perguntas…
                                </p>
                            ) : (
                                sections.map((s, si) => (
                                    <section
                                        key={s.id}
                                        id={`sec-${s.id}`}
                                        className="scroll-mt-4 overflow-hidden rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs"
                                    >
                                        <h3 className="flex items-center gap-3 border-b border-ds-border-subtle bg-ds-surface-subtle px-5 py-3 text-ds-body-sm font-semibold">
                                            <span className="flex size-6 items-center justify-center rounded-ds-full bg-ds-surface-brand-subtle font-ds-mono text-ds-caption text-ds-content-brand ds-dark:text-ds-primary-60">
                                                {si + 1}
                                            </span>
                                            {s.title}
                                        </h3>
                                        <div className="flex flex-col gap-5 p-5">
                                            {[...s.fields]
                                                .sort(
                                                    (a, b) =>
                                                        a.sortOrder -
                                                        b.sortOrder,
                                                )
                                                .map((f) => (
                                                    <div
                                                        key={f.id}
                                                        className="flex flex-col gap-2"
                                                    >
                                                        <p className="text-ds-body-xs font-medium">
                                                            {f.label}
                                                            {f.required && (
                                                                <span className="text-ds-content-danger">
                                                                    {' '}
                                                                    *
                                                                </span>
                                                            )}
                                                        </p>
                                                        <FieldTry field={f} />
                                                    </div>
                                                ))}
                                        </div>
                                    </section>
                                ))
                            )}
                        </div>
                    </div>

                    {sections.length > 1 && (
                        <nav
                            aria-label="Seções"
                            className="hidden w-56 shrink-0 overflow-y-auto border-l border-ds-border-subtle bg-ds-surface-default p-4 xl:block"
                        >
                            <p className="mb-2 text-ds-eyebrow text-ds-content-muted uppercase">
                                Seções
                            </p>
                            <ol className="flex flex-col gap-1">
                                {sections.map((s, si) => (
                                    <li key={s.id}>
                                        <button
                                            type="button"
                                            onClick={() => go(s.id)}
                                            className="flex w-full cursor-pointer items-start gap-2 rounded-ds-md px-2 py-1.5 text-left text-ds-caption text-ds-content-secondary hover:bg-ds-surface-subtle hover:text-ds-content-primary"
                                        >
                                            <span className="font-ds-mono text-ds-content-muted">
                                                {si + 1}
                                            </span>
                                            <span className="flex-1">
                                                {s.title}
                                            </span>
                                            <span className="text-ds-content-muted">
                                                {s.fields.length}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    )}
                </div>
            </main>
        </div>
    );
}
