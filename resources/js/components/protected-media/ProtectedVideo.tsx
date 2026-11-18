import { Loader2, Play } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import { ProtectedImage } from './ProtectedImage';
import {
    mediaKey,
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

export function ProtectedVideo(props: ProtectedVideoProps) {
    return <ProtectedVideoPlayer key={mediaKey(props.videoUrl)} {...props} />;
}

function ProtectedVideoPlayer({
    videoUrl,
    posterUrl,
    className,
    controls = false,
    autoPlay = false,
    onRefresh,
    onRefreshPoster,
    title,
}: ProtectedVideoProps) {
    const { play, active, loading, error, videoProps } = useProtectedPlayback({
        url: videoUrl,
        onRefresh,
    });

    const autoPlayed = useRef(false);
    useEffect(() => {
        if (!autoPlay || !videoUrl || autoPlayed.current) return;
        autoPlayed.current = true;
        void play();
    }, [autoPlay, play, videoUrl]);

    const waiting = !!videoUrl && !active;

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
            {waiting && (
                <button
                    type="button"
                    aria-label={`Reproduzir ${title ?? 'vídeo'}`}
                    aria-busy={loading}
                    disabled={loading}
                    onClick={() => void play()}
                    className="absolute inset-0 z-[1] flex cursor-pointer items-center justify-center bg-black/10 text-white disabled:cursor-wait"
                >
                    {loading ? (
                        <Loader2 className="size-10 animate-spin drop-shadow-md" />
                    ) : (
                        <Play className="size-12 fill-current drop-shadow-md" />
                    )}
                </button>
            )}
            <video
                {...videoProps}
                title={title}
                controls={controls}
                className={cn(
                    'relative size-full object-cover',
                    waiting && 'invisible',
                )}
            />
            {error && (
                <p className="absolute inset-x-0 bottom-2 z-[2] text-center text-xs text-white drop-shadow-md">
                    {error}
                </p>
            )}
        </div>
    );
}
