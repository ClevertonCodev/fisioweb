import { Info, Maximize, Pencil, Play, Star, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMediaReady } from '@/hooks/use-media-ready';
import { cn } from '@/lib/utils';

interface ExerciseCardProps {
    videoUrl: string | null | undefined;
    thumbnailUrl?: string | null;
    title: string;
    subtitle?: string;
    /** Badge exibida no canto superior esquerdo (dificuldade ou status) */
    badge?: ReactNode;
    /** Controla a estrela de favorito. Quando undefined, a estrela não é renderizada */
    isFavorite?: boolean;
    /** Quando false, o overlay de play é escondido (ex: vídeo não processado) */
    canPlay?: boolean;
    onToggleFavorite?: () => void;
    onInfo?: () => void;
    /** Quando fornecido, exibe botão de editar no footer */
    onEdit?: () => void;
    /** Quando fornecido, exibe botão de excluir no footer */
    onDelete?: () => void;
}

export function ExerciseCard({
    videoUrl,
    thumbnailUrl,
    title,
    subtitle,
    badge,
    isFavorite,
    canPlay = true,
    onToggleFavorite,
    onInfo,
    onEdit,
    onDelete,
}: ExerciseCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const { ready, markReady } = useMediaReady(thumbnailUrl, videoUrl);

    const togglePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
        } else {
            video.play();
            setIsPlaying(true);
        }
    };

    const handleVideoEnded = () => {
        setIsPlaying(false);
    };

    const handleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            video.requestFullscreen?.();
        }
    };

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
            {/* Thumbnail / Video Container — vídeo com respiro (padding) como no Vedius */}
            <div className="relative mx-3 mt-3 aspect-square overflow-hidden rounded-lg bg-muted">
                {!ready && (
                    <Skeleton className="absolute inset-0 z-[1] h-full w-full rounded-none" />
                )}
                <video
                    ref={videoRef}
                    src={videoUrl ?? undefined}
                    poster={thumbnailUrl ?? undefined}
                    className={cn(
                        'h-full w-full object-cover transition-opacity duration-200',
                        !ready && 'opacity-0',
                    )}
                    onEnded={handleVideoEnded}
                    onLoadedData={markReady}
                    onError={markReady}
                    playsInline
                />

                {/* Overlay de player — estilo Vedius (cores do sistema) */}
                {canPlay && ready && (
                    <>
                        <button
                            onClick={togglePlay}
                            aria-label={isPlaying ? 'Parar' : 'Reproduzir'}
                            className={cn(
                                'absolute inset-0 flex cursor-pointer items-center justify-center transition-all duration-200',
                                'bg-transparent group-hover:bg-primary/25',
                                isPlaying && 'opacity-0 hover:opacity-100',
                            )}
                        >
                            {isPlaying ? (
                                // Botão "parar" — círculo com quadrado, igual ao Vedius
                                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white drop-shadow-md">
                                    <span className="h-3.5 w-3.5 rounded-[2px] bg-white" />
                                </span>
                            ) : (
                                <Play className="ml-0.5 h-9 w-9 fill-white text-white drop-shadow-md transition-transform duration-200 group-hover:scale-110" />
                            )}
                        </button>

                        {/* Tela cheia — canto inferior direito */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleFullscreen}
                                    aria-label="Ver em tela cheia"
                                    className="absolute right-2 bottom-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-white opacity-0 drop-shadow-md transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/30"
                                >
                                    <Maximize className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Ver em tela cheia</TooltipContent>
                        </Tooltip>
                    </>
                )}

                {/* Top Left Badge */}
                {badge && (
                    <div className="pointer-events-none absolute top-2 left-2">
                        {badge}
                    </div>
                )}

                {/* Favorite Star — só renderiza quando onToggleFavorite for fornecido */}
                {onToggleFavorite !== undefined && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite();
                                }}
                                className={cn(
                                    'absolute top-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all',
                                    isFavorite
                                        ? 'bg-warning/20 text-warning'
                                        : 'bg-background/60 text-muted-foreground opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:text-warning',
                                )}
                            >
                                <Star
                                    className={cn(
                                        'h-4 w-4',
                                        isFavorite && 'fill-warning',
                                    )}
                                />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {isFavorite
                                ? 'Remover dos favoritos'
                                : 'Adicionar aos favoritos'}
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>

            {/* Content Row */}
            <div className="flex flex-1 items-start justify-between gap-2 p-3">
                <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[11px] leading-snug font-medium text-card-foreground">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-0.5">
                    {onInfo && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
                                    onClick={onInfo}
                                >
                                    <Info className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalhes</TooltipContent>
                        </Tooltip>
                    )}
                    {onEdit && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={onEdit}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar vídeo</TooltipContent>
                        </Tooltip>
                    )}
                    {onDelete && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    onClick={onDelete}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir vídeo</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    );
}
