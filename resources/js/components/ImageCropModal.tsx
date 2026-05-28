import { Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

/** Área de recorte em percentual da imagem (0–100) */
interface CropPercent {
    left: number;
    top: number;
    width: number;
    height: number;
}

function getInitialCrop(aspect: number): CropPercent {
    const maxPct = 90;
    const maxHeightPct = 65;
    let width = maxPct;
    let height = width / aspect;
    if (height > maxHeightPct) {
        height = maxHeightPct;
        width = height * aspect;
    }
    if (height > 100) {
        height = 100;
        width = height * aspect;
    }
    return {
        left: (100 - width) / 2,
        top: (100 - height) / 2,
        width,
        height,
    };
}

export interface ImageCropModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageFile: File | null;
    onConfirm: (croppedFile: File) => void;
    title?: string;
    aspect?: number;
    hintText?: string;
}

export function ImageCropModal({
    open,
    onOpenChange,
    imageFile,
    onConfirm,
    title = 'Recortar imagem',
    aspect = ASPECT_VIDEO_THUMBNAIL,
    hintText = 'Arraste a área para posicionar o recorte. Use + e − para zoom.',
}: ImageCropModalProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
    const [crop, setCrop] = useState<CropPercent>(() => getInitialCrop(aspect));
    const [zoom, setZoom] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
    const imageWrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && imageFile) {
            const url = URL.createObjectURL(imageFile);
            setImageSrc(url);
            setCrop(getInitialCrop(aspect));
            setZoom(1);
            setNaturalSize(null);
            return () => URL.revokeObjectURL(url);
        }
        setImageSrc(null);
    }, [open, imageFile, aspect]);

    const zoomIn = useCallback(() => {
        setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
    }, []);

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setNaturalSize({ w: naturalWidth, h: naturalHeight });
    }, []);

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            setDragging(true);
            dragStart.current = { x: e.clientX, y: e.clientY, left: crop.left, top: crop.top };
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        },
        [crop.left, crop.top],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!dragging || !dragStart.current) return;
            const el = imageWrapRef.current;
            if (!el) return;
            const dx = (e.clientX - dragStart.current.x) / el.offsetWidth;
            const dy = (e.clientY - dragStart.current.y) / el.offsetHeight;
            const pctX = dx * 100;
            const pctY = dy * 100;
            setCrop((prev) => ({
                ...prev,
                left: Math.max(0, Math.min(100 - prev.width, dragStart.current!.left + pctX)),
                top: Math.max(0, Math.min(100 - prev.height, dragStart.current!.top + pctY)),
            }));
        },
        [dragging],
    );

    const handlePointerUp = useCallback(() => {
        setDragging(false);
        dragStart.current = null;
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!imageSrc || !naturalSize) return;

        setIsProcessing(true);
        try {
            const { w: nw, h: nh } = naturalSize;
            const adjLeft = Math.max(0, (crop.left / 100 - (1 - zoom) / 2) / zoom);
            const adjTop = Math.max(0, (crop.top / 100 - (1 - zoom) / 2) / zoom);
            const adjWidth = Math.min(1 - adjLeft, crop.width / 100 / zoom);
            const adjHeight = Math.min(1 - adjTop, crop.height / 100 / zoom);
            const pixelCrop = {
                x: adjLeft * nw,
                y: adjTop * nh,
                width: adjWidth * nw,
                height: adjHeight * nh,
            };
            const mimeType = imageFile?.type?.startsWith('image/') ? imageFile.type : 'image/jpeg';
            const blob = await getCroppedImageBlob(imageSrc, pixelCrop, mimeType);
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
    }, [imageSrc, naturalSize, crop, imageFile, onConfirm, onOpenChange]);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            if (!next) setNaturalSize(null);
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
                    <div className="bg-muted text-muted-foreground flex h-[400px] w-full items-center justify-center">
                        Carregando…
                    </div>
                ) : (
                    <>
                        <div className="flex max-h-[400px] w-full items-center justify-center overflow-hidden rounded-lg bg-black">
                            <div ref={imageWrapRef} className="relative flex-none overflow-hidden">
                                <img
                                    src={imageSrc}
                                    alt="Recortar"
                                    className="block max-h-[400px] w-auto max-w-full"
                                    onLoad={onImageLoad}
                                    draggable={false}
                                    style={{
                                        transform: `scale(${zoom})`,
                                        transformOrigin: 'center',
                                        userSelect: 'none',
                                        pointerEvents: 'none',
                                    }}
                                />
                                {naturalSize && (
                                    <div
                                        className="absolute top-0 left-0 h-full w-full"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        <div
                                            className="border-primary bg-primary/20 absolute cursor-move border-2"
                                            style={{
                                                left: `${crop.left}%`,
                                                top: `${crop.top}%`,
                                                width: `${crop.width}%`,
                                                height: `${crop.height}%`,
                                                pointerEvents: 'auto',
                                            }}
                                            onPointerDown={handlePointerDown}
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={handlePointerUp}
                                            onPointerLeave={handlePointerUp}
                                        >
                                            <div className="absolute inset-0 border border-white/50" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={zoomOut}
                                disabled={zoom <= ZOOM_MIN}
                                aria-label="Reduzir zoom"
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-muted-foreground min-w-[3rem] text-center text-sm">
                                {Math.round(zoom * 100)}%
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={zoomIn}
                                disabled={zoom >= ZOOM_MAX}
                                aria-label="Aumentar zoom"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-muted-foreground text-center text-sm">{hintText}</p>
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
                                disabled={isProcessing || !naturalSize}
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
