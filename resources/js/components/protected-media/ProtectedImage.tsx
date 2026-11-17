import { useState } from 'react';

import type { ProtectedRefresh } from './use-protected-playback';

interface ProtectedImageProps {
    src?: string | null;
    alt: string;
    className?: string;
    onRefresh?: ProtectedRefresh;
    onLoad?: () => void;
}

export function ProtectedImage({
    src,
    alt,
    className,
    onRefresh,
    onLoad,
}: ProtectedImageProps) {
    const [current, setCurrent] = useState(src);
    const [tried, setTried] = useState(false);
    const [seenSrc, setSeenSrc] = useState(src);

    if (src !== seenSrc) {
        setSeenSrc(src);
        setCurrent(src);
        setTried(false);
    }

    return (
        <img
            src={current || undefined}
            alt={alt}
            className={className}
            onLoad={onLoad}
            onError={() => {
                onLoad?.();
                if (tried || !onRefresh || !current) return;
                setTried(true);
                void onRefresh().then((fresh) => {
                    if (fresh) setCurrent(fresh);
                });
            }}
        />
    );
}
