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

    // Ajuste durante o render: trocar de mídia volta ao estado "carregando".
    const mediaKey = `${thumbnailUrl ?? ''}|${videoUrl ?? ''}`;
    const [lastMediaKey, setLastMediaKey] = useState(mediaKey);
    if (lastMediaKey !== mediaKey) {
        setLastMediaKey(mediaKey);
        setReady(false);
    }

    useEffect(() => {
        if (!thumbnailUrl) return undefined;

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
    }, [thumbnailUrl]);

    return {
        // Sem mídia nenhuma não há o que esperar: derivado, não guardado em state.
        ready: ready || (!thumbnailUrl && !videoUrl),
        markReady: () => setReady(true),
    };
}
