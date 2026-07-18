import type { AdminVideo } from '@/application/admin/ports';
import { apiAdminVideosRepository } from '@/infrastructure/repositories';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

type ReferenceImageInput =
    | File
    | { file?: File; path?: string; url?: string }
    | null
    | undefined;

function uploadToPresignedUrl(url: string, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload falhou (${xhr.status})`));
        });
        xhr.addEventListener('error', () => reject(new Error('Erro de rede')));
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
}

async function uploadFile(
    videoId: number,
    file: File,
    isNewVideo: boolean,
): Promise<string> {
    if (!ALLOWED_MIMES.includes(file.type)) {
        throw new Error('Imagem de referência deve ser JPEG, PNG ou WebP.');
    }
    if (file.size > MAX_SIZE) {
        throw new Error('Cada imagem de referência não pode exceder 5MB.');
    }

    const params = {
        filename: file.name,
        mime_type: file.type,
        size: file.size,
    };

    const presigned = isNewVideo
        ? await apiAdminVideosRepository.requestPresignedThumbnail(
              videoId,
              params,
          )
        : await apiAdminVideosRepository.requestPresignedThumbnailReplace(
              videoId,
              params,
          );

    await uploadToPresignedUrl(presigned.upload_url, file);
    return presigned.path;
}

/**
 * Envia imagens de referência via presigned thumbnail (reutilizado até endpoint dedicado)
 * e sincroniza paths no vídeo.
 *
 * Aceita File puro OU estado `{ file?, path? }` da UI de edição.
 * Se houver `file` novo, faz upload; senão reutiliza `path` existente.
 */
export async function uploadAndSyncVideoReferenceImages(
    videoId: number,
    items: ReferenceImageInput[],
    options?: { isNewVideo?: boolean },
): Promise<AdminVideo> {
    if (items.length > 2) {
        throw new Error('Máximo de 2 imagens de referência.');
    }

    const paths: string[] = [];
    const isNewVideo = options?.isNewVideo ?? false;

    for (const item of items) {
        if (!item) {
            continue;
        }

        if (item instanceof File) {
            paths.push(await uploadFile(videoId, item, isNewVideo));
            continue;
        }

        if (item.file instanceof File) {
            paths.push(await uploadFile(videoId, item.file, isNewVideo));
            continue;
        }

        if (item.path) {
            paths.push(item.path);
        }
    }

    return apiAdminVideosRepository.syncReferenceImages(videoId, paths);
}
