import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getCroppedImageBlob } from '@/lib/crop-image';

import 'react-easy-crop/react-easy-crop.css';

const ASPECT_VIDEO_THUMBNAIL = 16 / 9;

export interface ImageCropModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Arquivo de imagem selecionado (antes do crop) */
    imageFile: File | null;
    /** Chamado com o arquivo recortado; o modal fecha em seguida */
    onConfirm: (croppedFile: File) => void;
    /** Título do modal */
    title?: string;
    /** Proporção do recorte (largura / altura). Padrão 16/9 para thumbnail de vídeo */
    aspect?: number;
}

export function ImageCropModal({
    open,
    onOpenChange,
    imageFile,
    onConfirm,
    title = 'Recortar imagem',
    aspect = ASPECT_VIDEO_THUMBNAIL,
}: ImageCropModalProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (open && imageFile) {
            const url = URL.createObjectURL(imageFile);
            setImageSrc(url);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            return () => URL.revokeObjectURL(url);
        }
        setImageSrc(null);
    }, [open, imageFile]);

    const handleCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const mimeType = imageFile?.type?.startsWith('image/')
                ? imageFile.type
                : 'image/jpeg';
            const blob = await getCroppedImageBlob(
                imageSrc,
                croppedAreaPixels,
                mimeType,
            );
            const extension = imageFile?.name?.split('.').pop() || 'jpg';
            const name = imageFile?.name?.replace(/\.[^.]+$/, '') || 'thumbnail';
            const croppedFile = new File([blob], `${name}-cropped.${extension}`, {
                type: blob.type,
            });
            onConfirm(croppedFile);
            onOpenChange(false);
        } finally {
            setIsProcessing(false);
        }
    }, [imageSrc, croppedAreaPixels, imageFile, onConfirm, onOpenChange]);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            if (!next) {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setCroppedAreaPixels(null);
            }
            onOpenChange(next);
        },
        [onOpenChange],
    );

    if (!open || !imageFile) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                        <div className="relative h-[400px] w-full bg-black [&_.reactEasyCrop_Container]:rounded-lg">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                            />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Arraste para posicionar, use o scroll para zoom
                        </p>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isProcessing}
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
