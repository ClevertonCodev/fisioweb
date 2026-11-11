import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ExerciseReferenceImage } from '@/domain/clinic';

import type { MediaChangeResult } from './ports';
import {
    uploadAndChangeClinicVideoThumbnail,
    uploadAndSyncClinicVideoReferenceImages,
} from './upload-video-reference-images';

export interface ChangeExerciseImagesInput {
    videoId: number;
    thumbnail: File | null;
    /** Os 2 espaços das fotos do PDF: arquivo novo, a foto atual ou vazio. */
    referenceImages: (File | ExerciseReferenceImage | null)[];
}

export function hasImageChange(input: ChangeExerciseImagesInput): boolean {
    return (
        input.thumbnail !== null ||
        input.referenceImages.some((item) => item instanceof File)
    );
}

export async function changeExerciseImages(
    input: ChangeExerciseImagesInput,
): Promise<MediaChangeResult> {
    let proposalPending = false;

    if (input.thumbnail) {
        const result = await uploadAndChangeClinicVideoThumbnail(
            input.videoId,
            input.thumbnail,
        );
        proposalPending = result.proposalPending;
    }

    if (input.referenceImages.some((item) => item instanceof File)) {
        const result = await uploadAndSyncClinicVideoReferenceImages(
            input.videoId,
            input.referenceImages.map((item) =>
                item instanceof File ? item : item ? { path: item.path } : null,
            ),
        );
        proposalPending = proposalPending || result?.proposalPending === true;
    }

    return { proposalPending };
}

export function useChangeExerciseImages() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: changeExerciseImages,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['exercises'] });
            queryClient.invalidateQueries({ queryKey: ['exercises-infinite'] });
        },
    });
}
