import { isAxiosError } from 'axios';

import type { ReminderUnsubscribeRepository } from '@/application/patient/ports';
import { apiClient } from '@/infrastructure/api/client';

const UNSUBSCRIBE_TOKEN = /^[1-9][0-9]*\.[1-9][0-9]*\.[0-9a-f]{64}$/;

export function isReminderUnsubscribeToken(token: string): boolean {
    return UNSUBSCRIBE_TOKEN.test(token);
}

export const apiReminderUnsubscribeRepository: ReminderUnsubscribeRepository = {
    async unsubscribe(token) {
        if (!isReminderUnsubscribeToken(token)) return 'invalid';
        try {
            await apiClient.post('/email/reminders/unsubscribe', {
                token,
            });
        } catch (error) {
            const status = isAxiosError(error)
                ? error.response?.status
                : undefined;
            if (status === 404 || status === 422) return 'invalid';
            if (status === 429) return 'rate_limited';
            throw error;
        }

        return 'unsubscribed';
    },
};
