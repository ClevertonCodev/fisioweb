import { useCallback, useRef, useState } from 'react';

import type {
    PresignedUploadOptions,
    PresignedUploadResponse,
    UploadStatus,
    UsePresignedUploadReturn,
    VideoData,
} from '@/types/video';

const ALLOWED_VIDEO_MIMES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-flv',
    'video/x-matroska',
];

const MAX_VIDEO_SIZE = 20971520;

const ALLOWED_THUMBNAIL_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_THUMBNAIL_SIZE = 5242880;

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

async function apiRequest<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Erro na requisição (${response.status})`);
    }

    return response.json();
}

function uploadToR2(
    url: string,
    file: File,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        const onAbort = () => {
            xhr.abort();
            reject(new DOMException('Upload cancelado', 'AbortError'));
        };

        signal.addEventListener('abort', onAbort);

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            signal.removeEventListener('abort', onAbort);
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress(100);
                resolve();
            } else {
                reject(new Error(`Falha no upload para o storage (${xhr.status})`));
            }
        });

        xhr.addEventListener('error', () => {
            signal.removeEventListener('abort', onAbort);
            reject(new Error('Erro de rede durante o upload'));
        });

        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
}

export function usePresignedUpload(): UsePresignedUploadReturn {
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [video, setVideo] = useState<VideoData | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const reset = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setStatus('idle');
        setProgress(0);
        setError(null);
        setVideo(null);
    }, []);

    const abort = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setStatus('idle');
        setProgress(0);
    }, []);

    const upload = useCallback(
        async (
            videoFile: File,
            thumbnailFile?: File | null,
            options?: PresignedUploadOptions,
        ): Promise<VideoData | null> => {
            if (!ALLOWED_VIDEO_MIMES.includes(videoFile.type)) {
                const msg =
                    'Formato de vídeo não suportado. Use: MP4, MPEG, MOV, AVI, WebM, FLV, MKV.';
                setError(msg);
                setStatus('error');
                return null;
            }

            if (videoFile.size > MAX_VIDEO_SIZE) {
                const maxMB = Math.round(MAX_VIDEO_SIZE / 1048576);
                const msg = `O vídeo excede o tamanho máximo de ${maxMB}MB.`;
                setError(msg);
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

            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            try {
                setError(null);
                setProgress(0);
                setVideo(null);

                setStatus('requesting');

                const { data: presigned } =
                    await apiRequest<{ data: PresignedUploadResponse }>(
                        '/admin/videos/presigned-upload-request',
                        {
                            filename: videoFile.name,
                            mime_type: videoFile.type,
                            size: videoFile.size,
                        },
                    );

                if (abortController.signal.aborted) return null;

                setStatus('uploading');

                await uploadToR2(
                    presigned.upload_url,
                    videoFile,
                    setProgress,
                    abortController.signal,
                );

                if (abortController.signal.aborted) return null;

                let thumbnailPath: string | undefined;

                if (thumbnailFile) {
                    setProgress(0);

                    const { data: thumbPresigned } =
                        await apiRequest<{ data: import('@/types/video').PresignedThumbnailResponse }>(
                            `/admin/videos/${presigned.video_id}/presigned-thumbnail-request`,
                            {
                                filename: thumbnailFile.name,
                                mime_type: thumbnailFile.type,
                                size: thumbnailFile.size,
                            },
                        );

                    if (abortController.signal.aborted) return null;

                    await uploadToR2(
                        thumbPresigned.upload_url,
                        thumbnailFile,
                        setProgress,
                        abortController.signal,
                    );

                    if (abortController.signal.aborted) return null;

                    thumbnailPath = thumbPresigned.path;
                }

                setStatus('confirming');

                const confirmBody: Record<string, unknown> = {};
                if (thumbnailPath) confirmBody.thumbnail_path = thumbnailPath;
                if (options?.original_filename) confirmBody.original_filename = options.original_filename;
                if (options?.duration != null) confirmBody.duration = options.duration;
                if (options?.metadata && Object.keys(options.metadata).length > 0) {
                    confirmBody.metadata = options.metadata;
                }

                const { data: confirmedVideo } = await apiRequest<{ data: VideoData }>(
                    `/admin/videos/${presigned.video_id}/confirm-upload`,
                    confirmBody,
                );

                setVideo(confirmedVideo);
                setStatus('completed');
                abortControllerRef.current = null;

                return confirmedVideo;
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    setStatus('idle');
                    return null;
                }

                const message =
                    err instanceof Error ? err.message : 'Erro desconhecido no upload';
                setError(message);
                setStatus('error');
                return null;
            }
        },
        [],
    );

    return { upload, abort, status, progress, error, video, reset };
}
