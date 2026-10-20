/**
 * PROTÓTIPO (descartável): modal do exercício, trocado por ?modal= com a
 * barra que aparece por cima do modal aberto. O = o player da v1; A (a
 * escolhida) = ficha clínica. As variantes B (vídeo em destaque + abas) e
 * C (gaveta lateral) foram descartadas sem commit.
 * "Usar em novo programa/modelo" são stub.
 */
import {
    Activity,
    ArrowLeftRight,
    Check,
    Clock,
    Dumbbell,
    Link2,
    ListOrdered,
    PersonStanding,
    Plus,
    Repeat,
    Star,
    Stethoscope,
    Target,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { DsBadge, DsButton, DsDrawer, DsModal, dsCn } from '@/components/ds';
import type { Exercise } from '@/domain/clinic';
import {
    PrototypeSwitcher,
    usePrototypeVariant,
} from '@/pages/clinic/PrototypeSwitcher';

import {
    CardVideo,
    DifficultyBadge,
    ExercisePlayerModal,
    ReviewBadge,
    useExerciseActions,
    type LibrarySelection,
} from './media';
import { useIsMobile } from './use-media-query';

export const MODAL_VARIANTS = [
    { key: 'O', name: 'Player da v1' },
    { key: 'A', name: 'Ficha clínica' },
] as const;

interface ModalProps {
    exercise: Exercise | null;
    onClose: () => void;
    onToggleFavorite: (e: Exercise) => void;
    /** No assistente de programa: o rodapé vira "Adicionar ao programa". */
    selection?: LibrarySelection;
}

// ---------------------------------------------------------------- conteúdo

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

/** A descrição vira passos: uma frase por passo. */
function stepsOf(e: Exercise): string[] {
    return (e.description || '')
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

interface Fact {
    key: string;
    icon: ReactNode;
    label: string;
    value: string;
}

function factsOf(e: Exercise): Fact[] {
    return [
        {
            key: 'region',
            icon: <PersonStanding />,
            label: 'Região do corpo',
            value: e.bodyRegion,
        },
        {
            key: 'muscle',
            icon: <Activity />,
            label: 'Grupo muscular',
            value: e.muscleGroup,
        },
        {
            key: 'type',
            icon: <Repeat />,
            label: 'Tipo de movimento',
            value: e.movementType,
        },
        {
            key: 'form',
            icon: <ArrowLeftRight />,
            label: 'Forma',
            value: e.movementForm
                ? e.movementForm.charAt(0).toUpperCase() +
                  e.movementForm.slice(1)
                : '',
        },
        {
            key: 'chain',
            icon: <Link2 />,
            label: 'Cadeia cinética',
            value: e.movementPattern,
        },
        {
            key: 'duration',
            icon: <Clock />,
            label: 'Duração do vídeo',
            value: e.duration ? formatDuration(e.duration) : '',
        },
    ].filter((f) => f.value);
}

function Eyebrow({ icon, children }: { icon: ReactNode; children: string }) {
    return (
        <p className="flex items-center gap-1.5 text-ds-caption font-semibold tracking-[0.06em] text-ds-content-muted uppercase [&_svg]:size-3.5">
            {icon}
            {children}
        </p>
    );
}

/** Passos numerados ("Como fazer"). */
function Steps({ exercise }: { exercise: Exercise }) {
    const steps = stepsOf(exercise);
    if (steps.length === 0) {
        return (
            <p className="text-ds-body-sm text-ds-content-muted">
                Sem instruções cadastradas.
            </p>
        );
    }
    return (
        <ol className="flex flex-col gap-3">
            {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-ds-full bg-ds-surface-brand-subtle font-ds-mono text-ds-caption font-semibold text-ds-content-brand ds-dark:text-ds-primary-60">
                        {i + 1}
                    </span>
                    <span className="pt-0.5 text-ds-body-xs leading-relaxed text-ds-content-primary sm:text-ds-body-sm">
                        {step}
                    </span>
                </li>
            ))}
        </ol>
    );
}

/**
 * Ficha técnica em linhas leves com ícone: uma coluna como lateral no
 * computador, 2–3 colunas embaixo em telas menores.
 */
function FactList({ exercise }: { exercise: Exercise }) {
    return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-1">
            {factsOf(exercise).map((f) => (
                <div key={f.key} className="flex items-start gap-2.5">
                    <span className="hidden size-8 shrink-0 items-center justify-center rounded-ds-md bg-ds-surface-subtle text-ds-content-secondary sm:flex [&_svg]:size-4">
                        {f.icon}
                    </span>
                    <div className="min-w-0">
                        <dt className="text-ds-caption text-ds-content-muted">
                            {f.label}
                        </dt>
                        <dd className="text-ds-body-xs leading-snug font-medium [overflow-wrap:anywhere] text-ds-content-primary">
                            {f.value}
                        </dd>
                    </div>
                </div>
            ))}
        </dl>
    );
}

function Badges({ exercise: e }: { exercise: Exercise }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge exercise={e} />
            {e.specialty && (
                <DsBadge variant="primary" icon={<Stethoscope />}>
                    {e.specialty}
                </DsBadge>
            )}
            <ReviewBadge exercise={e} />
        </div>
    );
}

/** No assistente: marcar ou tirar o exercício do programa. */
function SelectionFooter({
    exercise,
    selection,
}: {
    exercise: Exercise;
    selection: LibrarySelection;
}) {
    const isMobile = useIsMobile();
    const picked = selection.isSelected(exercise);
    return (
        <div className="flex w-full justify-end">
            <DsButton
                size={isMobile ? 'full' : 'md'}
                variant={picked ? 'secondary' : 'primary'}
                iconPosition="left"
                icon={picked ? <Check /> : <Plus />}
                label={picked ? 'No programa · tirar' : 'Adicionar ao programa'}
                onClick={() => selection.onToggle(exercise)}
            />
        </div>
    );
}

/** Rodapé: só as ações de usar o exercício (o favorito fica no corpo). */
function Footer({
    exercise,
    selection,
}: {
    exercise: Exercise;
    selection?: LibrarySelection;
}) {
    const { startProgram, startModel } = useExerciseActions();
    const isMobile = useIsMobile();
    if (selection) {
        return <SelectionFooter exercise={exercise} selection={selection} />;
    }
    return (
        // No celular, os dois lado a lado, na largura toda, com rótulo curto.
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
            <DsButton
                variant="secondary"
                size={isMobile ? 'full' : 'md'}
                label={isMobile ? 'Novo modelo' : 'Usar em novo modelo'}
                onClick={() => startModel(exercise)}
            />
            <DsButton
                size={isMobile ? 'full' : 'md'}
                // No celular, sem ícone para o rótulo caber em meia largura.
                {...(isMobile
                    ? {}
                    : { iconPosition: 'left' as const, icon: <Dumbbell /> })}
                label={isMobile ? 'Novo programa' : 'Usar em novo programa'}
                onClick={() => startProgram(exercise)}
            />
        </div>
    );
}

// ---------------------------------------------------------------- A: ficha clínica

/**
 * Três colunas no computador: o vídeo do cartão (256 px) com o botão de
 * favoritar logo abaixo; os selos, o objetivo num bloco da cor da marca e
 * os passos numerados; e a ficha técnica como lateral. Em telas menores a
 * ficha desce para baixo. O rodapé fica só com as ações de usar.
 */
function ModalA({
    exercise: e,
    onClose,
    onToggleFavorite,
    selection,
}: ModalProps) {
    const isMobile = useIsMobile();
    const shell = {
        open: e !== null,
        onOpenChange: (o: boolean) => !o && onClose(),
        title: e?.title,
        // No celular a linha de baixo do título sai: região e subárea já estão na ficha.
        meta:
            e && !isMobile
                ? [e.bodyArea, e.bodyRegion].filter(Boolean).join(' · ')
                : undefined,
        footer: e && <Footer exercise={e} selection={selection} />,
    };
    const body = e && (
        <div className="grid gap-6 sm:grid-cols-[256px_minmax(0,1fr)] lg:grid-cols-[256px_minmax(0,1fr)_300px] lg:gap-8">
            {/* O mesmo vídeo do cartão da biblioteca: quadrado, 256 px. */}
            <div className="mx-auto flex w-full max-w-64 flex-col gap-3 sm:mx-0">
                <CardVideo
                    exercise={e}
                    className="aspect-square w-full rounded-ds-lg shadow-ds-xs"
                />
                <DsButton
                    variant="secondary"
                    size="full"
                    iconPosition="left"
                    icon={
                        <Star
                            className={dsCn(
                                e.isFavorite &&
                                    'fill-current text-ds-status-warning-content',
                            )}
                        />
                    }
                    label={
                        e.isFavorite
                            ? 'Nos favoritos'
                            : 'Adicionar aos favoritos'
                    }
                    onClick={() => onToggleFavorite(e)}
                />
            </div>
            <div className="flex min-w-0 flex-col gap-5">
                <Badges exercise={e} />
                {e.objective && (
                    <div className="flex gap-3 rounded-ds-lg border border-ds-border-brand-subtle bg-ds-surface-brand-subtle p-3 sm:p-4">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-ds-md bg-ds-primary-80 text-white sm:size-9 [&_svg]:size-4">
                            <Target />
                        </span>
                        <div>
                            <p className="text-ds-caption font-semibold text-ds-content-brand ds-dark:text-ds-primary-60">
                                Objetivo
                            </p>
                            <p className="mt-0.5 text-ds-body-xs leading-relaxed text-ds-content-primary sm:text-ds-body-sm">
                                {e.objective}
                            </p>
                        </div>
                    </div>
                )}
                <section className="flex flex-col gap-3">
                    <Eyebrow icon={<ListOrdered />}>Como fazer</Eyebrow>
                    <Steps exercise={e} />
                </section>
            </div>
            {factsOf(e).length > 0 && (
                <section className="flex flex-col gap-3 border-t border-ds-border-subtle pt-5 sm:col-span-2 lg:col-span-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                    <Eyebrow icon={<Activity />}>Ficha técnica</Eyebrow>
                    <FactList exercise={e} />
                </section>
            )}
        </div>
    );

    // No celular, gaveta que sobe de baixo na largura toda; no computador, modal.
    return isMobile ? (
        <DsDrawer {...shell} placement="bottom" surfaceClass="max-h-[92dvh]">
            {body}
        </DsDrawer>
    ) : (
        <DsModal {...shell} size="full">
            {body}
        </DsModal>
    );
}

// ---------------------------------------------------------------- troca

const MODALS: Record<string, (p: ModalProps) => ReactNode> = {
    A: ModalA,
};

/** O modal da D, escolhido por ?modal= (barra própria enquanto aberto). */
export function ExerciseModal(props: ModalProps) {
    const key = usePrototypeVariant(MODAL_VARIANTS, 'A', 'modal');
    const Modal = MODALS[key];
    return (
        <>
            {Modal ? (
                <Modal {...props} />
            ) : (
                <ExercisePlayerModal {...props} withActions showDescription />
            )}
            {props.exercise && (
                <PrototypeSwitcher
                    variants={MODAL_VARIANTS}
                    current={key}
                    param="modal"
                    scope="dialog"
                    prefix="Modal"
                />
            )}
        </>
    );
}
