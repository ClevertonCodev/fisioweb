import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import type { AdminVideo } from '@/application/admin/ports';
import { apiAdminVideosRepository } from '@/infrastructure/repositories';

export function useAdminVideos(params?: { per_page?: number; page?: number }) {
    return useQuery({
        queryKey: ['admin', 'videos', params],
        queryFn: () => apiAdminVideosRepository.list(params),
    });
}

export function useAdminVideo(id: number | undefined) {
    return useQuery({
        queryKey: ['admin', 'video', id],
        queryFn: () =>
            id ? apiAdminVideosRepository.getById(id) : Promise.resolve(null),
        enabled: !!id,
        staleTime: 0,
        refetchOnMount: 'always',
    });
}

export function useUpdateAdminVideo(id: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            data: Parameters<typeof apiAdminVideosRepository.update>[1],
        ) => apiAdminVideosRepository.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'video', id] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'videos'] });
        },
    });
}

export function useDeleteAdminVideo() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiAdminVideosRepository.destroy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'videos'] });
        },
    });
}

const ALLOWED_VIDEO_MIMES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-flv',
    'video/x-matroska',
];
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_THUMBNAIL_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB

function uploadToPresignedUrl(
    url: string,
    file: File,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        signal.addEventListener('abort', () => {
            xhr.abort();
            reject(new DOMException('Upload cancelado', 'AbortError'));
        });
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable)
                onProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress(100);
                resolve();
            } else reject(new Error(`Falha no upload (${xhr.status})`));
        });
        xhr.addEventListener('error', () =>
            reject(new Error('Erro de rede durante o upload')),
        );
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
}

export type PresignedUploadStatus =
    | 'idle'
    | 'requesting'
    | 'uploading'
    | 'confirming'
    | 'completed'
    | 'error';

export interface UsePresignedUploadReturn {
    upload: (
        videoFile: File,
        thumbnailFile?: File | null,
        options?: {
            original_filename?: string;
            duration?: number;
            metadata?: Record<string, unknown>;
        },
    ) => Promise<AdminVideo | null>;
    abort: () => void;
    status: PresignedUploadStatus;
    progress: number;
    error: string | null;
    video: AdminVideo | null;
    reset: () => void;
}

export function usePresignedUpload(): UsePresignedUploadReturn {
    const [status, setStatus] = useState<PresignedUploadStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [video, setVideo] = useState<AdminVideo | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const queryClient = useQueryClient();

    const reset = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setStatus('idle');
        setProgress(0);
        setError(null);
        setVideo(null);
    }, []);

    const abort = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setStatus('idle');
        setProgress(0);
    }, []);

    const upload = useCallback(
        async (
            videoFile: File,
            thumbnailFile?: File | null,
            options?: {
                original_filename?: string;
                duration?: number;
                metadata?: Record<string, unknown>;
            },
        ): Promise<AdminVideo | null> => {
            if (!ALLOWED_VIDEO_MIMES.includes(videoFile.type)) {
                setError(
                    'Formato não suportado. Use: MP4, MPEG, MOV, AVI, WebM, FLV, MKV.',
                );
                setStatus('error');
                return null;
            }
            if (videoFile.size > MAX_VIDEO_SIZE) {
                setError(
                    `O vídeo excede o tamanho máximo de ${MAX_VIDEO_SIZE / 1024 / 1024}MB.`,
                );
                setStatus('error');
                return null;
            }
            if (thumbnailFile) {
                if (!ALLOWED_THUMBNAIL_MIMES.includes(thumbnailFile.type)) {
                    setError('Thumbnail deve ser JPEG, PNG ou WebP.');
                    setStatus('error');
                    return null;
                }
                if (thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
                    setError('A thumbnail não pode exceder 5MB.');
                    setStatus('error');
                    return null;
                }
            }

            const ac = new AbortController();
            abortRef.current = ac;
            setError(null);
            setProgress(0);
            setVideo(null);

            try {
                setStatus('requesting');
                const presigned =
                    await apiAdminVideosRepository.requestPresignedUpload({
                        filename: videoFile.name,
                        mime_type: videoFile.type,
                        size: videoFile.size,
                    });
                if (ac.signal.aborted) return null;

                setStatus('uploading');
                await uploadToPresignedUrl(
                    presigned.upload_url,
                    videoFile,
                    setProgress,
                    ac.signal,
                );
                if (ac.signal.aborted) return null;

                let thumbnailPath: string | undefined;
                if (thumbnailFile) {
                    setProgress(0);
                    const thumb =
                        await apiAdminVideosRepository.requestPresignedThumbnail(
                            presigned.video_id,
                            {
                                filename: thumbnailFile.name,
                                mime_type: thumbnailFile.type,
                                size: thumbnailFile.size,
                            },
                        );
                    if (ac.signal.aborted) return null;
                    await uploadToPresignedUrl(
                        thumb.upload_url,
                        thumbnailFile,
                        setProgress,
                        ac.signal,
                    );
                    if (ac.signal.aborted) return null;
                    thumbnailPath = thumb.path;
                }

                setStatus('confirming');
                const confirmed = await apiAdminVideosRepository.confirmUpload(
                    presigned.video_id,
                    {
                        thumbnail_path: thumbnailPath,
                        original_filename: options?.original_filename,
                        duration: options?.duration,
                        metadata: options?.metadata,
                    },
                );
                setVideo(confirmed);
                setStatus('completed');
                abortRef.current = null;
                queryClient.invalidateQueries({
                    queryKey: ['admin', 'videos'],
                });
                return confirmed;
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    setStatus('idle');
                    return null;
                }
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Erro desconhecido no upload',
                );
                setStatus('error');
                return null;
            }
        },
        [queryClient],
    );

    return { upload, abort, status, progress, error, video, reset };
}
