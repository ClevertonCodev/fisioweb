import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type MouseEvent,
} from 'react';

import { storageClient } from '@/infrastructure/api/storage-client';

export type ProtectedRefresh = () => Promise<string | null | undefined>;

interface UseProtectedPlaybackOptions {
    url?: string | null;
    onRefresh?: ProtectedRefresh;
}

async function download(source: string) {
    return storageClient.get<Blob>(source, {
        responseType: 'blob',
        validateStatus: () => true,
        headers: { Authorization: undefined },
    });
}

export function useProtectedPlayback({
    url,
    onRefresh,
}: UseProtectedPlaybackOptions) {
    const ref = useRef<HTMLVideoElement>(null);
    const blobUrl = useRef<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(false);

    useEffect(() => {
        return () => {
            if (blobUrl.current) {
                URL.revokeObjectURL(blobUrl.current);
                blobUrl.current = null;
            }
        };
    }, []);

    const attach = useCallback(async (source: string) => {
        const response = await download(source);
        if (response.status >= 400) {
            throw new Error('Não foi possível carregar o vídeo.');
        }

        const objectUrl = URL.createObjectURL(response.data);
        if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
        blobUrl.current = objectUrl;

        const video = ref.current;
        if (!video) {
            URL.revokeObjectURL(objectUrl);
            blobUrl.current = null;
            return;
        }

        video.src = objectUrl;
        setActive(true);
        await video.play();
    }, []);

    const play = useCallback(async () => {
        const video = ref.current;
        if (!video || !url) return;
        if (video.src.startsWith('blob:') && !video.paused) return;
        if (video.src.startsWith('blob:')) {
            await video.play();
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const first = await download(url);
            if (first.status === 403 && onRefresh) {
                const fresh = await onRefresh();
                if (!fresh || fresh === url) {
                    throw new Error('Não foi possível renovar o vídeo.');
                }
                await attach(fresh);
                return;
            }
            if (first.status >= 400) {
                throw new Error('Não foi possível carregar o vídeo.');
            }

            const objectUrl = URL.createObjectURL(first.data);
            if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
            blobUrl.current = objectUrl;
            video.src = objectUrl;
            setActive(true);
            await video.play();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : 'Não foi possível carregar o vídeo.',
            );
        } finally {
            setLoading(false);
        }
    }, [attach, onRefresh, url]);

    const seek = useCallback((time: number) => {
        const video = ref.current;
        if (video) video.currentTime = time;
    }, []);

    const toggleMuted = useCallback(() => {
        const video = ref.current;
        if (!video) return false;
        video.muted = !video.muted;
        return video.muted;
    }, []);

    return {
        ref,
        play,
        seek,
        toggleMuted,
        error,
        loading,
        active,
        videoProps: {
            ref,
            controlsList: 'nodownload' as const,
            playsInline: true,
            onContextMenu: (event: MouseEvent) => event.preventDefault(),
        },
    };
}
