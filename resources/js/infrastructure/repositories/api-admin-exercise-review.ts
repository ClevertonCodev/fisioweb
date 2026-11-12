import type {
    MediaProposal,
    MediaProposalDecision,
    MediaProposalExercise,
} from '@/domain/admin';
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

const PAGE_SIZE = 100;

async function allPages<T>(
    fetchPage: (page: number) => Promise<{ items: T[]; lastPage: number }>,
): Promise<T[]> {
    const first = await fetchPage(1);
    const items = [...first.items];
    for (let page = 2; page <= first.lastPage; page++) {
        items.push(...(await fetchPage(page)).items);
    }
    return items;
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

interface ApiMediaProposalExercise {
    id: number;
    name: string;
    review_status: MediaProposalExercise['reviewStatus'];
    clinic: { id: number; name: string } | null;
}

interface ApiMediaProposalImage {
    cdn_url: string;
}

interface ApiMediaProposal {
    video_id: number;
    proposal_version: string;
    proposed_at: string;
    exercise: ApiMediaProposalExercise;
    linked_exercises: ApiMediaProposalExercise[];
    current: {
        thumbnail_url: string | null;
        reference_images: ApiMediaProposalImage[];
    };
    proposed: {
        thumbnail_url: string | null;
        reference_images: ApiMediaProposalImage[] | null;
    };
}

function mapProposalExercise(
    raw: ApiMediaProposalExercise,
): MediaProposalExercise {
    return {
        id: raw.id,
        name: raw.name,
        reviewStatus: raw.review_status,
        clinicName: raw.clinic?.name ?? null,
    };
}

function imageUrls(images: ApiMediaProposalImage[]): string[] {
    return images.map((image) => image.cdn_url).filter((url) => url !== '');
}

export function mapMediaProposal(raw: ApiMediaProposal): MediaProposal {
    return {
        videoId: raw.video_id,
        version: raw.proposal_version,
        proposedAt: raw.proposed_at,
        exercise: mapProposalExercise(raw.exercise),
        linkedExercises: raw.linked_exercises.map(mapProposalExercise),
        current: {
            thumbnailUrl: raw.current.thumbnail_url,
            referenceImageUrls: imageUrls(raw.current.reference_images),
        },
        proposedThumbnailUrl: raw.proposed.thumbnail_url,
        proposedReferenceImageUrls:
            raw.proposed.reference_images === null
                ? null
                : imageUrls(raw.proposed.reference_images),
    };
}

function decisionBody(decision: MediaProposalDecision) {
    return {
        video_id: decision.videoId,
        proposal_version: decision.version,
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
        const items = await allPages(async (page) => {
            const { data } = await apiClient.get<{
                data: { data?: unknown[]; last_page?: number };
            }>('/admin/exercises', {
                params: { review_status: 'pending', per_page: PAGE_SIZE, page },
            });
            return {
                items: data?.data?.data ?? [],
                lastPage: data?.data?.last_page ?? 1,
            };
        });
        return items.map((e) => mapPending(e as Record<string, unknown>));
    },

    async approve(id: number): Promise<void> {
        await apiClient.put(`/admin/exercises/${id}/approve`);
    },

    async reject(id: number, reason?: string): Promise<void> {
        await apiClient.put(`/admin/exercises/${id}/reject`, { reason });
    },

    async listMediaProposals(): Promise<MediaProposal[]> {
        const items = await allPages(async (page) => {
            const { data } = await apiClient.get<{
                data: ApiMediaProposal[];
                meta?: { last_page?: number };
            }>('/admin/exercises/media-proposals', {
                params: { per_page: PAGE_SIZE, page },
            });
            return {
                items: data?.data ?? [],
                lastPage: data?.meta?.last_page ?? 1,
            };
        });
        return items.map(mapMediaProposal);
    },

    async approveMediaProposal(decision: MediaProposalDecision): Promise<void> {
        await apiClient.put(
            `/admin/exercises/${decision.exerciseId}/media-proposal/approve`,
            decisionBody(decision),
        );
    },

    async rejectMediaProposal(decision: MediaProposalDecision): Promise<void> {
        await apiClient.put(
            `/admin/exercises/${decision.exerciseId}/media-proposal/reject`,
            decisionBody(decision),
        );
    },
};
