import { storageClient } from '@/infrastructure/api/storage-client';

export interface ProtectedMediaDownload {
    status: number;
    data: Blob;
}

export async function downloadProtectedMedia(
    signedUrl: string,
): Promise<ProtectedMediaDownload> {
    const response = await storageClient.get<Blob>(signedUrl, {
        responseType: 'blob',
        validateStatus: () => true,
        headers: { Authorization: undefined },
    });

    return { status: response.status, data: response.data };
}
