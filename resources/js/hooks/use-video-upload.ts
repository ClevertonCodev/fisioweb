import { useCallback, useState } from 'react';

import {
    MAX_VIDEO_SIZE_BYTES,
    type VideoUploadResult,
    uploadVideoFile,
} from '@/lib/video-upload';

export interface UseVideoUploadOptions {
    onSuccess?: (result: VideoUploadResult) => void;
    onError?: (error: Error) => void;
}

export function useVideoUpload(options: UseVideoUploadOptions = {}) {
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<VideoUploadResult | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const upload = useCallback(
        async (file: File) => {
            setError(null);
            setResult(null);
            setProgress(0);

            if (file.size > MAX_VIDEO_SIZE_BYTES) {
                const err = new Error('O vídeo deve ter no máximo 10 MB.');
                setError(err.message);
                options.onError?.(err);
                return;
            }

            setIsUploading(true);
            try {
                const { data } = await uploadVideoFile(file, {
                    onProgress: (p) => setProgress(p),
                });
                setResult(data);
                setProgress(100);
                options.onSuccess?.(data);
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Falha no upload.');
                setError(err.message);
                options.onError?.(err);
            } finally {
                setIsUploading(false);
            }
        },
        [options]
    );

    const reset = useCallback(() => {
        setProgress(0);
        setError(null);
        setResult(null);
        setIsUploading(false);
    }, []);

    return { upload, progress, error, result, isUploading, reset };
}
