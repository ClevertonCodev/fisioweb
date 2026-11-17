import { useEffect } from 'react';

import { cn } from '@/lib/utils';

import { ProtectedImage } from './ProtectedImage';
import {
    useProtectedPlayback,
    type ProtectedRefresh,
} from './use-protected-playback';

interface ProtectedVideoProps {
    videoUrl?: string | null;
    posterUrl?: string | null;
    className?: string;
    controls?: boolean;
    autoPlay?: boolean;
    onRefresh?: ProtectedRefresh;
    onRefreshPoster?: ProtectedRefresh;
    title?: string;
}

export function ProtectedVideo({
    videoUrl,
    posterUrl,
    className,
    controls = false,
    autoPlay = false,
    onRefresh,
    onRefreshPoster,
    title,
}: ProtectedVideoProps) {
    const { play, active, error, videoProps } = useProtectedPlayback({
        url: videoUrl,
        onRefresh,
    });

    useEffect(() => {
        if (autoPlay && videoUrl) void play();
    }, [autoPlay, play, videoUrl]);

    return (
        <div className={cn('relative size-full', className)}>
            {posterUrl && !active && (
                <ProtectedImage
                    src={posterUrl}
                    alt=""
                    onRefresh={onRefreshPoster}
                    className="pointer-events-none absolute inset-0 size-full object-cover"
                />
            )}
            <video
                {...videoProps}
                title={title}
                controls={controls}
                className="relative size-full object-cover"
                onPlay={(event) => {
                    const video = event.currentTarget;
                    if (!video.src.startsWith('blob:')) void play();
                }}
            />
            {error && (
                <p className="absolute inset-x-0 bottom-2 text-center text-xs text-white">
                    {error}
                </p>
            )}
        </div>
    );
}
