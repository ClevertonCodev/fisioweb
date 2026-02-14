import { Info, Play, Trash2, Video } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { VideoData } from '@/types/video';

const statusColors: Record<
    string,
    string
> = {
    completed:
        'border-emerald-500/30 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    pending:
        'border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-400',
    processing:
        'border-blue-500/30 bg-blue-500/20 text-blue-700 dark:text-blue-400',
    failed: 'border-destructive/30 bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, string> = {
    completed: 'Concluído',
    pending: 'Pendente',
    processing: 'Processando',
    failed: 'Falhou',
};

interface VideoCardProps {
    video: VideoData;
    onPlay?: (video: VideoData) => void;
    onDelete?: (video: VideoData) => void;
    onInfo?: (video: VideoData) => void;
}

export function VideoCard({
    video,
    onPlay,
    onDelete,
    onInfo,
}: VideoCardProps) {
    const canPlay = video.status === 'completed' && video.cdn_url;

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="relative aspect-video overflow-hidden bg-muted">
                {video.thumbnail_url ? (
                    <img
                        src={video.thumbnail_url}
                        alt={video.original_filename}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
                {canPlay && (
                    <button
                        type="button"
                        onClick={() => onPlay?.(video)}
                        className="absolute inset-0 flex items-center justify-center bg-foreground/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
                            <Play className="ml-1 h-6 w-6 text-primary-foreground" />
                        </div>
                    </button>
                )}
                <Badge
                    variant="outline"
                    className={cn(
                        'absolute left-2 top-2 text-xs font-medium',
                        statusColors[video.status] ?? statusColors.pending,
                    )}
                >
                    {statusLabels[video.status] ?? video.status}
                </Badge>
            </div>
            <div className="flex-1 p-3">
                <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
                    {video.original_filename}
                </h3>
                {video.human_size && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {video.human_size}
                    </p>
                )}
            </div>
            <div className="flex items-center justify-end gap-1 px-3 pb-3">
                {onInfo && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => onInfo(video)}
                            >
                                <Info className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalhes</TooltipContent>
                    </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDelete?.(video)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir vídeo</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}
