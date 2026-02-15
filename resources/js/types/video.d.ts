export interface VideoData {
    id: number;
    filename: string;
    original_filename: string;
    url: string | null;
    cdn_url: string | null;
    thumbnail_url?: string | null;
    size: number | null;
    human_size: string;
    duration?: number | null;
    human_duration?: string | null;
    metadata?: Record<string, unknown> | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    mime_type: string | null;
}

export interface PresignedUploadResponse {
    video_id: number;
    upload_url: string;
    path: string;
    expires_at: string;
    video: VideoData;
}

export type UploadStatus =
    | 'idle'
    | 'requesting'
    | 'uploading'
    | 'confirming'
    | 'completed'
    | 'error';

export interface PresignedThumbnailResponse {
    upload_url: string;
    path: string;
    expires_at: string;
}

export interface PresignedUploadOptions {
    original_filename?: string | null;
    duration?: number | null;
    metadata?: Record<string, unknown> | null;
}

export interface UsePresignedUploadReturn {
    upload: (
        videoFile: File,
        thumbnailFile?: File | null,
        options?: PresignedUploadOptions,
    ) => Promise<VideoData | null>;
    abort: () => void;
    status: UploadStatus;
    progress: number;
    error: string | null;
    video: VideoData | null;
    reset: () => void;
}
