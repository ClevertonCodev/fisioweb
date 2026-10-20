/**
 * PROTÓTIPO (descartável): o assistente de programa no DS v2, na rota real
 * /clinica/programas/novo (criar, "Usar modelo", copiar e editar chegam
 * todos aqui pela navegação, como na v1). ?variant=O mostra a v1; A (a
 * escolhida) tem três etapas: Exercícios → Montar e dosar → Paciente e
 * envio. A B (biblioteca e programa lado a lado) foi descartada sem commit.
 *
 * Escolher exercícios usa a biblioteca da aba Exercícios (VariantD) em modo
 * seleção. Sem rascunho automático (a v1 salva no servidor; aqui não, para
 * não sobrescrever o rascunho real) e o salvar é simulado.
 */
import { ArrowLeft, ArrowRight, ChevronUp, Layers, Plus } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    DsButton,
    DsDrawer,
    DsDropdown,
    DsEmptyState,
    DsSteps,
} from '@/components/ds';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';
import {
    activeFilterCount,
    applyFilters,
    INITIAL_FILTERS,
    useExerciseLibrary,
    type LibraryFilters,
} from '@/pages/clinic/program/exercise-library-prototype/shared';
import { useIsMobile } from '@/pages/clinic/program/exercise-library-prototype/use-media-query';
import { VariantD as ExerciseLibrary } from '@/pages/clinic/program/exercise-library-prototype/VariantD';

import {
    exerciseCount,
    fromIncoming,
    useProgramBuilder,
    type ProgramBuilder,
} from './builder';
import { DetailsStep } from './DetailsStep';
import { DoseDrawer } from './DoseDrawer';
import { GroupBoard } from './GroupBoard';
import { ProgramTray } from './ProgramTray';
import { BUILDER_VARIANTS } from './variants';

const STEPS = [
    { label: 'Exercícios' },
    { label: 'Montar e dosar' },
    { label: 'Paciente e envio' },
];

// ---------------------------------------------------------------- peças

/** "3 de 5 com dose", com barra. */
function DoseProgress({ builder }: { builder: ProgramBuilder }) {
    const { total, configured } = builder;
    const pct = total ? (configured / total) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="h-1.5 w-28 overflow-hidden rounded-ds-full bg-ds-surface-subtle">
                <span
                    className="block h-full rounded-ds-full bg-ds-primary-80 transition-[width] duration-300 ds-dark:bg-ds-primary-60"
                    style={{ width: `${pct}%` }}
                />
            </span>
            <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                {configured}/{total} com dose
            </span>
        </div>
    );
}

/** Topo da caixa de filtros da biblioteca: o grupo que recebe. */
function TargetPicker({ builder }: { builder: ProgramBuilder }) {
    const { groups, target } = builder;
    if (!target) return null;
    return (
        <div className="flex flex-wrap items-center gap-2 px-1.5 sm:gap-3 sm:px-0">
            <span className="text-ds-body-xs text-ds-content-secondary">
                Adicionando em
            </span>
            <DsDropdown
                mode="radio"
                label="Grupo que recebe os exercícios"
                icon={<Layers />}
                menuTitle="Adicionar no grupo"
                fixedLabel={target.name || 'Sem nome'}
                items={groups.map((g) => ({
                    key: g.id,
                    label: `${g.name || 'Sem nome'} (${g.exercises.length})`,
                }))}
                value={target.id}
                onValueChange={(id) => builder.setTargetId(id as string)}
            />
            <DsButton
                variant="tertiary"
                size="sm"
                iconPosition="left"
                icon={<Plus />}
                label="Novo grupo"
                onClick={() => builder.addGroup()}
            />
        </div>
    );
}

function Library({ builder }: { builder: ProgramBuilder }) {
    const { exercises, isLoading, isError, toggleFavorite } =
        useExerciseLibrary();
    const [filters, setFilters] = useState<LibraryFilters>(INITIAL_FILTERS);
    const filtered = useMemo(
        () => applyFilters(exercises, filters),
        [exercises, filters],
    );
    const isFiltered = filters.search !== '' || activeFilterCount(filters) > 0;
    const emptyState = isError ? (
        <DsEmptyState
            variant="error"
            title="Erro ao carregar exercícios"
            description="Tente de novo em alguns instantes."
        />
    ) : !isLoading && filtered.length === 0 ? (
        <DsEmptyState
            variant={isFiltered ? 'no-results' : 'empty'}
            title="Nenhum exercício encontrado"
            description="Tente ajustar seus filtros ou buscar por outro termo."
        />
    ) : null;
    return (
        <div className="flex min-w-0 flex-col gap-6">
            <ExerciseLibrary
                filtered={filtered}
                all={exercises}
                filters={filters}
                onChange={(patch) =>
                    setFilters((prev) => ({ ...prev, ...patch, page: 1 }))
                }
                onClearFilters={() =>
                    setFilters({ ...INITIAL_FILTERS, search: filters.search })
                }
                onToggleFavorite={toggleFavorite}
                isLoading={isLoading}
                emptyState={emptyState}
                tabs={<TargetPicker builder={builder} />}
                selection={{
                    isSelected: builder.isSelected,
                    onToggle: builder.toggle,
                }}
            />
        </div>
    );
}

/** Lateral presa enquanto a biblioteca rola. */
function Aside({
    title,
    children,
    footer,
}: {
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <aside
            aria-label={title}
            className="sticky top-28 hidden max-h-[calc(100dvh-8.5rem)] flex-col overflow-hidden rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs lg:flex"
        >
            <header className="flex flex-col gap-2 border-b border-ds-border-subtle px-4 py-3">
                <h2 className="text-ds-body-sm font-semibold text-ds-content-primary">
                    {title}
                </h2>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
            {footer && (
                <div className="border-t border-ds-border-subtle p-3">
                    {footer}
                </div>
            )}
        </aside>
    );
}

/** No celular: barra fixa embaixo que abre o programa numa gaveta. */
function MobileProgramBar({
    builder,
    label,
    onNext,
    children,
}: {
    builder: ProgramBuilder;
    label: string;
    onNext: () => void;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const next = (
        <DsButton
            size="full"
            iconPosition="right"
            icon={<ArrowRight />}
            label={label}
            disabled={builder.total === 0}
            onClick={() => {
                setOpen(false);
                onNext();
            }}
        />
    );
    return (
        <>
            <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-ds-border-subtle bg-ds-surface-default/95 p-3 backdrop-blur lg:hidden">
                <DsButton
                    variant="secondary"
                    size="full"
                    iconPosition="right"
                    icon={<ChevronUp />}
                    label={`${builder.total} no programa`}
                    onClick={() => setOpen(true)}
                />
                {next}
            </div>
            <DsDrawer
                open={open}
                onOpenChange={setOpen}
                placement="bottom"
                surfaceClass="max-h-[88dvh]"
                title="Seu programa"
                footer={next}
            >
                {children}
            </DsDrawer>
        </>
    );
}

// ---------------------------------------------------------------- assistente

export default function ProgramBuilderPrototype({
    variant,
}: {
    variant: string;
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();
    const topRef = useRef<HTMLDivElement>(null);

    // O que chega pela navegação: modelo ("Usar modelo"), cópia ou edição.
    const state = (location.state ?? {}) as {
        program?: Record<string, unknown>;
        editMode?: boolean;
    };
    const editMode = state.editMode === true;
    const [incoming] = useState(() => fromIncoming(state.program, editMode));
    const sourceTitle = state.program?.title ? String(state.program.title) : '';
    const builder = useProgramBuilder(incoming?.groups ?? []);

    // Com modelo, já começa em "Montar e dosar" (como a v1).
    const [step, setStep] = useState(incoming ? 1 : 0);
    const last = STEPS.length - 1;
    const go = (n: number) => {
        setStep(n);
        topRef.current?.scrollIntoView({ block: 'start' });
    };

    const [dose, setDose] = useState<{ groupId: string; id: string } | null>(
        null,
    );
    const doseGroup = builder.groups.find((g) => g.id === dose?.groupId);
    const doseExercise =
        doseGroup?.exercises.find((e) => e.id === dose?.id) ?? null;
    const openDose = (groupId: string, id: string) => setDose({ groupId, id });
    const addInGroup = (groupId: string) => {
        builder.setTargetId(groupId);
        go(0);
    };

    const canNext = step < last && builder.total > 0;
    const title = editMode ? 'Editar programa' : 'Novo programa';
    const subtitle = sourceTitle
        ? editMode
            ? `Editando “${sourceTitle}”`
            : `A partir de “${sourceTitle}”`
        : 'Monte o programa com os exercícios da biblioteca';

    let body: ReactNode;
    if (step === last) {
        body = (
            <DetailsStep
                builder={builder}
                initialTitle={incoming?.title ?? ''}
                initialMessage={incoming?.message ?? ''}
                editMode={editMode}
                onReview={() => go(1)}
            />
        );
    } else if (step === 0) {
        body = (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Library builder={builder} />
                <Aside
                    title={`Seu programa · ${exerciseCount(builder.total)}`}
                    footer={
                        <DsButton
                            size="full"
                            iconPosition="right"
                            icon={<ArrowRight />}
                            label="Montar e dosar"
                            disabled={builder.total === 0}
                            onClick={() => go(1)}
                        />
                    }
                >
                    <ProgramTray builder={builder} />
                </Aside>
                <MobileProgramBar
                    builder={builder}
                    label="Montar e dosar"
                    onNext={() => go(1)}
                >
                    <ProgramTray builder={builder} />
                </MobileProgramBar>
            </div>
        );
    } else {
        body = (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        Arraste para mudar a ordem ou o grupo. Toque no
                        exercício para definir a dose.
                    </p>
                    <DoseProgress builder={builder} />
                </div>
                <GroupBoard
                    builder={builder}
                    onDose={openDose}
                    onAddExercises={addInGroup}
                />
                {/* No celular, o avançar do cabeçalho some: vem para baixo. */}
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ds-border-subtle bg-ds-surface-default/95 p-3 backdrop-blur sm:hidden">
                    <DsButton
                        size="full"
                        iconPosition="right"
                        icon={<ArrowRight />}
                        label="Paciente e envio"
                        disabled={!canNext}
                        onClick={() => go(step + 1)}
                    />
                </div>
            </div>
        );
    }

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div ref={topRef} />
                {/* Cabeçalho preso (no celular rola junto, para sobrar tela). */}
                <header className="z-20 border-b border-ds-border-subtle bg-ds-surface-body/95 backdrop-blur sm:sticky sm:top-0">
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) items-center gap-4 px-4 py-3 sm:px-6 sm:py-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-ds-body-lg font-semibold sm:text-ds-page-title sm:font-normal">
                                {title}
                            </h1>
                            <p className="truncate text-ds-caption text-ds-content-muted sm:text-ds-body-sm">
                                {isMobile
                                    ? `Etapa ${step + 1} de ${STEPS.length} · ${STEPS[step]?.label}`
                                    : subtitle}
                            </p>
                        </div>
                        <div className="hidden w-[min(420px,36vw)] md:block">
                            <DsSteps steps={STEPS} current={step} />
                        </div>
                        {/* Voltar e Avançar juntos, do mesmo tamanho. No celular o
                            Avançar vai para a barra de baixo. */}
                        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                            <DsButton
                                variant="secondary"
                                size={isMobile ? 'sm' : 'md'}
                                iconPosition="left"
                                icon={<ArrowLeft />}
                                label="Voltar"
                                onClick={() =>
                                    step === 0
                                        ? navigate(
                                              '/clinica/programas/historico',
                                          )
                                        : go(step - 1)
                                }
                            />
                            {step < last && (
                                <div className="hidden sm:block">
                                    <DsButton
                                        iconPosition="right"
                                        icon={<ArrowRight />}
                                        label="Avançar"
                                        disabled={!canNext}
                                        onClick={() => go(step + 1)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-(--breakpoint-ds-xl) px-4 pt-6 pb-28 sm:px-6 sm:pt-8 lg:pb-12">
                    {body}
                </div>
            </div>

            <DoseDrawer
                exercise={doseExercise}
                groupName={doseGroup?.name ?? ''}
                groupSize={doseGroup?.exercises.length ?? 0}
                onClose={() => setDose(null)}
                onApply={(d) => {
                    if (dose) builder.setDose(dose.groupId, dose.id, d);
                    setDose(null);
                }}
                onApplyToGroup={(d) => {
                    if (dose) builder.setGroupDose(dose.groupId, d);
                    setDose(null);
                }}
            />
            <PrototypeSwitcher variants={BUILDER_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
