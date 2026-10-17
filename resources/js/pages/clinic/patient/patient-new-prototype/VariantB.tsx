import { Check, CircleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DsButton, dsCn } from '@/components/ds';

import {
    firstSectionWithError,
    PageHeader,
    REQUIRED_FIELDS,
    SECTION_FIELDS,
    sectionErrorCount,
    SectionFields,
    SECTIONS,
    SectionTitle,
    type PrototypeState,
    type SectionKey,
} from './shared';

const sectionId = (key: SectionKey) => `secao-${key}`;

// Rola só o contêiner da tela v2 (scrollIntoView rolaria o layout inteiro).
function scrollTo(key: SectionKey) {
    const el = document.getElementById(sectionId(key));
    const box = el?.closest<HTMLElement>('[data-prototype-variant]');
    if (!el || !box) return;
    const top =
        el.getBoundingClientRect().top -
        box.getBoundingClientRect().top +
        box.scrollTop -
        24;
    box.scrollTo({ top, behavior: 'smooth' });
}

/**
 * B — Página única + índice: todas as seções em cartões, uma embaixo da
 * outra; à esquerda, um índice fixo que marca onde você está, o que tem erro
 * e o que já está completo. Rodapé com o progresso dos obrigatórios.
 */
export function VariantB({ state }: { state: PrototypeState }) {
    const { form } = state;
    const { errors } = form.formState;
    const values = form.watch();
    const [active, setActive] = useState<SectionKey>('identificacao');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((e) => e.isIntersecting);
                if (visible) {
                    setActive(
                        visible.target.id.replace('secao-', '') as SectionKey,
                    );
                }
            },
            { rootMargin: '-20% 0px -70% 0px' },
        );
        SECTIONS.forEach((s) => {
            const el = document.getElementById(sectionId(s.key));
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    const requiredDone = REQUIRED_FIELDS.filter(
        (f) => String(values[f] ?? '').trim() !== '' && !errors[f],
    ).length;

    const sectionComplete = (key: SectionKey) => {
        const fields = SECTION_FIELDS[key];
        const required = fields.filter((f) => REQUIRED_FIELDS.includes(f));
        const anyFilled = fields.some((f) => {
            const v = values[f];
            return typeof v === 'string' ? v.trim() !== '' : v === true;
        });
        return required.length > 0
            ? required.every((f) => String(values[f] ?? '').trim() !== '')
            : anyFilled;
    };

    const onSubmit = state.submit((errs) => {
        const first = firstSectionWithError(errs);
        if (first) scrollTo(first);
    });

    return (
        <form
            noValidate
            onSubmit={onSubmit}
            className="flex min-h-full flex-col"
        >
            <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
                <div className="mx-auto flex max-w-6xl flex-col gap-6">
                    <PageHeader state={state} />
                    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                        <nav
                            aria-label="Seções do cadastro"
                            className="hidden lg:block"
                        >
                            <ol className="sticky top-6 flex flex-col gap-1">
                                {SECTIONS.map((s) => {
                                    const errorCount = sectionErrorCount(
                                        s.key,
                                        errors,
                                    );
                                    const done =
                                        errorCount === 0 &&
                                        sectionComplete(s.key);
                                    return (
                                        <li key={s.key}>
                                            <button
                                                type="button"
                                                onClick={() => scrollTo(s.key)}
                                                aria-current={
                                                    active === s.key
                                                        ? 'location'
                                                        : undefined
                                                }
                                                className={dsCn(
                                                    'flex w-full cursor-pointer items-center gap-3 rounded-ds-md px-3 py-2.5 text-left transition-colors hover:bg-ds-surface-subtle focus-visible:shadow-ds-focus focus-visible:outline-0',
                                                    active === s.key &&
                                                        'bg-ds-surface-brand-subtle hover:bg-ds-surface-brand-subtle',
                                                )}
                                            >
                                                <span
                                                    className={dsCn(
                                                        'flex size-6 shrink-0 items-center justify-center rounded-ds-full border text-ds-caption',
                                                        errorCount > 0
                                                            ? 'border-ds-status-danger-border bg-ds-status-danger-surface text-ds-status-danger-content'
                                                            : done
                                                              ? 'border-ds-status-success-border bg-ds-status-success-surface text-ds-status-success-content'
                                                              : 'border-ds-border-default text-ds-content-muted',
                                                    )}
                                                >
                                                    {errorCount > 0 ? (
                                                        <CircleAlert className="size-3.5" />
                                                    ) : done ? (
                                                        <Check className="size-3.5" />
                                                    ) : null}
                                                </span>
                                                <span className="min-w-0">
                                                    <span
                                                        className={dsCn(
                                                            'block text-ds-body-xs font-medium',
                                                            active === s.key
                                                                ? 'text-ds-content-brand ds-dark:text-ds-primary-60'
                                                                : 'text-ds-content-secondary',
                                                        )}
                                                    >
                                                        {s.label}
                                                    </span>
                                                    <span className="block truncate text-ds-caption text-ds-content-muted">
                                                        {errorCount > 0
                                                            ? `${errorCount} ${errorCount === 1 ? 'campo' : 'campos'} com erro`
                                                            : s.hint}
                                                    </span>
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                        <div className="flex min-w-0 flex-col gap-6">
                            {SECTIONS.map((s) => (
                                <section
                                    key={s.key}
                                    id={sectionId(s.key)}
                                    aria-label={s.label}
                                    className="@container scroll-mt-6 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs sm:p-7"
                                >
                                    <SectionTitle
                                        title={s.label}
                                        description={s.hint}
                                    />
                                    <SectionFields
                                        section={s.key}
                                        state={state}
                                    />
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <footer className="sticky bottom-0 border-t border-ds-border-subtle bg-ds-surface-default px-4 py-3 sm:px-6">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
                    <div className="mr-auto flex min-w-48 items-center gap-3">
                        <div className="h-1.5 w-28 overflow-hidden rounded-ds-pill bg-ds-surface-subtle">
                            <div
                                className="h-full rounded-ds-pill bg-ds-primary-80 transition-[width] ds-dark:bg-ds-primary-60"
                                style={{
                                    width: `${(requiredDone / REQUIRED_FIELDS.length) * 100}%`,
                                }}
                            />
                        </div>
                        <span className="text-ds-caption text-ds-content-muted">
                            {requiredDone} de {REQUIRED_FIELDS.length}{' '}
                            obrigatórios
                        </span>
                    </div>
                    <DsButton
                        variant="tertiary"
                        label="Cancelar"
                        onClick={state.cancel}
                    />
                    <DsButton type="submit" label="Cadastrar paciente" />
                </div>
            </footer>
        </form>
    );
}
