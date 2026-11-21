import { ProtectedVideo } from '@/components/protected-media/ProtectedVideo';
import type { ProtectedRefresh } from '@/components/protected-media/use-protected-playback';

interface AdminExerciseVideoPreviewProps {
    src: string | null;
    poster?: string | null;
    title?: string;
    onRefresh?: ProtectedRefresh;
    onRefreshPoster?: ProtectedRefresh;
}

export function AdminExerciseVideoPreview({
    src,
    poster,
    title,
    onRefresh,
    onRefreshPoster,
}: AdminExerciseVideoPreviewProps) {
    if (!src) return null;

    return (
        <ProtectedVideo
            videoUrl={src}
            posterUrl={poster}
            title={title}
            onRefresh={onRefresh}
            onRefreshPoster={onRefreshPoster}
            controls
            className="aspect-video max-w-sm overflow-hidden rounded-lg border border-border bg-muted"
        />
    );
}
