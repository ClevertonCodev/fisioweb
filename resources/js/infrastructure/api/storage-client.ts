import axios from 'axios';

export const storageClient = axios.create();

export async function downloadStorageObject(url: string): Promise<Blob> {
    const response = await storageClient.get<Blob>(url, {
        responseType: 'blob',
        headers: { Authorization: undefined },
    });

    return response.data;
}
