import { useEffect, useState } from 'react';

/**
 * Controla skeleton de vídeo/thumbnail até a mídia estar pronta
 * (poster carregado ou first frame do vídeo).
 */
export function useMediaReady(
    thumbnailUrl?: string | null,
    videoUrl?: string | null,
) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setReady(false);

        if (!thumbnailUrl && !videoUrl) {
            setReady(true);
            return undefined;
        }

        if (thumbnailUrl) {
            let cancelled = false;
            const img = new Image();
            img.onload = () => {
                if (!cancelled) setReady(true);
            };
            img.onerror = () => {
                if (!cancelled) setReady(true);
            };
            img.src = thumbnailUrl;
            return () => {
                cancelled = true;
            };
        }

        return undefined;
    }, [thumbnailUrl, videoUrl]);

    return {
        ready,
        markReady: () => setReady(true),
    };
}
