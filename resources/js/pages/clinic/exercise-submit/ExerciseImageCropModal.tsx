import { useCallback, useRef, useState } from 'react';
import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    type Crop,
    type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { DsButton, DsModal } from '@/components/ds';
import { getCroppedImageBlob } from '@/lib/crop-image';

import { useObjectUrl } from './use-object-url';

function buildInitialCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect?: number,
): Crop {
    if (aspect) {
        return centerCrop(
            makeAspectCrop(
                { unit: '%', width: 90 },
                aspect,
                mediaWidth,
                mediaHeight,
            ),
            mediaWidth,
            mediaHeight,
        );
    }
    return centerCrop(
        { unit: '%', width: 90, height: 90 },
        mediaWidth,
        mediaHeight,
    );
}

export interface ExerciseImageCropModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageFile: File | null;
    onConfirm: (croppedFile: File) => void;
    title?: string;
    aspect?: number;
}

export function ExerciseImageCropModal({
    open,
    onOpenChange,
    imageFile,
    onConfirm,
    title = 'Recortar imagem',
    aspect,
}: ExerciseImageCropModalProps) {
    const imageSrc = useObjectUrl(open ? imageFile : null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const activeFile = open ? imageFile : null;
    const [lastFile, setLastFile] = useState(activeFile);
    if (lastFile !== activeFile) {
        setLastFile(activeFile);
        setCrop(undefined);
        setCompletedCrop(null);
    }

    const onImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            const { width, height } = e.currentTarget;
            const initial = buildInitialCrop(width, height, aspect);
            setCrop(initial);
            setCompletedCrop({
                unit: 'px',
                x: Math.round(((initial.x ?? 5) / 100) * width),
                y: Math.round(((initial.y ?? 5) / 100) * height),
                width: Math.round(((initial.width ?? 90) / 100) * width),
                height: Math.round(((initial.height ?? 90) / 100) * height),
            });
        },
        [aspect],
    );

    const handleUseFullImage = useCallback(() => {
        if (!imageFile) return;
        onConfirm(imageFile);
        onOpenChange(false);
    }, [imageFile, onConfirm, onOpenChange]);

    const handleConfirmCrop = useCallback(async () => {
        const image = imgRef.current;
        if (
            !image ||
            !imageSrc ||
            !completedCrop ||
            completedCrop.width === 0
        ) {
            return;
        }

        setIsProcessing(true);
        try {
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            const pixelCrop = {
                x: completedCrop.x * scaleX,
                y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX,
                height: completedCrop.height * scaleY,
            };
            const mimeType = imageFile?.type?.startsWith('image/')
                ? imageFile.type
                : 'image/jpeg';
            const blob = await getCroppedImageBlob(
                imageSrc,
                pixelCrop,
                mimeType,
            );
            const extension = imageFile?.name?.split('.').pop() || 'jpg';
            const name =
                imageFile?.name?.replace(/\.[^.]+$/, '') || 'thumbnail';
            const croppedFile = new File(
                [blob],
                `${name}-cropped.${extension}`,
                { type: blob.type },
            );
            onConfirm(croppedFile);
            onOpenChange(false);
        } finally {
            setIsProcessing(false);
        }
    }, [imageSrc, completedCrop, imageFile, onConfirm, onOpenChange]);

    return (
        <DsModal
            open={open && imageFile !== null}
            onOpenChange={(next) => !isProcessing && onOpenChange(next)}
            closeOnBackdrop={!isProcessing}
            title={title}
            meta="Arraste os cantos para recortar ou use a imagem inteira"
            size="lg"
            footer={
                <div className="flex w-full flex-wrap items-center justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        disabled={isProcessing}
                        onClick={() => onOpenChange(false)}
                    />
                    <DsButton
                        variant="tertiary"
                        label="Usar imagem inteira"
                        disabled={isProcessing || !imageFile}
                        onClick={handleUseFullImage}
                    />
                    <DsButton
                        label={isProcessing ? 'Recortando…' : 'Usar recorte'}
                        loading={isProcessing}
                        disabled={
                            isProcessing ||
                            !completedCrop ||
                            completedCrop.width === 0
                        }
                        onClick={handleConfirmCrop}
                    />
                </div>
            }
        >
            {imageSrc ? (
                <div className="flex flex-col gap-3">
                    <div className="flex max-h-[420px] w-full items-center justify-center overflow-hidden rounded-ds-lg bg-black">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            keepSelection
                            className="max-h-[420px]"
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Recortar"
                                onLoad={onImageLoad}
                                className="max-h-[420px] w-auto max-w-full"
                            />
                        </ReactCrop>
                    </div>
                </div>
            ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-ds-lg bg-ds-surface-subtle text-ds-body-sm text-ds-content-muted">
                    Carregando…
                </div>
            )}
        </DsModal>
    );
}
