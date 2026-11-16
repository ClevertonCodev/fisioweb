import { Check, Loader2, X } from 'lucide-react';

import {
    useMediaProposals,
    usePendingExercises,
    useReviewExercise,
    useReviewMediaProposal,
} from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MediaProposalCard } from '@/components/admin/exercises/MediaProposalCard';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';

const difficultyLabels: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
};

export default function AdminExerciseReviewPage() {
    const {
        data: pending = [],
        isLoading: isLoadingPending,
        isError: isPendingError,
    } = usePendingExercises();
    const {
        data: proposals = [],
        isLoading: isLoadingProposals,
        isError: isProposalsError,
    } = useMediaProposals();
    const { approve, reject } = useReviewExercise();
    const mediaReview = useReviewMediaProposal();
    const isLoading = isLoadingPending || isLoadingProposals;
    const isDecidingMedia =
        mediaReview.approve.isPending || mediaReview.reject.isPending;

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center justify-between gap-4 px-6 py-4">
                        <h1 className="text-2xl font-semibold text-foreground">
                            Exercícios a revisar
                        </h1>
                        <BackButton
                            to="/admin/exercicios"
                            className="shrink-0"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : isPendingError || isProposalsError ? (
                        <p className="py-16 text-center text-destructive">
                            Não foi possível carregar a fila de revisão.
                            Recarregue a página.
                        </p>
                    ) : pending.length === 0 && proposals.length === 0 ? (
                        <p className="py-16 text-center text-muted-foreground">
                            Nenhum exercício aguardando revisão.
                        </p>
                    ) : (
                        <div className="mx-auto flex max-w-5xl flex-col gap-8">
                            {proposals.length > 0 && (
                                <section className="flex flex-col gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            Mídia proposta
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            Trocas de capa ou de fotos do PDF em
                                            vídeos que outras clínicas ou o
                                            catálogo já usam. Até a sua decisão,
                                            todos continuam vendo a mídia atual.
                                        </p>
                                    </div>
                                    {proposals.map((proposal) => {
                                        const decision = {
                                            exerciseId: proposal.exercise.id,
                                            videoId: proposal.videoId,
                                            version: proposal.version,
                                        };
                                        return (
                                            <MediaProposalCard
                                                key={proposal.videoId}
                                                proposal={proposal}
                                                disabled={isDecidingMedia}
                                                onApprove={() =>
                                                    mediaReview.approve.mutate(
                                                        decision,
                                                    )
                                                }
                                                onReject={() =>
                                                    mediaReview.reject.mutate(
                                                        decision,
                                                    )
                                                }
                                            />
                                        );
                                    })}
                                </section>
                            )}
                            {pending.length > 0 && (
                                <section className="flex flex-col gap-4">
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Exercícios enviados
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {pending.map((exercise) => {
                                            const video =
                                                exercise.videos.find(
                                                    (v) =>
                                                        v.status ===
                                                        'completed',
                                                ) ?? exercise.videos[0];
                                            const isBusy =
                                                approve.isPending ||
                                                reject.isPending;
                                            return (
                                                <div
                                                    key={exercise.id}
                                                    className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                                                >
                                                    <video
                                                        src={
                                                            video?.cdn_url ??
                                                            video?.url ??
                                                            undefined
                                                        }
                                                        poster={
                                                            video?.thumbnail_url ??
                                                            undefined
                                                        }
                                                        controls
                                                        className="aspect-video w-full bg-muted object-cover"
                                                    />
                                                    <div className="flex flex-1 flex-col gap-2 p-4">
                                                        <h3 className="font-semibold text-foreground">
                                                            {exercise.name}
                                                        </h3>
                                                        <div className="text-sm text-muted-foreground">
                                                            <p>
                                                                Categoria:{' '}
                                                                {exercise
                                                                    .physio_area
                                                                    ?.name ??
                                                                    '—'}{' '}
                                                                · Dificuldade:{' '}
                                                                {difficultyLabels[
                                                                    exercise
                                                                        .difficulty_level
                                                                ] ??
                                                                    exercise.difficulty_level}
                                                            </p>
                                                            <p>
                                                                Clínica:{' '}
                                                                {exercise.clinic
                                                                    ?.name ??
                                                                    '—'}
                                                                {exercise
                                                                    .submitted_by_clinic_user
                                                                    ?.name
                                                                    ? ` · por ${exercise.submitted_by_clinic_user.name}`
                                                                    : ''}
                                                            </p>
                                                        </div>
                                                        {exercise.description && (
                                                            <p className="text-sm text-foreground">
                                                                {
                                                                    exercise.description
                                                                }
                                                            </p>
                                                        )}
                                                        <div className="mt-auto flex gap-2 pt-2">
                                                            <Button
                                                                size="sm"
                                                                disabled={
                                                                    isBusy
                                                                }
                                                                onClick={() =>
                                                                    approve.mutate(
                                                                        exercise.id,
                                                                    )
                                                                }
                                                                className="gap-1"
                                                            >
                                                                <Check className="size-4" />
                                                                Aprovar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={
                                                                    isBusy
                                                                }
                                                                onClick={() =>
                                                                    reject.mutate(
                                                                        {
                                                                            id: exercise.id,
                                                                        },
                                                                    )
                                                                }
                                                                className="gap-1 text-destructive hover:text-destructive"
                                                            >
                                                                <X className="size-4" />
                                                                Rejeitar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
