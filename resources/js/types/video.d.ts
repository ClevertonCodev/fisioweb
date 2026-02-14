export interface VideoData {
    id: number;
    filename: string;
    original_filename: string;
    url: string | null;
    cdn_url: string | null;
    thumbnail_url?: string | null;
    size: number | null;
    human_size: string;
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

export interface UsePresignedUploadReturn {
    upload: (file: File) => Promise<VideoData | null>;
    abort: () => void;
    status: UploadStatus;
    progress: number;
    error: string | null;
    video: VideoData | null;
    reset: () => void;
}
