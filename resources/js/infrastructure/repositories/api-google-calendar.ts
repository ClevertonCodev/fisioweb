import type { GoogleCalendarRepository } from '@/application/clinic/ports';
import { apiClient } from '@/infrastructure/api/client';

interface ApiStatusDto {
    connected: boolean;
    google_calendar_id: string | null;
    connected_at: string | null;
}

export const apiGoogleCalendarRepository: GoogleCalendarRepository = {
    async getStatus() {
        const { data } = await apiClient.get<{ data: ApiStatusDto }>(
            '/clinic/google-calendar/status',
        );
        return {
            connected: data.data.connected,
            googleCalendarId: data.data.google_calendar_id,
            connectedAt: data.data.connected_at,
        };
    },

    async getAuthUrl() {
        const { data } = await apiClient.get<{
            data: { authorization_url: string };
        }>('/clinic/google-calendar/connect');
        return data.data.authorization_url;
    },

    async disconnect() {
        await apiClient.delete('/clinic/google-calendar');
    },
};
