import { apiClient } from '@/infrastructure/api/client';

const BASE = '/clinic/media/videos';

interface PresignedUpload {
    video_id: number;
    upload_url: string;
    path: string;
}

interface PresignedThumbnail {
    upload_url: string;
    path: string;
}

/** Repositório mínimo de mídia da clínica: fluxo presigned de upload de vídeo. */
export const apiClinicVideosRepository = {
    async requestPresignedUpload(params: {
        filename: string;
        mime_type: string;
        size: number;
    }): Promise<PresignedUpload> {
        const { data } = await apiClient.post<{
            data: Record<string, unknown>;
        }>(`${BASE}/presigned-upload-request`, params);
        const d = data?.data ?? {};
        return {
            video_id: d.video_id as number,
            upload_url: d.upload_url as string,
            path: d.path as string,
        };
    },

    async requestPresignedThumbnail(
        videoId: number,
        params: { filename: string; mime_type: string; size: number },
    ): Promise<PresignedThumbnail> {
        const { data } = await apiClient.post<{
            data: Record<string, unknown>;
        }>(`${BASE}/${videoId}/presigned-thumbnail-request`, params);
        const d = data?.data ?? {};
        return {
            upload_url: d.upload_url as string,
            path: d.path as string,
        };
    },

    async requestPresignedThumbnailReplace(
        videoId: number,
        params: { filename: string; mime_type: string; size: number },
    ): Promise<PresignedThumbnail> {
        const { data } = await apiClient.post<{
            data: Record<string, unknown>;
        }>(`${BASE}/${videoId}/presigned-thumbnail-replace-request`, params);
        const d = data?.data ?? {};
        return {
            upload_url: d.upload_url as string,
            path: d.path as string,
        };
    },

    async confirmUpload(
        videoId: number,
        params: {
            thumbnail_path?: string;
            original_filename?: string;
            duration?: number;
        },
    ): Promise<{ id: number; status: string }> {
        const { data } = await apiClient.post<{
            data: Record<string, unknown>;
        }>(`${BASE}/${videoId}/confirm-upload`, params);
        const d = data?.data ?? {};
        return { id: d.id as number, status: d.status as string };
    },

    async syncReferenceImages(
        videoId: number,
        paths: string[],
    ): Promise<void> {
        await apiClient.put(`${BASE}/${videoId}/reference-images`, {
            reference_image_paths: paths,
        });
    },
};
