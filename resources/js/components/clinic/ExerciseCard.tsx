import { Dumbbell, Info, Maximize, Pause, Play, Star } from 'lucide-react';
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
}

export function ExerciseCard({
    exercise,
    onToggleFavorite,
    onInfo,
    isFavorite = false,
}: ExerciseCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
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
        const el = videoRef.current;
        if (!el || !hasVideo) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            el.requestFullscreen().catch(() => {});
        }
    };

    return (
        <div className="group relative flex h-[343px] w-[261px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
            {/* Área do vídeo 261x261 */}
            <div className="relative h-[261px] w-[261px] shrink-0 overflow-hidden rounded-t-lg bg-muted">
                {hasVideo ? (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        poster={thumbnailUrl ?? undefined}
                        className="h-full w-full object-cover"
                        onEnded={handleVideoEnded}
                        playsInline
                    />
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

                {/* Play overlay (só quando tem vídeo) */}
                {hasVideo && (
                    <>
                        {!isPlaying && (
                            <button
                                type="button"
                                onClick={togglePlay}
                                className="absolute inset-0 flex items-center justify-center transition-colors bg-foreground/0 group-hover:bg-foreground/20"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/40 shadow-sm backdrop-blur-sm transition-colors group-hover:bg-foreground/60">
                                    <Play
                                        className="ml-0.5 h-5 w-5 text-background"
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
                                    className="absolute inset-0 flex items-center justify-center bg-transparent opacity-0 transition-opacity hover:opacity-100 hover:bg-foreground/20"
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
                                            className="absolute bottom-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-md bg-foreground/50 text-background backdrop-blur-sm transition-colors hover:bg-foreground/70"
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

                <Badge
                    variant="outline"
                    className={cn(
                        'absolute left-2 top-2 pointer-events-none text-xs font-medium',
                        difficultyColors[exercise.difficulty_level],
                    )}
                >
                    {difficultyLabels[exercise.difficulty_level] ?? exercise.difficulty_level}
                </Badge>
            </div>

            {/* Conteúdo: nome + (i) na mesma linha */}
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
                                    onClick={() => onToggleFavorite(exercise)}
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
                                onClick={() => onInfo?.(exercise)}
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
