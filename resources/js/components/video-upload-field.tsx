import { Upload } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ACCEPT_VIDEO, MAX_VIDEO_SIZE_BYTES } from '@/lib/video-upload';
import { useVideoUpload } from '@/hooks/use-video-upload';

const MAX_MB = MAX_VIDEO_SIZE_BYTES / (1024 * 1024);

export interface VideoUploadFieldProps {
    onVideoUploaded?: (result: { id: number; cdn_url?: string; url?: string; filename: string }) => void;
    className?: string;
    disabled?: boolean;
}

export function VideoUploadField({
    onVideoUploaded,
    className,
    disabled = false,
}: VideoUploadFieldProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { upload, progress, error, result, isUploading, reset } = useVideoUpload({
        onSuccess: (data) => onVideoUploaded?.({ id: data.id, cdn_url: data.cdn_url, url: data.url, filename: data.filename }),
    });

    const handleChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = '';
        },
        [upload]
    );

    const handleClick = () => {
        if (result) reset();
        inputRef.current?.click();
    };

    return (
        <div className={cn('space-y-2', className)}>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT_VIDEO}
                onChange={handleChange}
                className="hidden"
                disabled={disabled || isUploading}
            />
            <Button
                type="button"
                variant="outline"
                onClick={handleClick}
                disabled={disabled || isUploading}
                className="w-full gap-2"
            >
                <Upload className="size-4" />
                {isUploading ? `Enviando... ${progress}%` : result ? 'Enviar outro vídeo' : `Selecionar vídeo (máx. ${MAX_MB} MB)`}
            </Button>

            {progress > 0 && progress < 100 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                        className="h-full bg-primary transition-[width] duration-200"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {error && (
                <p className="text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}

            {result && !isUploading && (
                <p className="text-sm text-muted-foreground">
                    ✓ {result.original_filename}
                </p>
            )}
        </div>
    );
}
