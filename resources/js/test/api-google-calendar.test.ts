import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiGoogleCalendarRepository } from '@/infrastructure/repositories/api-google-calendar';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockPost = vi.mocked(apiClient.post);

afterEach(() => {
    vi.clearAllMocks();
});

describe('apiGoogleCalendarRepository.completeConnection', () => {
    it('manda o ticket da volta do Google para o complete', async () => {
        mockPost.mockResolvedValue({ data: { data: { connected: true } } });

        await apiGoogleCalendarRepository.completeConnection('ticket-123');

        expect(mockPost).toHaveBeenCalledWith(
            '/clinic/google-calendar/complete',
            { ticket: 'ticket-123' },
        );
    });

    it('propaga a recusa do servidor', async () => {
        mockPost.mockRejectedValue(new Error('403'));

        await expect(
            apiGoogleCalendarRepository.completeConnection('ticket-de-outro'),
        ).rejects.toThrow('403');
    });
});
