import { apiClient } from '@/infrastructure/api/client';

export interface PendingExercise {
    id: number;
    name: string;
    difficulty_level: string;
    description: string | null;
    physio_area: { id: number; name: string } | null;
    clinic: { id: number; name: string } | null;
    submitted_by_clinic_user: { id: number; name: string } | null;
    videos: {
        cdn_url: string | null;
        url: string | null;
        thumbnail_url: string | null;
        status: string;
    }[];
    created_at: string;
}

function mapPending(raw: Record<string, unknown>): PendingExercise {
    return {
        id: raw.id as number,
        name: (raw.name as string) ?? '',
        difficulty_level: (raw.difficulty_level as string) ?? 'easy',
        description: (raw.description as string) ?? null,
        physio_area:
            (raw.physio_area as PendingExercise['physio_area']) ?? null,
        clinic: (raw.clinic as PendingExercise['clinic']) ?? null,
        submitted_by_clinic_user:
            (raw.submitted_by_clinic_user as PendingExercise['submitted_by_clinic_user']) ??
            null,
        videos: (raw.videos as PendingExercise['videos']) ?? [],
        created_at: (raw.created_at as string) ?? '',
    };
}

/** Revisão de exercícios enviados por clínicas (admin do sistema). */
export const apiAdminExerciseReviewRepository = {
    async pendingCount(): Promise<number> {
        const { data } = await apiClient.get<{
            data: { pending_count: number };
        }>('/admin/exercises/pending-count');
        return data?.data?.pending_count ?? 0;
    },

    async listPending(): Promise<PendingExercise[]> {
        const { data } = await apiClient.get<{ data: { data?: unknown[] } }>(
            '/admin/exercises',
            { params: { review_status: 'pending', per_page: 100 } },
        );
        const items = data?.data?.data ?? [];
        return items.map((e) => mapPending(e as Record<string, unknown>));
    },

    async approve(id: number): Promise<void> {
        await apiClient.put(`/admin/exercises/${id}/approve`);
    },

    async reject(id: number, reason?: string): Promise<void> {
        await apiClient.put(`/admin/exercises/${id}/reject`, { reason });
    },
};
