import { apiAdminVideosRepository } from '@/infrastructure/repositories';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

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

/**
 * Envia imagens de referência via presigned thumbnail (reutilizado até endpoint dedicado)
 * e sincroniza paths no vídeo.
 */
export async function uploadAndSyncVideoReferenceImages(
    videoId: number,
    files: (File | null | undefined)[],
    options?: { isNewVideo?: boolean },
): Promise<void> {
    const selected = files.filter((f): f is File => f instanceof File);
    if (selected.length === 0) return;
    if (selected.length > 2) {
        throw new Error('Máximo de 2 imagens de referência.');
    }

    const paths: string[] = [];
    const isNewVideo = options?.isNewVideo ?? false;

    for (const file of selected) {
        if (!ALLOWED_MIMES.includes(file.type)) {
            throw new Error('Imagem de referência deve ser JPEG, PNG ou WebP.');
        }
        if (file.size > MAX_SIZE) {
            throw new Error('Cada imagem de referência não pode exceder 5MB.');
        }
        // TODO(T024): trocar por presigned dedicado a reference_images quando o backend expuser.
        const presigned = isNewVideo
            ? await apiAdminVideosRepository.requestPresignedThumbnail(
                  videoId,
                  {
                      filename: file.name,
                      mime_type: file.type,
                      size: file.size,
                  },
              )
            : await apiAdminVideosRepository.requestPresignedThumbnailReplace(
                  videoId,
                  {
                      filename: file.name,
                      mime_type: file.type,
                      size: file.size,
                  },
              );
        await uploadToPresignedUrl(presigned.upload_url, file);
        paths.push(presigned.path);
    }

    await apiAdminVideosRepository.syncReferenceImages(videoId, paths);
}
