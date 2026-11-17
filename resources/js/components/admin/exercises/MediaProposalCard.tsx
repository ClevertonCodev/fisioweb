import { Check, ImageOff, X } from 'lucide-react';

import { useRefreshMediaProposal } from '@/application/admin/use-exercise-review';
import { ProtectedImage } from '@/components/protected-media/ProtectedImage';
import type { ProtectedRefresh } from '@/components/protected-media/use-protected-playback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MediaProposal, MediaProposalExercise } from '@/domain/admin';
import { formatDateTimeAt } from '@/lib/format-date-time-at';

const reviewStatusLabels: Record<
    MediaProposalExercise['reviewStatus'],
    string
> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
};

interface MediaProposalCardProps {
    proposal: MediaProposal;
    disabled: boolean;
    onApprove: () => void;
    onReject: () => void;
}

export function MediaProposalCard({
    proposal,
    disabled,
    onApprove,
    onReject,
}: MediaProposalCardProps) {
    const titleId = `media-proposal-${proposal.videoId}`;
    const refreshProposal = useRefreshMediaProposal(proposal.videoId);
    const otherExercises = proposal.linkedExercises.filter(
        (exercise) => exercise.id !== proposal.exercise.id,
    );

    return (
        <article
            aria-labelledby={titleId}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
        >
            <span id={titleId} className="sr-only">
                Mídia proposta de {proposal.exercise.name}
            </span>
            <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                        {proposal.exercise.name}
                    </h3>
                    <Badge variant="secondary">
                        {reviewStatusLabels[proposal.exercise.reviewStatus]}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    Clínica: {proposal.exercise.clinicName ?? '—'} · proposta em{' '}
                    {formatDateTimeAt(proposal.proposedAt)}
                </p>
                {otherExercises.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                        O mesmo vídeo está em:{' '}
                        {otherExercises
                            .map(
                                (exercise) =>
                                    `${exercise.name} (${reviewStatusLabels[exercise.reviewStatus].toLowerCase()})`,
                            )
                            .join(', ')}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MediaColumn
                    title="Atual"
                    suffix="atual"
                    thumbnailUrl={proposal.current.thumbnailUrl}
                    referenceImageUrls={proposal.current.referenceImageUrls}
                    onRefreshThumbnail={async () =>
                        (await refreshProposal())?.current.thumbnailUrl ?? null
                    }
                    onRefreshImage={async (index) =>
                        (await refreshProposal())?.current.referenceImageUrls?.[
                            index
                        ] ?? null
                    }
                />
                <MediaColumn
                    title="Proposta"
                    suffix="proposta"
                    thumbnailUrl={proposal.proposedThumbnailUrl}
                    referenceImageUrls={proposal.proposedReferenceImageUrls}
                    unchangedThumbnail={proposal.proposedThumbnailUrl === null}
                    onRefreshThumbnail={async () =>
                        (await refreshProposal())?.proposedThumbnailUrl ?? null
                    }
                    onRefreshImage={async (index) =>
                        (await refreshProposal())?.proposedReferenceImageUrls?.[
                            index
                        ] ?? null
                    }
                />
            </div>

            <div className="flex gap-2">
                <Button
                    size="sm"
                    disabled={disabled}
                    onClick={onApprove}
                    className="gap-1"
                >
                    <Check className="size-4" />
                    Aprovar mídia
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                    onClick={onReject}
                    className="gap-1 text-destructive hover:text-destructive"
                >
                    <X className="size-4" />
                    Rejeitar mídia
                </Button>
            </div>
        </article>
    );
}

interface MediaColumnProps {
    title: string;
    suffix: string;
    thumbnailUrl: string | null;
    referenceImageUrls: string[] | null;
    unchangedThumbnail?: boolean;
    onRefreshThumbnail?: ProtectedRefresh;
    onRefreshImage?: (index: number) => Promise<string | null>;
}

function MediaColumn({
    title,
    suffix,
    thumbnailUrl,
    referenceImageUrls,
    unchangedThumbnail = false,
    onRefreshThumbnail,
    onRefreshImage,
}: MediaColumnProps) {
    return (
        <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">Capa</p>
            {thumbnailUrl ? (
                <ProtectedImage
                    src={thumbnailUrl}
                    alt={`Capa ${suffix}`}
                    onRefresh={onRefreshThumbnail}
                    className="aspect-video w-full max-w-xs rounded-md bg-muted object-cover"
                />
            ) : (
                <EmptyMedia
                    text={unchangedThumbnail ? 'Capa sem mudança' : 'Sem capa'}
                />
            )}
            <p className="text-xs text-muted-foreground">Fotos do PDF</p>
            {referenceImageUrls === null ? (
                <EmptyMedia text="Fotos do PDF sem mudança" />
            ) : referenceImageUrls.length === 0 ? (
                <EmptyMedia text="Sem fotos" />
            ) : (
                <div className="grid max-w-xs grid-cols-2 gap-2">
                    {referenceImageUrls.map((url, index) => (
                        <ProtectedImage
                            key={url}
                            src={url}
                            alt={`Foto ${index + 1} ${suffix}`}
                            onRefresh={
                                onRefreshImage
                                    ? () => onRefreshImage(index)
                                    : undefined
                            }
                            className="aspect-square w-full rounded-md bg-muted object-cover"
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function EmptyMedia({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-4 text-sm text-muted-foreground">
            <ImageOff className="size-4" />
            {text}
        </div>
    );
}
