import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/video-player';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/types';

interface FloatingVideoPlayerProps {
    exercise: Exercise | null;
    onClose: () => void;
    className?: string;
}

export function FloatingVideoPlayer({ exercise, onClose, className }: FloatingVideoPlayerProps) {
    if (!exercise) return null;

    const video = exercise.videos?.[0];
    const src = video?.cdn_url;
    const poster = video?.thumbnail_url;

    if (!src) return null;

    return (
        <div
            className={cn(
                'fixed bottom-6 right-6 z-50 w-[360px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl transition-all',
                className,
            )}
        >
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
                <p className="min-w-0 truncate text-sm font-medium text-foreground">{exercise.name}</p>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <VideoPlayer src={src} poster={poster} title={exercise.name} className="aspect-video" />
        </div>
    );
}
