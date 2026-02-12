/**
 * Upload de vídeo: usa presigned URL quando ativo (direto browser → Cloudflare R2).
 * Limite: 10 MB.
 */

const API_BASE = '/api/videos';

/** Tamanho máximo do vídeo em bytes (10 MB) */
export const MAX_VIDEO_SIZE_BYTES = 10 * 1024 * 1024;

export const ACCEPT_VIDEO = 'video/mp4,video/mpeg,video/quicktime,video/webm,video/x-flv,video/x-matroska';

function getCsrfToken(): string {
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    if (token) return token;
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
    return '';
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
        Accept: 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
        (headers as Record<string, string>)['X-XSRF-TOKEN'] = getCsrfToken();
    }
    const res = await fetch(url, { ...options, credentials: 'include', headers });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || `Erro ${res.status}`);
    }
    return res.json();
}

export interface VideoUploadResult {
    id: number;
    filename: string;
    original_filename: string;
    url?: string;
    cdn_url?: string;
    size?: number;
    status: string;
    mime_type?: string;
}

export interface VideoUploadOptions {
    onProgress?: (percent: number) => void;
}

/**
 * Faz upload de um vídeo. Em produção (use_presigned) envia direto para o R2;
 * caso contrário envia o arquivo para o servidor.
 */
export async function uploadVideoFile(
    file: File,
    options: VideoUploadOptions = {}
): Promise<{ data: VideoUploadResult }> {
    const { onProgress } = options;

    const modeRes = await fetchJson<{ use_presigned: boolean }>(`${API_BASE}/upload-mode`);

    if (modeRes.use_presigned) {
        return uploadViaPresigned(file, { onProgress });
    }

    return uploadViaServer(file, { onProgress });
}

async function uploadViaPresigned(
    file: File,
    options: VideoUploadOptions
): Promise<{ data: VideoUploadResult }> {
    const { onProgress } = options;

    const presignedRes = await fetchJson<{
        data: {
            video_id: number;
            upload_url: string;
            path: string;
            expires_at: string;
            video: VideoUploadResult;
        };
    }>(`${API_BASE}/presigned-upload-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: file.name,
            mime_type: file.type || 'video/mp4',
            size: file.size,
        }),
    });

    const { upload_url, video_id, video } = presignedRes.data;

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', upload_url);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

    const progressPromise = new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload falhou: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Upload falhou'));
    });

    xhr.send(file);
    await progressPromise;

    const confirmRes = await fetchJson<{ data: VideoUploadResult }>(
        `${API_BASE}/${video_id}/confirm-upload`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size: file.size, mime_type: file.type || undefined }),
        }
    );

    return { data: confirmRes.data };
}

async function uploadViaServer(
    file: File,
    options: VideoUploadOptions
): Promise<{ data: VideoUploadResult }> {
    const { onProgress } = options;

    const form = new FormData();
    form.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/upload`);

    const csrfToken = getCsrfToken();
    if (csrfToken) xhr.setRequestHeader('X-XSRF-TOKEN', csrfToken);
    xhr.setRequestHeader('Accept', 'application/json');

    const progressPromise = new Promise<{ data: VideoUploadResult }>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };
        xhr.onload = () => {
            if (xhr.status < 200 || xhr.status >= 300) {
                try {
                    const err = JSON.parse(xhr.responseText);
                    reject(new Error((err as { message?: string }).message || `Erro ${xhr.status}`));
                } catch {
                    reject(new Error(`Erro ${xhr.status}`));
                }
                return;
            }
            try {
                const res = JSON.parse(xhr.responseText) as { data: VideoUploadResult };
                resolve(res);
            } catch {
                reject(new Error('Resposta inválida'));
            }
        };
        xhr.onerror = () => reject(new Error('Upload falhou'));
    });

    xhr.send(form);
    return progressPromise;
}
