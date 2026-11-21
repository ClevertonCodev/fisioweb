import { useMutation } from '@tanstack/react-query';

import { apiReminderUnsubscribeRepository } from '@/infrastructure/repositories/api-reminder-unsubscribe';

export function useUnsubscribeReminders() {
    return useMutation({
        mutationFn: (token: string) =>
            apiReminderUnsubscribeRepository.unsubscribe(token),
    });
}
