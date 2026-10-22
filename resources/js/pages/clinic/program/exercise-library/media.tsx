/**
 * PROTÓTIPO (descartável): peças da v1 (ExerciseCard e VideoPlayerModal)
 * refeitas com o DS v2. "Usar em novo programa/modelo"
 * são stub.
 */
import {
    Check,
    Maximize,
    Pause,
    Play,
    Plus,
    SkipBack,
    SkipForward,
    Star,
    Volume2,
    VolumeX,
} from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { programDraftFromExercise } from '@/application/clinic/program-from-exercise';
import { DsBadge, DsButton, DsModal, DsTooltip, dsCn } from '@/components/ds';
import type { Exercise } from '@/domain/clinic';

import { DIFFICULTY, type LibraryFilters } from './shared';

// ---------------------------------------------------------------- vídeo do cartão

/** Um vídeo por vez: dar play em outro pausa o anterior. */
let current: HTMLVideoElement | null = null;

function playOnly(video: HTMLVideoElement) {
    if (current && current !== video) current.pause();
    current = video;
    void video.play();
}

/**
 * O vídeo do ExerciseCard da v1: play no centro com o véu da marca no hover,
 * botão "parar" redondo enquanto toca, tela cheia no canto. Clicar fora
 * desses botões chama `onOpen` (sem ele, o resto do vídeo não reage).
 */
export function CardVideo({
    exercise,
    onOpen,
    className,
    topLeft,
    topRight,
    bottomLeft,
}: {
    /** Só título e mídia: serve também para o exercício de um modelo. */
    exercise: Pick<Exercise, 'title' | 'videoUrl' | 'thumbnailUrl'>;
    onOpen?: () => void;
    className?: string;
    topLeft?: ReactNode;
    topRight?: ReactNode;
    bottomLeft?: ReactNode;
}) {
    const ref = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        const video = ref.current;
        const onFullscreen = () => {
            if (video) video.controls = document.fullscreenElement === video;
        };
        document.addEventListener('fullscreenchange', onFullscreen);
        return () => {
            document.removeEventListener('fullscreenchange', onFullscreen);
            if (current === video) current = null;
        };
    }, []);

    const toggle = (ev: MouseEvent) => {
        ev.stopPropagation();
        const video = ref.current;
        if (!video) return;
        if (video.paused) playOnly(video);
        else video.pause();
    };

    const fullscreen = (ev: MouseEvent) => {
        ev.stopPropagation();
        const video = ref.current;
        if (!video) return;
        void video.requestFullscreen?.();
        if (video.paused) playOnly(video);
    };

    return (
        <div
            onClick={onOpen}
            className={dsCn(
                'group/video relative overflow-hidden bg-ds-surface-subtle',
                onOpen && 'cursor-pointer',
                className,
            )}
        >
            <video
                ref={ref}
                src={exercise.videoUrl || undefined}
                poster={exercise.thumbnailUrl || undefined}
                preload="none"
                playsInline
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                className="size-full object-cover"
            />
            {/* Véu da marca no hover (o bg-primary/25 da v1). */}
            <div className="pointer-events-none absolute inset-0 transition-colors duration-200 group-hover/video:bg-ds-primary-80/25" />

            <button
                type="button"
                aria-label={
                    playing
                        ? `Parar ${exercise.title}`
                        : `Reproduzir ${exercise.title}`
                }
                onClick={toggle}
                className={dsCn(
                    'absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-ds-full text-white outline-0 drop-shadow-md transition-[opacity,transform] duration-200 group-hover/video:scale-110 focus-visible:shadow-ds-focus',
                    playing &&
                        'opacity-0 group-hover/video:opacity-100 focus-visible:opacity-100',
                )}
            >
                {playing ? (
                    <span className="flex size-8 items-center justify-center rounded-ds-full border-2 border-white">
                        <span className="size-2.5 rounded-[2px] bg-white" />
                    </span>
                ) : (
                    // Mesmo tamanho do play da referência (~24 px de triângulo).
                    <Play className="ml-0.5 size-8 fill-current" />
                )}
            </button>

            <DsTooltip content="Ver em tela cheia" asChild>
                <button
                    type="button"
                    aria-label={`Ver ${exercise.title} em tela cheia`}
                    onClick={fullscreen}
                    className="absolute right-2 bottom-2 flex size-7 cursor-pointer items-center justify-center rounded-ds-md text-white opacity-0 outline-0 drop-shadow-md transition-opacity group-hover/video:opacity-100 hover:bg-black/30 focus-visible:opacity-100 focus-visible:shadow-ds-focus [&_svg]:size-4"
                >
                    <Maximize />
                </button>
            </DsTooltip>

            {topLeft && (
                <div className="pointer-events-none absolute top-2 left-2">
                    {topLeft}
                </div>
            )}
            {topRight && (
                <div className="absolute top-2 right-2">{topRight}</div>
            )}
            {bottomLeft && (
                <div className="pointer-events-none absolute bottom-2 left-2">
                    {bottomLeft}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- favorito, info, selos

export function FavoriteButton({
    exercise,
    onToggle,
    look = 'overlay',
}: {
    exercise: Exercise;
    onToggle: (e: Exercise) => void;
    /** overlay: sobre o vídeo, só aparece no hover se não for favorito. */
    look?: 'overlay' | 'plain';
}) {
    const label = exercise.isFavorite
        ? 'Remover dos favoritos'
        : 'Adicionar aos favoritos';
    return (
        <DsTooltip content={label} asChild>
            <button
                type="button"
                aria-label={label}
                aria-pressed={exercise.isFavorite}
                onClick={(ev) => {
                    ev.stopPropagation();
                    onToggle(exercise);
                }}
                className={dsCn(
                    'relative z-10 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-ds-full outline-0 transition-[opacity,color,background-color] focus-visible:opacity-100 focus-visible:shadow-ds-focus [&_svg]:size-4',
                    look === 'overlay' &&
                        (exercise.isFavorite
                            ? 'bg-ds-status-warning-surface text-ds-status-warning-content'
                            : 'bg-ds-surface-default/70 text-ds-content-muted opacity-0 backdrop-blur-sm group-hover/card:opacity-100 hover:text-ds-status-warning-content'),
                    look === 'plain' &&
                        (exercise.isFavorite
                            ? 'text-ds-status-warning-content hover:bg-ds-surface-subtle'
                            : 'text-ds-content-muted hover:bg-ds-surface-subtle hover:text-ds-status-warning-content'),
                    exercise.isFavorite && '[&_svg]:fill-current',
                )}
            >
                <Star />
            </button>
        </DsTooltip>
    );
}

export function DifficultyBadge({ exercise }: { exercise: Exercise }) {
    const d = DIFFICULTY[exercise.difficulty];
    return (
        <DsBadge variant={d.variant} dot>
            {d.label}
        </DsBadge>
    );
}

/** O aviso da v1 para envio da clínica que ainda não foi aprovado. */
export function ReviewBadge({ exercise }: { exercise: Exercise }) {
    if (!exercise.isOwnSubmission || exercise.reviewStatus === 'approved') {
        return null;
    }
    return (
        <DsBadge variant="warning">
            {exercise.reviewStatus === 'rejected'
                ? 'Somente sua clínica'
                : 'Em revisão · só sua clínica'}
        </DsBadge>
    );
}

// ---------------------------------------------------------------- modal (VideoPlayerModal v1)

function formatTime(time: number): string {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

const controlBtn =
    'flex size-7 cursor-pointer items-center justify-center rounded-ds-md text-white outline-0 hover:bg-white/20 focus-visible:shadow-ds-focus [&_svg]:size-3.5';

/** O player da v1: ±10 s, som, tempo e tela cheia sobre o vídeo. */
export function ModalPlayer({
    exercise,
    className,
}: {
    exercise: Exercise;
    className?: string;
}) {
    const ref = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [muted, setMuted] = useState(false);

    const toggle = () => {
        const v = ref.current;
        if (!v) return;
        if (v.paused) playOnly(v);
        else v.pause();
    };
    const skip = (s: number) => {
        const v = ref.current;
        if (v) {
            v.currentTime = Math.max(0, Math.min(duration, v.currentTime + s));
        }
    };

    return (
        <div
            className={dsCn(
                'group/player relative overflow-hidden bg-black',
                className,
            )}
        >
            <video
                ref={ref}
                key={exercise.id}
                src={exercise.videoUrl || undefined}
                poster={exercise.thumbnailUrl || undefined}
                playsInline
                onClick={toggle}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                className="absolute inset-0 size-full object-contain"
            />
            {!playing && (
                <button
                    type="button"
                    aria-label="Reproduzir"
                    onClick={toggle}
                    className="absolute inset-0 flex cursor-pointer items-center justify-center text-white outline-0"
                >
                    <Play className="ml-0.5 size-8 fill-current drop-shadow-md transition-transform hover:scale-110" />
                </button>
            )}
            <div
                className={dsCn(
                    'absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-3 transition-opacity duration-300',
                    playing &&
                        'opacity-0 group-hover/player:opacity-100 focus-within:opacity-100',
                )}
            >
                <input
                    type="range"
                    aria-label="Posição do vídeo"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={time}
                    onChange={(e) => {
                        if (ref.current) {
                            ref.current.currentTime = Number(e.target.value);
                        }
                    }}
                    className="mb-2 h-1 w-full cursor-pointer accent-white"
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            aria-label="Voltar 10 segundos"
                            className={controlBtn}
                            onClick={() => skip(-10)}
                        >
                            <SkipBack />
                        </button>
                        <button
                            type="button"
                            aria-label={playing ? 'Pausar' : 'Reproduzir'}
                            className={dsCn(
                                controlBtn,
                                'size-8 [&_svg]:size-4',
                            )}
                            onClick={toggle}
                        >
                            {playing ? <Pause /> : <Play className="ml-0.5" />}
                        </button>
                        <button
                            type="button"
                            aria-label="Avançar 10 segundos"
                            className={controlBtn}
                            onClick={() => skip(10)}
                        >
                            <SkipForward />
                        </button>
                        <button
                            type="button"
                            aria-label={muted ? 'Ligar som' : 'Tirar som'}
                            className={controlBtn}
                            onClick={() => {
                                const v = ref.current;
                                if (!v) return;
                                v.muted = !v.muted;
                                setMuted(v.muted);
                            }}
                        >
                            {muted ? <VolumeX /> : <Volume2 />}
                        </button>
                        <span className="ml-1 font-ds-mono text-ds-caption whitespace-nowrap text-white">
                            {formatTime(time)} / {formatTime(duration)}
                        </span>
                    </div>
                    <button
                        type="button"
                        aria-label="Tela cheia"
                        className={controlBtn}
                        onClick={() => void ref.current?.requestFullscreen?.()}
                    >
                        <Maximize />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function useExerciseActions() {
    const navigate = useNavigate();
    return {
        startProgram: (e: Exercise) =>
            navigate('/clinica/programas/novo', {
                state: { program: programDraftFromExercise(e) },
            }),
        startModel: (e: Exercise) =>
            navigate('/clinica/programas/novo', {
                state: {
                    program: programDraftFromExercise(e),
                    asModel: true,
                },
            }),
    };
}

export function metaOf(e: Exercise): string[] {
    return [
        e.specialty,
        e.muscleGroup,
        e.bodyArea,
        e.bodyRegion,
        e.movementType,
    ].filter(Boolean);
}

/**
 * O VideoPlayerModal da v1 no DsModal: vídeo à esquerda (45%), selo de
 * dificuldade, objetivo, metadados separados por "•" e a estrela.
 * `withActions` acrescenta "Usar em novo programa/modelo".
 */
export function ExercisePlayerModal({
    exercise,
    onClose,
    onToggleFavorite,
    withActions = false,
    showDescription = false,
}: {
    exercise: Exercise | null;
    onClose: () => void;
    onToggleFavorite: (e: Exercise) => void;
    withActions?: boolean;
    /** Mostra a descrição ("como fazer") além do objetivo. */
    showDescription?: boolean;
}) {
    const { startProgram, startModel } = useExerciseActions();
    const e = exercise;
    return (
        <DsModal
            open={e !== null}
            onOpenChange={(open) => !open && onClose()}
            title={e?.title}
            size="lg"
            footer={
                e && (
                    <div className="flex w-full items-center gap-3">
                        <div className="mr-auto">
                            <FavoriteButton
                                exercise={e}
                                onToggle={onToggleFavorite}
                                look="plain"
                            />
                        </div>
                        {withActions ? (
                            <>
                                <DsButton
                                    variant="secondary"
                                    label="Usar em novo modelo"
                                    onClick={() => startModel(e)}
                                />
                                <DsButton
                                    label="Usar em novo programa"
                                    onClick={() => startProgram(e)}
                                />
                            </>
                        ) : (
                            <DsButton
                                variant="secondary"
                                label="Fechar"
                                onClick={onClose}
                            />
                        )}
                    </div>
                )
            }
        >
            {e && (
                <div className="flex flex-col gap-5 sm:flex-row">
                    <ModalPlayer
                        exercise={e}
                        className="aspect-square w-full shrink-0 rounded-ds-lg sm:w-[45%]"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                        <div className="flex flex-wrap gap-2">
                            <DifficultyBadge exercise={e} />
                            <ReviewBadge exercise={e} />
                        </div>
                        {e.objective && (
                            <p className="text-ds-body-sm leading-relaxed text-ds-content-primary">
                                {e.objective}
                            </p>
                        )}
                        {showDescription && e.description && (
                            <div>
                                <p className="text-ds-caption font-medium text-ds-content-muted">
                                    Como fazer
                                </p>
                                <p className="mt-1 text-ds-body-sm leading-relaxed text-ds-content-secondary">
                                    {e.description}
                                </p>
                            </div>
                        )}
                        {metaOf(e).length > 0 && (
                            <p className="flex flex-wrap gap-x-1.5 gap-y-1 text-ds-body-xs text-ds-content-secondary">
                                {metaOf(e).map((m, i) => (
                                    <span
                                        key={m}
                                        className="flex items-center gap-1.5"
                                    >
                                        {i > 0 && (
                                            <span className="text-ds-content-muted">
                                                •
                                            </span>
                                        )}
                                        {m}
                                    </span>
                                ))}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </DsModal>
    );
}

// ---------------------------------------------------------------- filtros (ExerciseFilters v1)

// ---------------------------------------------------------------- variantes

export interface VariantProps {
    /** Já filtrados. */
    filtered: Exercise[];
    /** Todos (contagem das facetas e o aberto no modal). */
    all: Exercise[];
    filters: LibraryFilters;
    onChange: (patch: Partial<LibraryFilters>) => void;
    onClearFilters: () => void;
    onToggleFavorite: (e: Exercise) => void;
    isLoading: boolean;
    /** Erro ou lista vazia já decidida (null = há resultados). */
    emptyState: ReactNode;
    canSubmit?: boolean;
    onSubmit?: () => void;
    /**
     * Topo da caixa de filtros: as abas Histórico/Exercícios/Programas na
     * biblioteca; no assistente de programa, o grupo que recebe os exercícios.
     */
    tabs?: ReactNode;
    /** Modo seleção (assistente de programa): marcar exercícios no cartão e no modal. */
    selection?: LibrarySelection;
    /** Sem a caixa de filtros: a página já mostrou busca e dropdowns. */
    embedded?: boolean;
    sentinel?: ReactNode;
}

export interface LibrarySelection {
    isSelected: (e: Exercise) => boolean;
    onToggle: (e: Exercise) => void;
}

/** Círculo de marcar no canto do vídeo (modo seleção). */
export function SelectToggle({
    exercise,
    selected,
    onToggle,
}: {
    exercise: Exercise;
    selected: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            aria-label={
                selected
                    ? `Tirar ${exercise.title} do programa`
                    : `Adicionar ${exercise.title} ao programa`
            }
            onClick={(ev) => {
                ev.stopPropagation();
                onToggle();
            }}
            className={dsCn(
                'flex size-8 cursor-pointer items-center justify-center rounded-ds-full border-2 shadow-ds-sm outline-0 transition-[background,transform] hover:scale-110 focus-visible:shadow-ds-focus [&_svg]:size-4',
                selected
                    ? 'border-ds-primary-80 bg-ds-primary-80 text-white ds-dark:border-ds-primary-70 ds-dark:bg-ds-primary-70'
                    : 'border-white bg-black/30 text-white backdrop-blur-sm',
            )}
        >
            {selected ? <Check /> : <Plus />}
        </button>
    );
}
