import { Maximize, Play } from 'lucide-react';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface VideoThumbProps {
    videoUrl?: string | null;
    thumbnailUrl?: string | null;
    /** Tamanho dos controles. 'sm' para miniaturas, 'lg' para cards grandes. */
    size?: 'sm' | 'lg';
    /** Exibe o botão de tela cheia no canto inferior direito. */
    showFullscreen?: boolean;
    className?: string;
}

/**
 * Player de miniatura estilo Vedius (cores do sistema): triângulo branco de play,
 * botão "parar" (círculo com quadrado) no hover e opção de tela cheia.
 * Deve ser usado dentro de um container `.group.relative`.
 */
export function VideoThumb({
    videoUrl,
    thumbnailUrl,
    size = 'sm',
    showFullscreen = true,
    className,
}: VideoThumbProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = (e: React.MouseEvent) => {
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

    const playCls = size === 'lg' ? 'h-9 w-9' : 'h-7 w-7';
    const stopCircleCls = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
    const stopSquareCls = size === 'lg' ? 'h-3.5 w-3.5' : 'h-3 w-3';

    return (
        <>
            <video
                ref={videoRef}
                src={videoUrl ?? undefined}
                poster={thumbnailUrl ?? undefined}
                className={cn('h-full w-full object-cover', className)}
                onEnded={() => setIsPlaying(false)}
                controlsList="nodownload"
                playsInline
            />

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

            {showFullscreen && (
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
