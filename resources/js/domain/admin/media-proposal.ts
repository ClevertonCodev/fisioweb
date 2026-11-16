export type ExerciseReviewState = 'pending' | 'approved' | 'rejected';

export interface MediaProposalExercise {
    id: number;
    name: string;
    reviewStatus: ExerciseReviewState;
    clinicName: string | null;
}

export interface MediaProposalSide {
    thumbnailUrl: string | null;
    referenceImageUrls: string[];
}

export interface MediaProposal {
    videoId: number;
    version: string;
    proposedAt: string;
    exercise: MediaProposalExercise;
    linkedExercises: MediaProposalExercise[];
    current: MediaProposalSide;
    proposedThumbnailUrl: string | null;
    proposedReferenceImageUrls: string[] | null;
}

export interface MediaProposalDecision {
    exerciseId: number;
    videoId: number;
    version: string;
}
