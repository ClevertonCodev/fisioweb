import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/video-player';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/types';
import type { VideoData } from '@/types/video';

const difficultyLabels: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
};

const difficultyColors: Record<string, string> = {
    easy: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    medium: 'border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-400',
    hard: 'border-destructive/30 bg-destructive/20 text-destructive',
};

export interface VideoPlayerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Modo clínica: exercício com detalhes */
    exercise?: Exercise | null;
    /** Modo admin: vídeo com apenas o nome do arquivo */
    video?: VideoData | null;
}

export function VideoPlayerModal({
    open,
    onOpenChange,
    exercise = null,
    video = null,
}: VideoPlayerModalProps) {
    const exerciseVideo = exercise?.videos?.[0];
    const src = exerciseVideo?.cdn_url ?? video?.cdn_url ?? null;
    const poster = exerciseVideo?.thumbnail_url ?? video?.thumbnail_url ?? null;
    const title = exercise?.name ?? video?.original_filename ?? 'Vídeo';

    if (src == null) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl overflow-hidden border-border bg-card p-0">
                <VideoPlayer src={src} poster={poster} title={title} />

                {exercise ? (
                    <div className="border-t border-border p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h2 className="mb-1 text-lg font-semibold text-card-foreground">
                                    {exercise.name}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    {exercise.physio_area && (
                                        <span>{exercise.physio_area.name}</span>
                                    )}
                                    {exercise.muscle_group && (
                                        <>
                                            <span>•</span>
                                            <span>{exercise.muscle_group}</span>
                                        </>
                                    )}
                                    {exercise.body_region && (
                                        <>
                                            <span>•</span>
                                            <span>{exercise.body_region.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'shrink-0',
                                    difficultyColors[exercise.difficulty_level],
                                )}
                            >
                                {difficultyLabels[exercise.difficulty_level] ??
                                    exercise.difficulty_level}
                            </Badge>
                        </div>
                    </div>
                ) : video ? (
                    <div className="border-t border-border px-4 py-3">
                        <h2 className="text-base font-medium text-card-foreground">
                            {video.original_filename}
                        </h2>
                        {video.human_size && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {video.human_size}
                            </p>
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
