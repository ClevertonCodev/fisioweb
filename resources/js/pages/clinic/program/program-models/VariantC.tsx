/**
 * Mapa do corpo da listagem de modelos: clicar na região recorta a lista.
 * A região ainda sai do título e da descrição (`regionsOf`).
 */
import { ChevronDown, Footprints, Stethoscope, X } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

import { DsBadge, DsButton, dsCn, DsTooltip } from '@/components/ds';
import { useInView } from '@/pages/clinic/use-in-view';

import {
    exercisesOf,
    formatDate,
    REGIONS,
    regionsOf,
    useModelDetail,
    type ModelDetail,
    type ModelSummary,
    type Region,
} from './data';
import {
    GroupSections,
    ModelActionsMenu,
    useModelActions,
    UseModelButton,
} from './parts';

export interface VariantProps {
    models: ModelSummary[];
    isLoading: boolean;
    emptyState: ReactNode;
}

// ---------------------------------------------------------------- corpo

/** Pontos sobre a silhueta, no sistema do viewBox (200 × 440). */
const SPOTS: { region: Region; x: number; y: number }[] = [
    { region: 'cervical', x: 100, y: 70 },
    { region: 'ombro', x: 62, y: 88 },
    { region: 'ombro', x: 138, y: 88 },
    { region: 'lombar', x: 100, y: 176 },
    { region: 'quadril', x: 100, y: 222 },
    { region: 'joelho', x: 84, y: 326 },
    { region: 'joelho', x: 116, y: 326 },
    { region: 'tornozelo', x: 82, y: 402 },
    { region: 'tornozelo', x: 118, y: 402 },
];

const LABEL = Object.fromEntries(
    REGIONS.map((r) => [r.key, r.label]),
) as Record<Region, string>;

function Silhouette() {
    // Formas simples e simétricas: o espelho do lado esquerdo é 200 - x.
    const arm =
        'M60 84 Q42 90 38 128 L31 208 Q30 222 40 222 Q47 220 48 208 L56 140 Z';
    const leg =
        'M70 226 L98 226 L97 330 L93 408 Q92 424 78 424 Q68 423 72 408 L72 330 Z';
    return (
        <svg
            viewBox="0 0 200 440"
            aria-hidden
            className="size-full fill-ds-primary-20 stroke-ds-primary-40 [stroke-width:1.5] ds-dark:fill-ds-surface-subtle ds-dark:stroke-ds-border-default"
        >
            <circle cx="100" cy="38" r="25" />
            <rect x="90" y="60" width="20" height="18" rx="6" />
            <path d="M60 82 Q100 70 140 82 L146 150 Q141 196 134 228 L66 228 Q59 196 54 150 Z" />
            <path d={arm} />
            <path d={arm} transform="translate(200 0) scale(-1 1)" />
            <path d={leg} />
            <path d={leg} transform="translate(200 0) scale(-1 1)" />
        </svg>
    );
}

function BodyMap({
    counts,
    value,
    onChange,
}: {
    counts: Record<Region, number>;
    value: Region | null;
    onChange: (r: Region | null) => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5">
            <div className="relative aspect-[200/440] w-40 sm:w-48">
                <Silhouette />
                {SPOTS.map((s, i) => {
                    const count = counts[s.region];
                    const active = value === s.region;
                    return (
                        <DsTooltip
                            key={i}
                            content={`${LABEL[s.region]} · ${count} ${count === 1 ? 'modelo' : 'modelos'}`}
                            asChild
                        >
                            <button
                                type="button"
                                disabled={count === 0}
                                aria-pressed={active}
                                aria-label={`${LABEL[s.region]}: ${count} modelos`}
                                onClick={() =>
                                    onChange(active ? null : s.region)
                                }
                                style={{
                                    left: `${(s.x / 200) * 100}%`,
                                    top: `${(s.y / 440) * 100}%`,
                                }}
                                className={dsCn(
                                    'absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-ds-full font-ds-mono text-[11px] font-semibold outline-0 transition-[transform,background] focus-visible:shadow-ds-focus',
                                    count === 0
                                        ? 'size-2.5 bg-ds-gray-30'
                                        : 'size-7 cursor-pointer hover:scale-110',
                                    count > 0 &&
                                        (active
                                            ? 'bg-ds-primary-80 text-white ring-4 ring-ds-primary-80/25 ds-dark:bg-ds-primary-70'
                                            : 'border-2 border-ds-primary-80 bg-ds-surface-default text-ds-content-brand ds-dark:border-ds-primary-60 ds-dark:text-ds-primary-60'),
                                )}
                            >
                                {count > 0 && count}
                                {count > 0 && !value && (
                                    <span className="absolute inset-0 animate-ping rounded-ds-full bg-ds-primary-80/30" />
                                )}
                            </button>
                        </DsTooltip>
                    );
                })}
            </div>

            {/* As regiões também em lista: equilíbrio não tem lugar no corpo. */}
            <div className="flex flex-wrap justify-center gap-2">
                {REGIONS.map((r) => {
                    const count = counts[r.key];
                    const active = value === r.key;
                    return (
                        <button
                            key={r.key}
                            type="button"
                            disabled={count === 0}
                            aria-pressed={active}
                            onClick={() => onChange(active ? null : r.key)}
                            className={dsCn(
                                'flex h-8 cursor-pointer items-center gap-1.5 rounded-ds-full border px-3 text-ds-caption font-medium outline-0 transition-colors focus-visible:shadow-ds-focus disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-3.5',
                                active
                                    ? 'border-ds-primary-80 bg-ds-primary-80 text-white ds-dark:bg-ds-primary-70'
                                    : 'border-ds-border-default bg-ds-surface-default text-ds-content-secondary hover:border-ds-primary-40',
                            )}
                        >
                            {r.key === 'equilibrio' && <Footprints />}
                            {r.label}
                            <span className="font-ds-mono opacity-70">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- sessão

const SEGMENT = [
    'bg-ds-primary-80 text-white ds-dark:bg-ds-primary-70',
    'bg-ds-primary-30 text-ds-primary-120',
    'bg-ds-primary-50 text-ds-primary-120',
    'bg-ds-primary-20 text-ds-primary-120',
];

/** A sessão numa barra: um pedaço por bloco, do tamanho dele. */
function SessionBar({
    model,
    detail,
    isError,
}: {
    model: ModelSummary;
    detail: ModelDetail | null;
    isError: boolean;
}) {
    if (!detail && !isError) {
        return (
            <div className="h-9 animate-pulse rounded-ds-md bg-ds-surface-subtle" />
        );
    }
    const groups = detail?.groups.filter((g) => g.exercises.length > 0) ?? [];
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex h-9 gap-0.5 overflow-hidden rounded-ds-md">
                {isError && (
                    <span className="flex flex-1 items-center rounded-ds-md bg-ds-surface-subtle px-2.5 text-ds-caption text-ds-content-muted">
                        Não foi possível carregar os blocos
                    </span>
                )}
                {groups.map((g, i) => (
                    <span
                        key={g.id}
                        title={`${g.name}: ${g.exercises.length}`}
                        style={{ flexGrow: g.exercises.length }}
                        className={dsCn(
                            'flex min-w-0 basis-0 items-center px-2.5 text-ds-caption font-medium',
                            SEGMENT[i % SEGMENT.length],
                        )}
                    >
                        <span className="truncate">
                            {g.name} · {g.exercises.length}
                        </span>
                    </span>
                ))}
            </div>
            <p className="flex justify-between font-ds-mono text-[11px] text-ds-content-muted">
                <span>início</span>
                <span>
                    {model.durationMinutes
                        ? `${model.durationMinutes} min`
                        : `${model.exerciseCount} exercícios`}
                </span>
            </p>
        </div>
    );
}

function SessionCard({ model }: { model: ModelSummary }) {
    const { run, deleteModal } = useModelActions();
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref);
    const [open, setOpen] = useState(false);
    // A listagem não traz os grupos: o detalhe só vem quando o cartão aparece.
    const { detail, isError } = useModelDetail(model, inView || open);
    const thumbs = exercisesOf(detail);
    const regions = regionsOf(model);
    // A aba já diz de onde veio; o cartão fica com o que ajuda a escolher.
    const facts = [
        regions.length > 0 &&
            `Trabalha: ${regions.map((r) => LABEL[r]).join(', ')}`,
        model.origin === 'meus' &&
            [
                model.author && `Salvo por ${model.author}`,
                formatDate(model.createdAt) &&
                    `em ${formatDate(model.createdAt)}`,
            ]
                .filter(Boolean)
                .join(' '),
    ].filter(Boolean);
    return (
        <article
            ref={ref}
            className="flex flex-col gap-4 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs sm:p-5"
        >
            <div className="flex items-start gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {model.area && (
                        <div>
                            <DsBadge variant="info" icon={<Stethoscope />}>
                                {model.area}
                            </DsBadge>
                        </div>
                    )}
                    <h3 className="text-ds-body-md font-semibold text-ds-content-primary">
                        {model.title}
                    </h3>
                    {model.description && (
                        <p className="line-clamp-2 text-ds-body-xs text-ds-content-secondary">
                            {model.description}
                        </p>
                    )}
                    {facts.length > 0 && (
                        <p className="text-ds-caption text-ds-content-muted">
                            {facts.join(' · ')}
                        </p>
                    )}
                </div>
                <div className="hidden items-center gap-1 sm:flex">
                    <UseModelButton model={model} size="sm" />
                    <ModelActionsMenu model={model} onAction={run} />
                </div>
            </div>

            <SessionBar model={model} detail={detail} isError={isError} />

            <div className="flex items-center gap-3">
                <ul className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
                    {thumbs.slice(0, 8).map((e) => (
                        <li key={e.id} className="shrink-0">
                            <img
                                src={e.thumbnailUrl}
                                alt={e.title}
                                title={e.title}
                                className="size-11 rounded-ds-md object-cover"
                            />
                        </li>
                    ))}
                </ul>
                <DsButton
                    variant="tertiary"
                    size="sm"
                    iconPosition="right"
                    icon={
                        <ChevronDown
                            className={dsCn(
                                'transition-transform',
                                open && 'rotate-180',
                            )}
                        />
                    }
                    label={open ? 'Fechar' : 'Ver exercícios'}
                    onClick={() => setOpen((o) => !o)}
                />
            </div>

            {open && (
                <div className="border-t border-ds-border-subtle pt-4">
                    {detail ? (
                        <GroupSections groups={detail.groups} />
                    ) : isError ? (
                        <p className="text-ds-body-sm text-ds-content-muted">
                            Não foi possível carregar os exercícios.
                        </p>
                    ) : (
                        <div className="h-24 animate-pulse rounded-ds-md bg-ds-surface-subtle" />
                    )}
                </div>
            )}

            <div className="flex items-center gap-2 sm:hidden">
                <div className="flex-1">
                    <UseModelButton model={model} size="full" />
                </div>
                <ModelActionsMenu model={model} onAction={run} />
            </div>
            {deleteModal}
        </article>
    );
}

// ---------------------------------------------------------------- variante

export function VariantC({ models, isLoading, emptyState }: VariantProps) {
    const [region, setRegion] = useState<Region | null>(null);
    const resultsRef = useRef<HTMLElement>(null);
    // Sem o mapa ao lado (celular, tablet), descer até os modelos.
    const pick = (r: Region | null) => {
        setRegion(r);
        if (r && !window.matchMedia('(min-width: 1024px)').matches) {
            resultsRef.current?.scrollIntoView?.({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    const counts = Object.fromEntries(
        REGIONS.map((r) => [
            r.key,
            models.filter((m) => regionsOf(m).includes(r.key)).length,
        ]),
    ) as Record<Region, number>;
    // A região some se os filtros de cima zerarem ela.
    const active = region && counts[region] > 0 ? region : null;
    const shown = active
        ? models.filter((m) => regionsOf(m).includes(active))
        : models;

    return (
        <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
            <aside
                aria-label="Mapa do corpo"
                className="flex flex-col gap-4 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs lg:sticky lg:top-6"
            >
                <div>
                    <p className="text-ds-caption font-semibold tracking-[0.06em] text-ds-content-muted uppercase">
                        Comece pela queixa
                    </p>
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        Toque onde o paciente sente para ver os modelos.
                    </p>
                </div>
                <BodyMap counts={counts} value={active} onChange={pick} />
            </aside>

            <section
                ref={resultsRef}
                aria-label="Modelos"
                className="flex scroll-mt-4 flex-col gap-4"
            >
                <header className="flex min-h-9 items-center gap-2">
                    <h2 className="text-ds-body-md font-semibold text-ds-content-primary">
                        {active ? LABEL[active] : 'Todas as regiões'}
                    </h2>
                    <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                        {shown.length}
                    </span>
                    {active && (
                        <div className="ml-auto">
                            <DsButton
                                variant="tertiary"
                                size="sm"
                                iconPosition="left"
                                icon={<X />}
                                label="Ver todas"
                                onClick={() => setRegion(null)}
                            />
                        </div>
                    )}
                </header>
                {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                          <div
                              key={i}
                              className="h-56 animate-pulse rounded-ds-xl bg-ds-surface-subtle"
                          />
                      ))
                    : emptyState
                      ? emptyState
                      : shown.map((m) => <SessionCard key={m.key} model={m} />)}
            </section>
        </div>
    );
}
