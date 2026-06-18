import type { ProgramDraft } from '@/application/clinic/use-program-draft';
import { apiClient } from '@/infrastructure/api/client';

interface ApiDraftResponse {
    data: {
        step: number;
        selectedIds: string[];
        groups: unknown[];
        savedAt: number;
    } | null;
}

export const programDraftRepository = {
    async get(): Promise<ProgramDraft | null> {
        try {
            const { data } = await apiClient.get<ApiDraftResponse>(
                '/clinic/program-drafts',
            );
            if (!data?.data || typeof data.data.step !== 'number') return null;
            return data.data as ProgramDraft;
        } catch {
            return null;
        }
    },

    async save(draft: ProgramDraft): Promise<void> {
        await apiClient.put('/clinic/program-drafts', draft);
    },

    async discard(): Promise<void> {
        await apiClient.delete('/clinic/program-drafts');
    },
};
