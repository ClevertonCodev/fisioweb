import { apiClinicVideosRepository } from '@/infrastructure/repositories';

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

async function uploadFile(videoId: number, file: File): Promise<string> {
    if (!ALLOWED_MIMES.includes(file.type)) {
        throw new Error('Imagem de referência deve ser JPEG, PNG ou WebP.');
    }
    if (file.size > MAX_SIZE) {
        throw new Error('Cada imagem de referência não pode exceder 5MB.');
    }

    // Após confirm-upload o vídeo está completed → usa replace
    const presigned =
        await apiClinicVideosRepository.requestPresignedThumbnailReplace(
            videoId,
            {
                filename: file.name,
                mime_type: file.type,
                size: file.size,
            },
        );
    await uploadToPresignedUrl(presigned.upload_url, file);
    return presigned.path;
}

/**
 * Envia até 2 imagens de referência do exercício da clínica e sincroniza
 * no vídeo (metadata + admin_exercise_media dos exercícios ligados).
 */
export async function uploadAndSyncClinicVideoReferenceImages(
    videoId: number,
    items: ReferenceImageInput[],
): Promise<void> {
    if (items.length > 2) {
        throw new Error('Máximo de 2 imagens de referência.');
    }

    const paths: string[] = [];

    for (const item of items) {
        if (!item) continue;

        if (item instanceof File) {
            paths.push(await uploadFile(videoId, item));
            continue;
        }

        if (item.file instanceof File) {
            paths.push(await uploadFile(videoId, item.file));
            continue;
        }

        if (item.path) {
            paths.push(item.path);
        }
    }

    if (paths.length === 0) {
        return;
    }

    await apiClinicVideosRepository.syncReferenceImages(videoId, paths);
}
