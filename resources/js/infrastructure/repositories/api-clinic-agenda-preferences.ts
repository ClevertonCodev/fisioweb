import type { AgendaPreferencesRepository } from '@/application/clinic/ports';
import type { AgendaPreferences } from '@/domain/clinic';
import { isAgendaView } from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';

/** Campo da entidade → chave registrada no backend. */
const KEYS: Record<keyof AgendaPreferences, string> = {
    view: 'agenda.view',
    showWeekends: 'agenda.show_weekends',
};

export const apiClinicAgendaPreferencesRepository: AgendaPreferencesRepository =
    {
        async get(): Promise<Partial<AgendaPreferences>> {
            const { data } = await apiClient.get<{
                data: Record<string, unknown>;
            }>('/clinic/me/preferences', {
                params: { keys: Object.values(KEYS).join(',') },
            });
            const raw = data.data ?? {};
            const result: Partial<AgendaPreferences> = {};
            const view = raw[KEYS.view];
            if (isAgendaView(view)) result.view = view;
            const weekends = raw[KEYS.showWeekends];
            if (typeof weekends === 'boolean') result.showWeekends = weekends;
            return result;
        },

        async save(key, value): Promise<void> {
            await apiClient.put(`/clinic/me/preferences/${KEYS[key]}`, {
                value,
            });
        },
    };
