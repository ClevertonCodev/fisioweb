import { Maximize, Play } from 'lucide-react';
import { useState } from 'react';

import { ProtectedImage } from '@/components/protected-media/ProtectedImage';
import {
    mediaKey,
    useProtectedPlayback,
    type ProtectedRefresh,
} from '@/components/protected-media/use-protected-playback';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface VideoThumbProps {
    videoUrl?: string | null;
    thumbnailUrl?: string | null;
    /** Tamanho dos controles. 'sm' para miniaturas, 'lg' para cards grandes. */
    size?: 'sm' | 'lg';
    /** Exibe o botão de tela cheia no canto inferior direito. */
    showFullscreen?: boolean;
    className?: string;
    onRefresh?: ProtectedRefresh;
    onRefreshPoster?: ProtectedRefresh;
}

/**
 * Player de miniatura estilo Vedius (cores do sistema): triângulo branco de play,
 * botão "parar" (círculo com quadrado) no hover e opção de tela cheia.
 * Deve ser usado dentro de um container `.group.relative`.
 */
export function VideoThumb(props: VideoThumbProps) {
    return <VideoThumbPlayer key={mediaKey(props.videoUrl)} {...props} />;
}

function VideoThumbPlayer({
    videoUrl,
    thumbnailUrl,
    size = 'sm',
    showFullscreen = true,
    className,
    onRefresh,
    onRefreshPoster,
}: VideoThumbProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [posterReady, setPosterReady] = useState(!thumbnailUrl);
    const playback = useProtectedPlayback({ url: videoUrl, onRefresh });

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = playback.ref.current;
        if (!video) return;
        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
        } else {
            void playback.play().then(setIsPlaying);
        }
    };

    const handleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = playback.ref.current;
        if (!video) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            video.requestFullscreen?.();
        }
    };

    const playCls = size === 'lg' ? 'h-9 w-9' : 'h-7 w-7';
    const stopCircleCls = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
    const stopSquareCls = size === 'lg' ? 'h-3.5 w-3.5' : 'h-3 w-3';

    return (
        <>
            {!posterReady && (
                <Skeleton className="absolute inset-0 z-[1] h-full w-full rounded-none" />
            )}
            {thumbnailUrl && !playback.active && (
                <ProtectedImage
                    src={thumbnailUrl}
                    alt=""
                    onRefresh={onRefreshPoster}
                    onLoad={() => setPosterReady(true)}
                    className="absolute inset-0 size-full object-cover"
                />
            )}
            <video
                {...playback.videoProps}
                className={cn(
                    'h-full w-full object-cover transition-opacity duration-200',
                    className,
                )}
                onEnded={() => setIsPlaying(false)}
                onLoadedData={() => setPosterReady(true)}
            />
            {playback.error && (
                <p className="pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center text-xs text-white drop-shadow-md">
                    {playback.error}
                </p>
            )}

            {posterReady && (
                <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Parar' : 'Reproduzir'}
                    className={cn(
                        'absolute inset-0 flex cursor-pointer items-center justify-center bg-transparent transition-all duration-200 group-hover:bg-primary/25',
                        isPlaying && 'opacity-0 hover:opacity-100',
                    )}
                >
                    {isPlaying ? (
                        <span
                            className={cn(
                                'flex items-center justify-center rounded-full border-2 border-white drop-shadow-md',
                                stopCircleCls,
                            )}
                        >
                            <span
                                className={cn(
                                    'rounded-[2px] bg-white',
                                    stopSquareCls,
                                )}
                            />
                        </span>
                    ) : (
                        <Play
                            className={cn(
                                'ml-0.5 fill-white text-white drop-shadow-md transition-transform duration-200 group-hover:scale-110',
                                playCls,
                            )}
                        />
                    )}
                </button>
            )}

            {posterReady && showFullscreen && (
                <button
                    onClick={handleFullscreen}
                    title="Ver em tela cheia"
                    aria-label="Ver em tela cheia"
                    className="absolute right-1.5 bottom-1.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-white opacity-0 drop-shadow-md transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/30"
                >
                    <Maximize className="h-3.5 w-3.5" />
                </button>
            )}
        </>
    );
}
