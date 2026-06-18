import { Info, Pause, Pencil, Play, Star, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
            {/* Thumbnail / Video Container */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-muted">
                <video
                    ref={videoRef}
                    src={videoUrl ?? undefined}
                    poster={thumbnailUrl ?? undefined}
                    className="h-full w-full object-cover"
                    onEnded={handleVideoEnded}
                    playsInline
                />

                {/* Play/Pause Button Overlay */}
                {canPlay && (
                    <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex cursor-pointer items-center justify-center"
                    >
                        {!isPlaying && (
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/30 bg-background/80 shadow-lg backdrop-blur-md transition-transform duration-200 group-hover:scale-110">
                                <Play className="ml-0.5 h-6 w-6 text-foreground" />
                            </div>
                        )}
                    </button>
                )}

                {/* Pause overlay on hover when playing */}
                {isPlaying && (
                    <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex cursor-pointer items-center justify-center opacity-0 transition-opacity duration-200 hover:opacity-100"
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/30 bg-background/80 shadow-lg backdrop-blur-md">
                            <Pause className="h-6 w-6 text-foreground" />
                        </div>
                    </button>
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
