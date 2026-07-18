import { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    type Crop,
    type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getCroppedImageBlob } from '@/lib/crop-image';

const ASPECT_VIDEO_THUMBNAIL = 16 / 9;

/** Crop inicial centralizado. Se aspect for informado, respeita a proporção. */
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

export interface ImageCropModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageFile: File | null;
    onConfirm: (croppedFile: File) => void;
    title?: string;
    /** Proporção fixa do recorte. Omitir para recorte livre. */
    aspect?: number;
    hintText?: string;
}

export function ImageCropModal({
    open,
    onOpenChange,
    imageFile,
    onConfirm,
    title = 'Recortar imagem',
    aspect,
    hintText = 'Arraste as bordas e os cantos para ajustar o recorte livremente.',
}: ImageCropModalProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (open && imageFile) {
            const url = URL.createObjectURL(imageFile);
            setImageSrc(url);
            setCrop(undefined);
            setCompletedCrop(null);
            return () => URL.revokeObjectURL(url);
        }
        setImageSrc(null);
    }, [open, imageFile]);

    const onImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            const { width, height } = e.currentTarget;
            setCrop(buildInitialCrop(width, height, aspect));
        },
        [aspect],
    );

    const handleConfirm = useCallback(async () => {
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
            // Converte o recorte (em pixels da imagem exibida) para pixels reais.
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

    if (!open || !imageFile) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {!imageSrc ? (
                    <div className="flex h-[400px] w-full items-center justify-center bg-muted text-muted-foreground">
                        Carregando…
                    </div>
                ) : (
                    <>
                        <div className="flex max-h-[420px] w-full items-center justify-center overflow-hidden rounded-lg bg-black">
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) =>
                                    setCrop(percentCrop)
                                }
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
                        <p className="text-center text-sm text-muted-foreground">
                            {hintText}
                        </p>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirm}
                                disabled={
                                    isProcessing ||
                                    !completedCrop ||
                                    completedCrop.width === 0
                                }
                            >
                                {isProcessing ? 'Recortando…' : 'Usar recorte'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
