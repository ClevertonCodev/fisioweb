import { Check, Dumbbell, Info, Maximize, Pause, Play, Star } from 'lucide-react';
import { useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/types';

const difficultyColors: Record<string, string> = {
    easy: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    medium: 'border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-400',
    hard: 'border-destructive/30 bg-destructive/20 text-destructive',
};

const difficultyLabels: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
};

interface ExerciseCardProps {
    exercise: Exercise;
    onToggleFavorite?: (exercise: Exercise) => void;
    onInfo?: (exercise: Exercise) => void;
    isFavorite?: boolean;
    /** Modo seleção: mostra overlay de check quando selecionado */
    selected?: boolean;
    onSelect?: (exercise: Exercise) => void;
}

export function ExerciseCard({
    exercise,
    onToggleFavorite,
    onInfo,
    isFavorite = false,
    selected = false,
    onSelect,
}: ExerciseCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fullscreenRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const video = exercise.videos?.[0];
    const videoUrl = video?.cdn_url;
    const thumbnailUrl = video?.thumbnail_url;
    const hasVideo = !!videoUrl;

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const el = videoRef.current;
        if (!el || !hasVideo) return;

        if (isPlaying) {
            el.pause();
            setIsPlaying(false);
        } else {
            el.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const handleVideoEnded = () => {
        setIsPlaying(false);
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const container = fullscreenRef.current;
        if (!container || !hasVideo) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen().catch(() => {});
        }
    };

    const handleCardClick = () => {
        if (onSelect) {
            onSelect(exercise);
        }
    };

    return (
        <div
            onClick={onSelect ? handleCardClick : undefined}
            className={cn(
                'group relative flex w-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-200 hover:shadow-md',
                onSelect ? 'cursor-pointer' : '',
                selected
                    ? 'border-teal-600 shadow-md ring-1 ring-teal-600'
                    : 'border-border hover:border-teal-600/50',
            )}
        >
            {/* Área do vídeo */}
            <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-t-lg bg-muted">
                {hasVideo ? (
                    <div
                        ref={fullscreenRef}
                        className="relative h-full w-full [&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:justify-center [&:fullscreen]:bg-black [&:fullscreen]:overflow-auto [&:fullscreen]:[&_video]:h-auto [&:fullscreen]:[&_video]:w-auto [&:fullscreen]:[&_video]:max-h-none [&:fullscreen]:[&_video]:max-w-none [&:fullscreen]:[&_video]:object-contain [&:-webkit-full-screen]:flex [&:-webkit-full-screen]:items-center [&:-webkit-full-screen]:justify-center [&:-webkit-full-screen]:bg-black [&:-webkit-full-screen]:overflow-auto [&:-webkit-full-screen]:[&_video]:h-auto [&:-webkit-full-screen]:[&_video]:w-auto [&:-webkit-full-screen]:[&_video]:max-h-none [&:-webkit-full-screen]:[&_video]:max-w-none [&:-webkit-full-screen]:[&_video]:object-contain"
                    >
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            poster={thumbnailUrl ?? undefined}
                            className="h-full w-full object-cover"
                            onEnded={handleVideoEnded}
                            playsInline
                        />
                    </div>
                ) : thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={exercise.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Dumbbell className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                )}

                {/* Check de seleção no canto superior esquerdo */}
                {onSelect && selected && (
                    <div className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 shadow">
                        <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                )}

                {/* Play overlay (sempre disponível quando tem vídeo) */}
                {hasVideo && (
                    <>
                        {!isPlaying && (
                            <button
                                type="button"
                                onClick={togglePlay}
                                className={cn(
                                    'absolute flex cursor-pointer items-center justify-center',
                                    onSelect
                                        ? 'inset-0 z-[5] pointer-events-none [&>div]:pointer-events-auto'
                                        : 'group/play inset-0 transition-colors bg-foreground/0 hover:bg-foreground/20',
                                )}
                            >
                                <div className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors',
                                    onSelect
                                        ? 'bg-foreground/40 hover:bg-foreground/60'
                                        : 'bg-foreground/40 group-hover/play:bg-foreground/60',
                                )}>
                                    <Play
                                        className={cn(
                                            'ml-0.5 h-5 w-5 text-background transition-colors',
                                            !onSelect && 'group-hover/play:text-primary',
                                        )}
                                        fill="currentColor"
                                    />
                                </div>
                            </button>
                        )}

                        {isPlaying && (
                            <>
                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    className="absolute inset-0 flex cursor-pointer items-center justify-center bg-transparent opacity-0 transition-opacity hover:opacity-100 hover:bg-foreground/20"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/40 backdrop-blur-sm">
                                        <Pause
                                            className="h-5 w-5 text-background"
                                            fill="currentColor"
                                        />
                                    </div>
                                </button>
                                {/* Tela cheia – visível quando o vídeo está tocando */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={toggleFullscreen}
                                            className="absolute bottom-2 right-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-md bg-foreground/50 text-background backdrop-blur-sm transition-colors hover:bg-foreground/70"
                                            aria-label="Tela cheia"
                                        >
                                            <Maximize className="h-3 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Tela cheia</TooltipContent>
                                </Tooltip>
                            </>
                        )}
                    </>
                )}

                {!onSelect && (
                    <Badge
                        variant="outline"
                        className={cn(
                            'absolute left-2 top-2 pointer-events-none text-xs font-medium',
                            difficultyColors[exercise.difficulty_level],
                        )}
                    >
                        {difficultyLabels[exercise.difficulty_level] ?? exercise.difficulty_level}
                    </Badge>
                )}
            </div>

            {/* Conteúdo: nome + favorito + info */}
            <div className="flex flex-1 items-center justify-between gap-2 px-3 py-3">
                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
                        {exercise.name}
                    </h3>
                    {exercise.physio_area && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {exercise.physio_area.name}
                        </p>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {onToggleFavorite && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(exercise);
                                    }}
                                >
                                    <Star
                                        className={cn(
                                            'h-4 w-4',
                                            isFavorite && 'fill-amber-500 text-amber-500',
                                        )}
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            </TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onInfo?.(exercise);
                                }}
                            >
                                <Info className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalhes</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}
