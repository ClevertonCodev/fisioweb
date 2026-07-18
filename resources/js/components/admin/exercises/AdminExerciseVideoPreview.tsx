import { Skeleton } from '@/components/ui/skeleton';
import { useMediaReady } from '@/hooks/use-media-ready';
import { cn } from '@/lib/utils';

interface AdminExerciseVideoPreviewProps {
    src: string | null;
    poster?: string | null;
    title?: string;
}

export function AdminExerciseVideoPreview({
    src,
    poster,
    title,
}: AdminExerciseVideoPreviewProps) {
    const { ready, markReady } = useMediaReady(poster, src);

    if (!src) return null;

    return (
        <div className="relative max-w-sm overflow-hidden rounded-lg border border-border bg-muted">
            {!ready && (
                <Skeleton className="absolute inset-0 z-[1] aspect-video w-full rounded-none" />
            )}
            <video
                src={src}
                poster={poster ?? undefined}
                title={title}
                controls
                className={cn(
                    'aspect-video w-full object-contain transition-opacity duration-200',
                    !ready && 'opacity-0',
                )}
                onLoadedData={markReady}
                onError={markReady}
            />
        </div>
    );
}
