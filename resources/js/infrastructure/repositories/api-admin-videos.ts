import type {
    AdminVideo,
    AdminVideosListMeta,
    AdminVideosRepository,
} from '@/application/admin/ports';
import { apiClient } from '@/infrastructure/api/client';

const BASE = '/admin/media/videos';

function mapVideo(raw: Record<string, unknown>): AdminVideo {
    return {
        id: raw.id as number,
        filename: (raw.filename as string) ?? '',
        original_filename: (raw.original_filename as string) ?? null,
        url: (raw.url as string) ?? null,
        cdn_url: (raw.cdn_url as string) ?? null,
        thumbnail_url: (raw.thumbnail_url as string) ?? null,
        size: (raw.size as number) ?? null,
        human_size: (raw.human_size as string) ?? '0 B',
        duration: (raw.duration as number) ?? null,
        human_duration: (raw.human_duration as string) ?? null,
        metadata: (raw.metadata as Record<string, unknown>) ?? null,
        status: (raw.status as AdminVideo['status']) ?? 'pending',
        mime_type: (raw.mime_type as string) ?? null,
    };
}

export const apiAdminVideosRepository: AdminVideosRepository = {
    async list(params = {}) {
        const { data } = await apiClient.get<{
            data: {
                data?: unknown[];
                current_page?: number;
                last_page?: number;
                per_page?: number;
                total?: number;
            };
        }>(BASE, {
            params: {
                per_page: params.per_page ?? 15,
                page: params.page ?? 1,
            },
        });
        // Backend retorna { data: paginator }; o Laravel coloca a lista em paginator.data
        const paginator = data?.data ?? {};
        const items = Array.isArray(paginator.data) ? paginator.data : [];
        const meta: AdminVideosListMeta = {
            current_page: paginator.current_page ?? 1,
            last_page: paginator.last_page ?? 1,
            per_page: paginator.per_page ?? 15,
            total: paginator.total ?? 0,
        };
        return {
            data: items.map((v) => mapVideo(v as Record<string, unknown>)),
            meta,
        };
    },

    async getById(id) {
        const { data } = await apiClient.get<{ data: unknown }>(
            `${BASE}/${id}`,
        );
        if (!data?.data) return null;
        return mapVideo((data as { data: Record<string, unknown> }).data);
    },

    async requestPresignedUpload(params) {
        const { data } = await apiClient.post<{
            data: Record<string, unknown>;
        }>(`${BASE}/presigned-upload-request`, {
            filename: params.filename,
            mime_type: params.mime_type,
            size: params.size,
        });
        const d = (data as { data?: Record<string, unknown> })?.data ?? {};
        return {
            video_id: d.video_id as number,
            upload_url: d.upload_url as string,
            path: d.path as string,
            expires_at: d.expires_at as string,
            video: mapVideo((d.video as Record<string, unknown>) ?? d),
        };
    },

    async requestPresignedThumbnail(videoId, params) {
        const { data } = await apiClient.post<{
            data: Record<string, unknown>;
        }>(`${BASE}/${videoId}/presigned-thumbnail-request`, {
            filename: params.filename,
            mime_type: params.mime_type,
            size: params.size,
        });
        const d = (data as { data?: Record<string, unknown> })?.data ?? {};
        return {
            upload_url: d.upload_url as string,
            path: d.path as string,
            expires_at: d.expires_at as string,
        };
    },

    async requestPresignedThumbnailReplace(videoId, params) {
        const { data } = await apiClient.post<{
            data: Record<string, unknown>;
        }>(`${BASE}/${videoId}/presigned-thumbnail-replace-request`, {
            filename: params.filename,
            mime_type: params.mime_type,
            size: params.size,
        });
        const d = (data as { data?: Record<string, unknown> })?.data ?? {};
        return {
            upload_url: d.upload_url as string,
            path: d.path as string,
            expires_at: d.expires_at as string,
        };
    },

    async confirmUpload(videoId, params = {}) {
        const { data } = await apiClient.post<{ data: unknown }>(
            `${BASE}/${videoId}/confirm-upload`,
            {
                thumbnail_path: params.thumbnail_path,
                original_filename: params.original_filename,
                duration: params.duration,
                metadata: params.metadata,
            },
        );
        const d = (data as { data?: Record<string, unknown> })?.data;
        return mapVideo((d ?? {}) as Record<string, unknown>);
    },

    async update(videoId, payload) {
        const { data } = await apiClient.patch<{ data: unknown }>(
            `${BASE}/${videoId}`,
            payload,
        );
        return mapVideo((data as { data: Record<string, unknown> }).data);
    },

    async destroy(id) {
        await apiClient.delete(`${BASE}/${id}`);
    },
};
