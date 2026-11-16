import { FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { authErrorMessage } from '@/application/clinic/clinic-password';
import {
    hasImageChange,
    useChangeExerciseImages,
} from '@/application/clinic/use-change-exercise-images';
import { DsAlert, DsButton, DsModal } from '@/components/ds';
import type { Exercise } from '@/domain/clinic';
import { ImageSlot } from '@/pages/clinic/exercise-submit/shared';

export const REVIEW_NOTICE =
    'A troca vai para revisão do suporte; até lá, todos continuam vendo a mídia atual.';

const HINT = 'JPEG, PNG ou WebP';

function ChangeImagesForm({
    exercise,
    videoId,
    onClose,
}: {
    exercise: Exercise;
    videoId: number;
    onClose: () => void;
}) {
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [photo1, setPhoto1] = useState<File | null>(null);
    const [photo2, setPhoto2] = useState<File | null>(null);
    const change = useChangeExerciseImages();
    const current = exercise.referenceImages ?? [];
    const input = {
        videoId,
        thumbnail,
        referenceImages: [
            photo1 ?? current[0] ?? null,
            photo2 ?? current[1] ?? null,
        ],
    };
    const goesToReview =
        exercise.reviewStatus === 'approved' ||
        exercise.mediaProposalPending === true;

    const save = () =>
        change.mutate(input, {
            onSuccess: ({ proposalPending }) => {
                toast.success(
                    proposalPending
                        ? 'Imagens enviadas para revisão do suporte.'
                        : 'Imagens trocadas.',
                );
                onClose();
            },
        });

    return (
        <DsModal
            open
            onOpenChange={(open) => !open && !change.isPending && onClose()}
            closeOnBackdrop={!change.isPending}
            title="Trocar imagens"
            meta={exercise.title}
            size="lg"
            footer={
                <div className="flex w-full flex-wrap items-center justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        disabled={change.isPending}
                        onClick={onClose}
                    />
                    <DsButton
                        label={goesToReview ? 'Enviar para revisão' : 'Salvar'}
                        loading={change.isPending}
                        disabled={change.isPending || !hasImageChange(input)}
                        onClick={save}
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                {goesToReview && (
                    <DsAlert variant="warning" mode="rich" title="Em revisão">
                        {REVIEW_NOTICE}
                    </DsAlert>
                )}
                {change.isError && (
                    <DsAlert
                        variant="danger"
                        mode="rich"
                        title="Não foi possível trocar as imagens"
                    >
                        {authErrorMessage(
                            change.error,
                            change.error instanceof Error
                                ? change.error.message
                                : 'Tente de novo em alguns instantes.',
                        )}
                    </DsAlert>
                )}
                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                    <div className="flex flex-col gap-3">
                        <div>
                            <p className="text-ds-body-xs font-semibold text-ds-content-primary">
                                Capa na biblioteca
                            </p>
                            <p className="text-ds-caption text-ds-content-muted">
                                A miniatura do cartão do exercício.
                            </p>
                        </div>
                        <ImageSlot
                            label="Capa"
                            hint={HINT}
                            file={thumbnail}
                            onFile={setThumbnail}
                            currentUrl={exercise.thumbnailUrl}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <div>
                            <p className="flex items-center gap-1.5 text-ds-body-xs font-semibold text-ds-content-primary [&_svg]:size-3.5">
                                <FileText />
                                Fotos no PDF do paciente
                            </p>
                            <p className="text-ds-caption text-ds-content-muted">
                                Até 2 fotos que aparecem ao lado do exercício no
                                PDF do programa.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <ImageSlot
                                label="Foto 1 · posição inicial"
                                hint={HINT}
                                file={photo1}
                                onFile={setPhoto1}
                                currentUrl={current[0]?.url}
                            />
                            <ImageSlot
                                label="Foto 2 · posição final"
                                hint={HINT}
                                file={photo2}
                                onFile={setPhoto2}
                                currentUrl={current[1]?.url}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DsModal>
    );
}

/** Troca da capa e das fotos do PDF; o vídeo, o nome e o texto não mudam aqui. */
export function ChangeImagesModal({
    exercise,
    onClose,
}: {
    exercise: Exercise | null;
    onClose: () => void;
}) {
    if (!exercise || !exercise.videoId) return null;
    return (
        <ChangeImagesForm
            key={exercise.id}
            exercise={exercise}
            videoId={exercise.videoId}
            onClose={onClose}
        />
    );
}
