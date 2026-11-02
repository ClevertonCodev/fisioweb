import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { authErrorMessage } from '@/application/clinic/clinic-password';
import {
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    MAX_IMAGE_MB,
    MAX_VIDEO_MB,
} from '@/application/clinic/exercise-media-limits';
import { uploadAndSyncClinicVideoReferenceImages } from '@/application/clinic/upload-video-reference-images';
import { apiClient } from '@/infrastructure/api/client';
import {
    apiClinicExercisesRepository,
    apiClinicVideosRepository,
} from '@/infrastructure/repositories';

const MAX_VIDEO_SIZE = MAX_VIDEO_MB * 1024 * 1024;
const MAX_THUMBNAIL_SIZE = MAX_IMAGE_MB * 1024 * 1024;

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

/** Status 4xx de um erro do axios que veio sem mensagem; `null` se não for o caso. */
function rejectedStatus(err: unknown): number | null {
    if (typeof err !== 'object' || err === null || !('isAxiosError' in err)) {
        return null;
    }
    const status = (err as { response?: { status?: number } }).response?.status;
    return status !== undefined && status >= 400 && status < 500
        ? status
        : null;
}

function isHttpError(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'isAxiosError' in err;
}

/** Mensagem do back-end em 4xx; erro HTTP sem ela não mostra o texto do axios. */
function submitErrorMessage(err: unknown): string {
    const status = rejectedStatus(err);
    const fallback =
        status !== null
            ? `O servidor recusou o envio (código ${status}). Tente de novo.`
            : isHttpError(err)
              ? 'Não foi possível falar com o servidor. Tente de novo.'
              : err instanceof Error
                ? err.message
                : 'Erro ao enviar exercício.';
    return authErrorMessage(err, fallback);
}

/** Sem "tente de novo": reenviar o formulário criaria um segundo exercício. */
function referenceImagesWarning(err: unknown): string {
    const status = rejectedStatus(err);
    const reason = authErrorMessage(
        err,
        status !== null
            ? `o servidor recusou as fotos (código ${status})`
            : isHttpError(err)
              ? 'o servidor não respondeu'
              : err instanceof Error
                ? err.message
                : 'erro desconhecido',
    ).replace(/\.$/, '');
    return `O exercício foi enviado, mas as fotos do PDF não foram salvas (${reason}). Não envie o exercício de novo: ele já está na biblioteca.`;
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
    const [warning, setWarning] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const reset = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setStatus('idle');
        setProgress(0);
        setError(null);
        setWarning(null);
    }, []);

    const abort = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setStatus('idle');
        setProgress(0);
    }, []);

    const mutation = useMutation({
        mutationFn: async (input: SubmitExerciseInput) => {
            if (!ALLOWED_VIDEO_TYPES.includes(input.videoFile.type)) {
                throw new Error(
                    'Formato não suportado. Use: MP4, MPEG, MOV, AVI, WebM, FLV, MKV.',
                );
            }
            if (input.videoFile.size > MAX_VIDEO_SIZE) {
                throw new Error(
                    `O vídeo excede o tamanho máximo de ${MAX_VIDEO_MB}MB.`,
                );
            }
            if (input.thumbnailFile) {
                if (!ALLOWED_IMAGE_TYPES.includes(input.thumbnailFile.type)) {
                    throw new Error('Thumbnail deve ser JPEG, PNG ou WebP.');
                }
                if (input.thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
                    throw new Error(
                        `A thumbnail não pode exceder ${MAX_IMAGE_MB}MB.`,
                    );
                }
            }

            const ac = new AbortController();
            abortRef.current = ac;
            setError(null);
            setWarning(null);
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

            // O exercício já existe: falhar aqui deixaria o formulário pronto
            // para reenviar e criar um segundo exercício.
            const refs = (input.referenceImages ?? []).filter(Boolean);
            if (refs.length > 0) {
                try {
                    await uploadAndSyncClinicVideoReferenceImages(
                        presigned.video_id,
                        input.referenceImages ?? [],
                    );
                } catch (err) {
                    setWarning(referenceImagesWarning(err));
                }
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
            setError(submitErrorMessage(err));
            setStatus('error');
        },
    });

    const { mutateAsync } = mutation;
    /** Resolve com o exercício criado ou `null`; a falha fica em `error`. */
    const submit = useCallback(
        (input: SubmitExerciseInput) => mutateAsync(input).catch(() => null),
        [mutateAsync],
    );

    return {
        submit,
        status,
        progress,
        error,
        warning,
        abort,
        reset,
    };
}
