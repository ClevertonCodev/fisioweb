/**
 * O assistente de programa em três etapas (Exercícios → Montar e dosar →
 * Paciente e envio), o mesmo para criar, editar e montar modelo. Criar chega
 * vazio, com um exercício ou com um modelo (pela navegação); editar chega com
 * o programa carregado pela rota. Escolher exercícios usa a biblioteca da aba
 * Exercícios (VariantD) em modo seleção.
 */
import { ArrowLeft, ArrowRight, ChevronUp, Layers, Plus } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import {
    useBlocker,
    useLocation,
    useNavigate,
    useSearchParams,
} from 'react-router-dom';

import { parseDate } from '@/application/clinic/dates';
import {
    exerciseCount,
    fromIncoming,
    useProgramBuilder,
    type ProgramBuilder as Builder,
} from '@/application/clinic/program-builder';
import { programBackPath } from '@/application/clinic/program-detail';
import { startOfToday } from '@/application/clinic/program-details-form';
import type { SavedIds } from '@/application/clinic/program-write';
import { useProgramDraft } from '@/application/clinic/use-program-draft';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    DsAlert,
    DsButton,
    DsDrawer,
    DsDropdown,
    DsEmptyState,
    DsModal,
    DsSteps,
} from '@/components/ds';
import type { Program, ProgramStep } from '@/domain/clinic';
import {
    activeFilterCount,
    usePagedExerciseLibrary,
} from '@/pages/clinic/program/exercise-library/shared';
import { VariantD as ExerciseLibrary } from '@/pages/clinic/program/exercise-library/VariantD';
import { useIsMobile } from '@/pages/clinic/use-media-query';

import {
    DetailsStep,
    type DetailsInitial,
    type SaveTarget,
} from './DetailsStep';
import { DoseDrawer } from './DoseDrawer';
import { GroupBoard } from './GroupBoard';
import { ProgramTray } from './ProgramTray';

export type BuilderKind = 'program' | 'model';

const LAST = 2;
/** O rascunho guarda a etapa no formato da v1 (1, 2 e 4). */
const DRAFT_STEP: ProgramStep[] = [1, 2, 4];
const fromDraftStep = (s: ProgramStep) => (s >= 4 ? 2 : s >= 2 ? 1 : 0);

// ---------------------------------------------------------------- peças

/** "3 de 5 com dose", com barra. */
function DoseProgress({ builder }: { builder: Builder }) {
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
function TargetPicker({ builder }: { builder: Builder }) {
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

function Library({ builder }: { builder: Builder }) {
    const lib = usePagedExerciseLibrary();
    const isFiltered =
        lib.filters.search !== '' || activeFilterCount(lib.filters) > 0;
    const emptyState = lib.isError ? (
        <DsEmptyState
            variant="error"
            title="Erro ao carregar exercícios"
            description="Tente de novo em alguns instantes."
        />
    ) : !lib.isLoading && !lib.searchingMore && lib.filtered.length === 0 ? (
        <DsEmptyState
            variant={isFiltered ? 'no-results' : 'empty'}
            title="Nenhum exercício encontrado"
            description="Tente ajustar seus filtros ou buscar por outro termo."
        />
    ) : null;
    return (
        <div className="flex min-w-0 flex-col gap-6">
            <ExerciseLibrary
                filtered={lib.filtered}
                all={lib.loaded}
                filters={lib.filters}
                onChange={lib.update}
                onClearFilters={lib.clearFilters}
                onToggleFavorite={lib.onToggleFavorite}
                isLoading={lib.isLoading}
                emptyState={emptyState}
                sentinel={lib.sentinel}
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
    builder: Builder;
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

/**
 * "Descartar alterações?" ao sair da edição com mudança não salva. Lê uma ref
 * para o salvar poder liberar a saída antes do próximo render.
 */
function useLeaveGuard(enabled: boolean, releasedRef: { current: boolean }) {
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            enabled &&
            !releasedRef.current &&
            currentLocation.pathname !== nextLocation.pathname,
    );
    useEffect(() => {
        if (!enabled) return;
        const warn = (e: BeforeUnloadEvent) => {
            if (!releasedRef.current) e.preventDefault();
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [enabled]);
    return blocker;
}

// ---------------------------------------------------------------- assistente

export default function ProgramBuilder({
    kind,
    program,
}: {
    kind: BuilderKind;
    /** Na edição: o programa (ou modelo) carregado pela rota. */
    program?: Program | null;
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const isMobile = useIsMobile();
    const topRef = useRef<HTMLDivElement>(null);
    const isModel = kind === 'model';
    const isEdit = Boolean(program);

    // Novo: o que chega pela navegação (exercício ou modelo). Edição: o
    // próprio programa, com o nome como está.
    const state = (location.state ?? {}) as {
        program?: Record<string, unknown>;
        from?: string;
    };
    const [incoming] = useState(() =>
        fromIncoming(
            (program ?? state.program) as Record<string, unknown> | undefined,
            isEdit || isModel,
        ),
    );
    const patientFromQuery = isModel
        ? ''
        : (searchParams.get('patientId') ?? '');
    const builder = useProgramBuilder(incoming?.groups ?? []);

    const [initialGroups] = useState(() => JSON.stringify(builder.groups));
    const [detailsDirty, setDetailsDirty] = useState(false);
    const savedRef = useRef(false);
    const dirty =
        isEdit &&
        (detailsDirty || JSON.stringify(builder.groups) !== initialGroups);
    const blocker = useLeaveGuard(dirty, savedRef);

    const savedIds = useMemo<SavedIds | undefined>(
        () =>
            program
                ? {
                      groupIds: program.groups.map((g) => g.id),
                      exerciseIds: program.groups.flatMap((g) =>
                          g.exercises.map((e) => e.id),
                      ),
                  }
                : undefined,
        [program],
    );

    // Com exercício, modelo ou edição, já começa em "Montar e dosar".
    const [step, setStep] = useState(incoming ? 1 : 0);
    const go = (n: number) => {
        setStep(n);
        topRef.current?.scrollIntoView({ block: 'start' });
    };

    // Rascunho automático: só no novo programa vazio ou pelo prontuário.
    const draftEnabled = !isEdit && !isModel && !incoming;
    // O servidor exige os ids marcados; sem exercício, nada é salvo.
    const selectedIds = useMemo(
        () =>
            builder.groups.flatMap((g) => g.exercises.map((e) => e.exerciseId)),
        [builder.groups],
    );
    const { draft, hasDraft, scheduleSave, clearDraft, restoreDraft } =
        useProgramDraft(
            DRAFT_STEP[step] ?? 1,
            selectedIds,
            builder.total > 0 ? builder.groups : [],
            draftEnabled,
        );
    useEffect(() => {
        scheduleSave();
    }, [step, builder.groups, scheduleSave]);

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

    const backPath = isEdit
        ? isModel
            ? '/clinica/programas/meus-modelos'
            : `/clinica/programas/${program!.id}`
        : isModel
          ? '/clinica/programas/meus-modelos'
          : state.from
            ? programBackPath(state)
            : patientFromQuery
              ? `/clinica/pacientes/${patientFromQuery}`
              : programBackPath(null);

    const onSaved = useCallback(() => {
        savedRef.current = true;
        clearDraft();
    }, [clearDraft]);

    const steps = [
        { label: 'Exercícios' },
        { label: 'Montar e dosar' },
        { label: isModel ? 'Nome e mensagem' : 'Paciente e envio' },
    ];
    const canNext = step < LAST && builder.total > 0;
    const title = isModel
        ? isEdit
            ? 'Editar modelo'
            : 'Novo modelo'
        : isEdit
          ? 'Editar programa'
          : 'Novo programa';
    const sourceTitle = isEdit
        ? (program?.title ?? '')
        : state.program?.title
          ? String(state.program.title)
          : '';
    const subtitle = sourceTitle
        ? isEdit
            ? `Editando “${sourceTitle}”`
            : `A partir de “${sourceTitle}”`
        : isModel
          ? 'Monte o modelo com os exercícios da biblioteca'
          : 'Monte o programa com os exercícios da biblioteca';

    const detailsInitial = useMemo<DetailsInitial>(
        () => ({
            title: incoming?.title ?? '',
            message: incoming?.message ?? '',
            patientId: program?.patientId ?? patientFromQuery,
            patientName: program?.patientName ?? null,
            startDate: program
                ? parseDate(program.startDate || null)
                : isModel
                  ? null
                  : startOfToday(),
            endDate: program ? parseDate(program.endDate) : null,
        }),
        // O formulário parte disto uma vez só.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
    const target = useMemo<SaveTarget>(
        () => ({ kind, programId: program?.id, saved: savedIds }),
        [kind, program?.id, savedIds],
    );

    let body: ReactNode = null;
    if (step === 0) {
        body = (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Library builder={builder} />
                <Aside
                    title={`Seu ${isModel ? 'modelo' : 'programa'} · ${exerciseCount(builder.total)}`}
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
    } else if (step === 1) {
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
                        label={steps[LAST]!.label}
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
                                    ? `Etapa ${step + 1} de ${steps.length} · ${steps[step]?.label}`
                                    : subtitle}
                            </p>
                        </div>
                        <nav
                            aria-label="Etapas"
                            className="hidden w-[min(420px,36vw)] md:block"
                        >
                            <DsSteps
                                steps={steps}
                                current={step}
                                onStepClick={builder.total > 0 ? go : undefined}
                            />
                        </nav>
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
                                        ? navigate(backPath)
                                        : go(step - 1)
                                }
                            />
                            {step < LAST && (
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
                    {hasDraft && draft && (
                        <DsAlert
                            className="mb-6"
                            variant="info"
                            mode="rich"
                            title={`Rascunho salvo às ${new Date(
                                draft.savedAt,
                            ).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}`}
                            actions={
                                <div className="flex gap-2">
                                    <DsButton
                                        size="sm"
                                        label="Restaurar"
                                        onClick={() => {
                                            const d = restoreDraft();
                                            if (!d) return;
                                            builder.setGroups(d.groups);
                                            go(fromDraftStep(d.step));
                                        }}
                                    />
                                    <DsButton
                                        variant="secondary"
                                        size="sm"
                                        label="Descartar"
                                        onClick={clearDraft}
                                    />
                                </div>
                            }
                        >
                            Você começou um programa e não salvou.
                        </DsAlert>
                    )}
                    {body}
                    {/* A etapa 3 fica montada para não perder o que foi digitado
                        ao voltar para dosar. */}
                    <div hidden={step !== LAST}>
                        <DetailsStep
                            builder={builder}
                            initial={detailsInitial}
                            target={target}
                            onReview={() => go(1)}
                            onSaved={onSaved}
                            onDirtyChange={setDetailsDirty}
                        />
                    </div>
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
            <DsModal
                open={blocker.state === 'blocked'}
                onOpenChange={(o) => !o && blocker.reset?.()}
                size="sm"
                title="Descartar alterações?"
                footer={
                    <div className="flex w-full justify-end gap-3">
                        <DsButton
                            variant="secondary"
                            label="Continuar editando"
                            onClick={() => blocker.reset?.()}
                        />
                        <DsButton
                            variant="destructive"
                            label="Descartar"
                            onClick={() => blocker.proceed?.()}
                        />
                    </div>
                }
            >
                <p className="text-ds-body-sm text-ds-content-secondary">
                    O que você mudou neste {isModel ? 'modelo' : 'programa'} não
                    foi salvo.
                </p>
            </DsModal>
        </ClinicLayout>
    );
}
