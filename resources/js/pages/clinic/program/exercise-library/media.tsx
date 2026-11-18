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
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ComponentProps,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { programDraftFromExercise } from '@/application/clinic/program-from-exercise';
import { useRefreshExerciseMedia } from '@/application/clinic/use-exercises';
import { DsBadge, DsButton, DsModal, DsTooltip, dsCn } from '@/components/ds';
import { ProtectedImage } from '@/components/protected-media/ProtectedImage';
import {
    mediaKey,
    useProtectedPlayback,
} from '@/components/protected-media/use-protected-playback';
import type { ClinicRole } from '@/domain/auth/session';
import type { Exercise } from '@/domain/clinic';

import { DIFFICULTY, type LibraryFilters } from './shared';

let current: HTMLVideoElement | null = null;

export interface ItemMedia {
    videoUrl?: string | null;
    thumbnailUrl?: string | null;
}

type ItemMediaLookup = (itemId: string) => Promise<ItemMedia | null>;

const ItemMediaContext = createContext<ItemMediaLookup | null>(null);

export const ItemMediaSource = ItemMediaContext.Provider;

/** O exercício desativado some de `GET /clinic/exercises/{id}`, mas continua no programa e no modelo. */
export function useRefreshItemMedia(item: { id: string; exerciseId?: string }) {
    const refreshExercise = useRefreshExerciseMedia(item.exerciseId ?? item.id);
    const fromSource = useContext(ItemMediaContext);

    return useCallback(async (): Promise<ItemMedia | null> => {
        const fresh = await refreshExercise().catch(() => null);
        if (fresh || !fromSource) return fresh;
        return fromSource(item.id);
    }, [fromSource, item.id, refreshExercise]);
}

export function CardVideo(props: ComponentProps<typeof CardVideoPlayer>) {
    return (
        <CardVideoPlayer key={mediaKey(props.exercise.videoUrl)} {...props} />
    );
}

function CardVideoPlayer({
    exercise,
    onOpen,
    className,
    topLeft,
    topRight,
    bottomLeft,
}: {
    /** Item de programa ou de modelo traz `exerciseId`; o `id` dele é o do item. */
    exercise: Pick<Exercise, 'id' | 'title' | 'videoUrl' | 'thumbnailUrl'> & {
        exerciseId?: string;
    };
    onOpen?: () => void;
    className?: string;
    topLeft?: ReactNode;
    topRight?: ReactNode;
    bottomLeft?: ReactNode;
}) {
    const [playing, setPlaying] = useState(false);
    const refreshMedia = useRefreshItemMedia(exercise);
    const playback = useProtectedPlayback({
        url: exercise.videoUrl,
        onRefresh: async () => (await refreshMedia())?.videoUrl ?? null,
    });

    useEffect(() => {
        const video = playback.ref.current;
        const onFullscreen = () => {
            if (video) video.controls = document.fullscreenElement === video;
        };
        document.addEventListener('fullscreenchange', onFullscreen);
        return () => {
            document.removeEventListener('fullscreenchange', onFullscreen);
            if (current === video) current = null;
        };
    }, [playback.ref]);

    const toggle = (ev: MouseEvent) => {
        ev.stopPropagation();
        const video = playback.ref.current;
        if (!video) return;
        if (video.paused || !playback.active) {
            if (current && current !== video) current.pause();
            current = video;
            void playback.play();
        } else video.pause();
    };

    const fullscreen = (ev: MouseEvent) => {
        ev.stopPropagation();
        const video = playback.ref.current;
        if (!video) return;
        void video.requestFullscreen?.();
        if (video.paused) void playback.play();
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
            {exercise.thumbnailUrl && !playback.active && (
                <ProtectedImage
                    src={exercise.thumbnailUrl}
                    alt=""
                    onRefresh={async () =>
                        (await refreshMedia())?.thumbnailUrl ?? null
                    }
                    className="absolute inset-0 size-full object-cover"
                />
            )}
            <video
                {...playback.videoProps}
                preload="none"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                className="size-full object-cover"
            />
            {playback.error && (
                <p className="pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center text-ds-caption text-white drop-shadow-md">
                    {playback.error}
                </p>
            )}
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

export function FavoriteButton({
    exercise,
    onToggle,
    look = 'overlay',
}: {
    exercise: Exercise;
    onToggle: (e: Exercise) => void;
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

function formatTime(time: number): string {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

const controlBtn =
    'flex size-7 cursor-pointer items-center justify-center rounded-ds-md text-white outline-0 hover:bg-white/20 focus-visible:shadow-ds-focus [&_svg]:size-3.5';

export function ModalPlayer(props: ComponentProps<typeof ModalPlayerView>) {
    return (
        <ModalPlayerView
            key={`${props.exercise.id}:${mediaKey(props.exercise.videoUrl)}`}
            {...props}
        />
    );
}

function ModalPlayerView({
    exercise,
    className,
}: {
    exercise: Exercise;
    className?: string;
}) {
    const [playing, setPlaying] = useState(false);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [muted, setMuted] = useState(false);
    const refreshMedia = useRefreshExerciseMedia(exercise.id);
    const playback = useProtectedPlayback({
        url: exercise.videoUrl,
        onRefresh: async () => (await refreshMedia())?.videoUrl ?? null,
    });

    const toggle = () => {
        const v = playback.ref.current;
        if (!v) return;
        if (v.paused || !playback.active) {
            if (current && current !== v) current.pause();
            current = v;
            void playback.play();
        } else v.pause();
    };
    const skip = (s: number) => {
        playback.seek(Math.max(0, Math.min(duration, time + s)));
    };

    return (
        <div
            className={dsCn(
                'group/player relative overflow-hidden bg-black',
                className,
            )}
        >
            {exercise.thumbnailUrl && !playback.active && (
                <ProtectedImage
                    src={exercise.thumbnailUrl}
                    alt=""
                    onRefresh={async () =>
                        (await refreshMedia())?.thumbnailUrl ?? null
                    }
                    className="absolute inset-0 size-full object-cover"
                />
            )}
            <video
                {...playback.videoProps}
                onClick={toggle}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                className="absolute inset-0 size-full object-contain"
            />
            {playback.error && (
                <p className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-ds-caption text-white drop-shadow-md">
                    {playback.error}
                </p>
            )}
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
                    onChange={(e) => playback.seek(Number(e.target.value))}
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
                            onClick={() => setMuted(playback.toggleMuted())}
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
                        onClick={() =>
                            void playback.ref.current?.requestFullscreen?.()
                        }
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
    const location = useLocation();
    // A origem, para o "Voltar" do novo programa voltar à biblioteca (o novo
    // modelo volta sempre para Meus modelos).
    const from = location.pathname + location.search;
    return {
        startProgram: (e: Exercise) =>
            navigate('/clinica/programas/novo', {
                state: { program: programDraftFromExercise(e), from },
            }),
        startModel: (e: Exercise) =>
            navigate('/clinica/programas/novo', {
                state: {
                    program: programDraftFromExercise(e),
                    asModel: true,
                    from,
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

export interface VariantProps {
    filtered: Exercise[];
    all: Exercise[];
    filters: LibraryFilters;
    onChange: (patch: Partial<LibraryFilters>) => void;
    onClearFilters: () => void;
    onToggleFavorite: (e: Exercise) => void;
    isLoading: boolean;
    emptyState: ReactNode;
    canSubmit?: boolean;
    onSubmit?: () => void;
    role?: ClinicRole;
    tabs?: ReactNode;
    selection?: LibrarySelection;
    embedded?: boolean;
    sentinel?: ReactNode;
}

export interface LibrarySelection {
    isSelected: (e: Exercise) => boolean;
    onToggle: (e: Exercise) => void;
}

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
