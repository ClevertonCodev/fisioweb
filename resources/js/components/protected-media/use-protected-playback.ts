import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type MouseEvent,
} from 'react';

import { downloadProtectedMedia } from '@/application/protected-media';

export type ProtectedRefresh = () => Promise<string | null | undefined>;

interface UseProtectedPlaybackOptions {
    url?: string | null;
    onRefresh?: ProtectedRefresh;
}

const LOAD_ERROR = 'Não foi possível carregar o vídeo.';
const REFRESH_ERROR = 'Não foi possível renovar o vídeo.';

let lastRequested: HTMLVideoElement | null = null;

/** O link assinado muda a cada resposta da API; o caminho, sem a assinatura, identifica o arquivo. */
export function mediaKey(url?: string | null): string | null {
    return url ? url.split('?')[0] : null;
}

async function startPlayback(video: HTMLVideoElement): Promise<boolean> {
    try {
        await video.play();
        return true;
    } catch {
        return false;
    }
}

export function useProtectedPlayback({
    url,
    onRefresh,
}: UseProtectedPlaybackOptions) {
    const ref = useRef<HTMLVideoElement>(null);
    const blobUrl = useRef<string | null>(null);
    const blobKey = useRef<string | null>(null);
    const currentKey = useRef<string | null>(mediaKey(url));
    const shownKey = useRef<string | null>(mediaKey(url));
    const pending = useRef<{
        key: string | null;
        promise: Promise<boolean>;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(false);

    const key = mediaKey(url);

    const release = useCallback(() => {
        if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
        blobUrl.current = null;
        blobKey.current = null;
    }, []);

    useEffect(() => release, [release]);

    useEffect(() => {
        currentKey.current = key;
        if (shownKey.current === key) return;
        shownKey.current = key;
        if (blobKey.current === key) return;
        pending.current = null;
        const video = ref.current;
        if (video) {
            video.pause();
            video.removeAttribute('src');
            video.load();
        }
        release();
        setActive(false);
        setError(null);
    }, [key, release]);

    const attach = useCallback(
        async (
            data: Blob,
            downloadedKey: string | null,
            accepted: (string | null)[],
        ) => {
            const video = ref.current;
            if (!video || !accepted.includes(currentKey.current)) return false;

            const objectUrl = URL.createObjectURL(data);
            if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
            blobUrl.current = objectUrl;
            blobKey.current = downloadedKey;
            video.src = objectUrl;
            setActive(true);
            if (lastRequested !== video) return false;
            return startPlayback(video);
        },
        [],
    );

    const load = useCallback(
        async (source: string) => {
            const requestedKey = mediaKey(source);
            let downloadedKey = requestedKey;
            setLoading(true);
            setError(null);
            try {
                let response = await downloadProtectedMedia(source);
                if (response.status === 403 && onRefresh) {
                    const fresh = await onRefresh();
                    if (!fresh) throw new Error(REFRESH_ERROR);
                    downloadedKey = mediaKey(fresh);
                    response = await downloadProtectedMedia(fresh);
                }
                if (response.status >= 400) throw new Error(LOAD_ERROR);
                return await attach(response.data, downloadedKey, [
                    requestedKey,
                    downloadedKey,
                ]);
            } catch (cause) {
                setError(
                    cause instanceof Error && cause.message === REFRESH_ERROR
                        ? REFRESH_ERROR
                        : LOAD_ERROR,
                );
                return false;
            } finally {
                setLoading(false);
            }
        },
        [attach, onRefresh],
    );

    const play = useCallback(async () => {
        const video = ref.current;
        if (!video || !url) return false;
        lastRequested = video;
        if (blobKey.current === key && video.src.startsWith('blob:')) {
            setError(null);
            return video.paused ? startPlayback(video) : true;
        }
        if (pending.current?.key === key) return pending.current.promise;

        const promise: Promise<boolean> = load(url).finally(() => {
            if (pending.current?.promise === promise) pending.current = null;
        });
        pending.current = { key, promise };
        return promise;
    }, [key, load, url]);

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
            onPlaying: () => setError(null),
        },
    };
}
