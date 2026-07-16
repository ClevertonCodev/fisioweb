import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { uploadAndSyncClinicVideoReferenceImages } from '@/application/clinic/upload-video-reference-images';
import { apiClient } from '@/infrastructure/api/client';
import {
    apiClinicExercisesRepository,
    apiClinicVideosRepository,
} from '@/infrastructure/repositories';

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

export interface PhysioAreaOption {
    id: number;
    name: string;
}

/** Opções para o formulário de envio (categorias/áreas). */
export function useClinicExerciseOptions() {
    return useQuery({
        queryKey: ['clinic', 'exercises', 'options'],
        queryFn: async (): Promise<PhysioAreaOption[]> => {
            const { data } = await apiClient.get<{
                data: { physio_areas: PhysioAreaOption[] };
            }>('/clinic/exercises/options');
            return data?.data?.physio_areas ?? [];
        },
    });
}

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

export type SubmitStatus =
    | 'idle'
    | 'uploading'
    | 'confirming'
    | 'saving'
    | 'completed'
    | 'error';

export interface SubmitExerciseInput {
    name: string;
    physioAreaId: number;
    difficultyLevel: 'easy' | 'medium' | 'hard';
    description?: string | null;
    videoFile: File;
    thumbnailFile?: File | null;
    /** Até 2 imagens de referência para o PDF (opcional). */
    referenceImages?: (File | { file?: File } | null | undefined)[];
    duration?: number;
}

/**
 * Orquestra o upload presigned do vídeo (clínica) e a submissão do exercício
 * para revisão. O exercício nasce pendente, visível só para a própria clínica.
 */
export function useSubmitExercise() {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<SubmitStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const reset = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setStatus('idle');
        setProgress(0);
        setError(null);
    }, []);

    const abort = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setStatus('idle');
        setProgress(0);
    }, []);

    const mutation = useMutation({
        mutationFn: async (input: SubmitExerciseInput) => {
            if (!ALLOWED_VIDEO_MIMES.includes(input.videoFile.type)) {
                throw new Error(
                    'Formato não suportado. Use: MP4, MPEG, MOV, AVI, WebM, FLV, MKV.',
                );
            }
            if (input.videoFile.size > MAX_VIDEO_SIZE) {
                throw new Error(
                    `O vídeo excede o tamanho máximo de ${MAX_VIDEO_SIZE / 1024 / 1024}MB.`,
                );
            }
            if (input.thumbnailFile) {
                if (
                    !ALLOWED_THUMBNAIL_MIMES.includes(input.thumbnailFile.type)
                ) {
                    throw new Error('Thumbnail deve ser JPEG, PNG ou WebP.');
                }
                if (input.thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
                    throw new Error('A thumbnail não pode exceder 5MB.');
                }
            }

            const ac = new AbortController();
            abortRef.current = ac;
            setError(null);
            setProgress(0);

            setStatus('uploading');
            const presigned =
                await apiClinicVideosRepository.requestPresignedUpload({
                    filename: input.videoFile.name,
                    mime_type: input.videoFile.type,
                    size: input.videoFile.size,
                });
            await uploadToPresignedUrl(
                presigned.upload_url,
                input.videoFile,
                setProgress,
                ac.signal,
            );

            let thumbnailPath: string | undefined;
            if (input.thumbnailFile) {
                setProgress(0);
                const thumb =
                    await apiClinicVideosRepository.requestPresignedThumbnail(
                        presigned.video_id,
                        {
                            filename: input.thumbnailFile.name,
                            mime_type: input.thumbnailFile.type,
                            size: input.thumbnailFile.size,
                        },
                    );
                await uploadToPresignedUrl(
                    thumb.upload_url,
                    input.thumbnailFile,
                    setProgress,
                    ac.signal,
                );
                thumbnailPath = thumb.path;
            }

            setStatus('confirming');
            await apiClinicVideosRepository.confirmUpload(presigned.video_id, {
                thumbnail_path: thumbnailPath,
                original_filename: input.videoFile.name,
                duration: input.duration,
            });

            setStatus('saving');
            const exercise = await apiClinicExercisesRepository.submit({
                name: input.name,
                physioAreaId: input.physioAreaId,
                difficultyLevel: input.difficultyLevel,
                description: input.description,
                videoId: presigned.video_id,
            });

            const refs = (input.referenceImages ?? []).filter(Boolean);
            if (refs.length > 0) {
                await uploadAndSyncClinicVideoReferenceImages(
                    presigned.video_id,
                    input.referenceImages ?? [],
                );
            }

            setStatus('completed');
            abortRef.current = null;
            queryClient.invalidateQueries({
                queryKey: ['clinic', 'exercises'],
            });
            return exercise;
        },
        onError: (err) => {
            if (err instanceof DOMException && err.name === 'AbortError') {
                setStatus('idle');
                return;
            }
            setError(
                err instanceof Error
                    ? err.message
                    : 'Erro ao enviar exercício.',
            );
            setStatus('error');
        },
    });

    return {
        submit: mutation.mutateAsync,
        status,
        progress,
        error,
        abort,
        reset,
    };
}
