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
    if (!src) return null;

    return (
        <div className="max-w-sm overflow-hidden rounded-lg border border-border">
            <video
                src={src}
                poster={poster ?? undefined}
                title={title}
                controls
                className="aspect-video w-full object-contain"
            />
        </div>
    );
}
