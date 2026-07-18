import { ImagePlus, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ImageCropModal } from '@/components/ImageCropModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const ACCEPT_THUMB = 'image/jpeg,image/png,image/webp';

export type ReferenceImageState = {
    file?: File;
    url?: string;
    path?: string;
} | null;

type SlotProps = {
    label: string;
    state: ReferenceImageState;
    onChange: (state: ReferenceImageState) => void;
    onRequestCrop: (file: File) => void;
};

/**
 * Mesmo padrão visual do campo Thumbnail em AdminVideoEditPage / CreatePage.
 */
function ReferenceImageSlot({
    label,
    state,
    onChange,
    onRequestCrop,
}: SlotProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!state?.file) {
            setFilePreviewUrl(null);
            return undefined;
        }
        const url = URL.createObjectURL(state.file);
        setFilePreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [state?.file]);

    const currentUrl = filePreviewUrl ?? state?.url ?? null;

    return (
        <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">
                {label}
            </Label>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT_THUMB}
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f) {
                        onRequestCrop(f);
                    }
                    if (inputRef.current) inputRef.current.value = '';
                }}
            />
            <div
                className="mt-1 flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 py-4 transition-colors hover:border-primary/50"
                onClick={() => inputRef.current?.click()}
            >
                {currentUrl && !state?.file && (
                    <img
                        src={currentUrl}
                        alt="Referência atual"
                        className="mb-2 max-h-20 rounded object-cover"
                    />
                )}
                {state?.file ? (
                    <div className="flex w-full items-center justify-between gap-2 px-4">
                        {filePreviewUrl && (
                            <img
                                src={filePreviewUrl}
                                alt="Nova referência"
                                className="max-h-14 shrink-0 rounded object-cover"
                            />
                        )}
                        <ImagePlus className="size-5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                            {state.file.name} (será substituída)
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(
                                    state.url || state.path
                                        ? { url: state.url, path: state.path }
                                        : null,
                                );
                            }}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <Upload className="size-8 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium text-foreground">
                            Clique para escolher nova imagem
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            JPEG, PNG ou WebP — Máx. 5MB
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

type AdminVideoReferenceImageFieldsProps = {
    referenceImage1: ReferenceImageState;
    referenceImage2: ReferenceImageState;
    onReferenceImage1Change: (state: ReferenceImageState) => void;
    onReferenceImage2Change: (state: ReferenceImageState) => void;
};

export function AdminVideoReferenceImageFields({
    referenceImage1,
    referenceImage2,
    onReferenceImage1Change,
    onReferenceImage2Change,
}: AdminVideoReferenceImageFieldsProps) {
    const [cropOpen, setCropOpen] = useState(false);
    const [cropFile, setCropFile] = useState<File | null>(null);
    const [cropSlot, setCropSlot] = useState<1 | 2 | null>(null);

    const openCrop = useCallback((slot: 1 | 2, file: File) => {
        setCropSlot(slot);
        setCropFile(file);
        setCropOpen(true);
    }, []);

    const handleCropOpenChange = useCallback((open: boolean) => {
        if (!open) {
            setCropFile(null);
            setCropSlot(null);
        }
        setCropOpen(open);
    }, []);

    const handleCropConfirm = useCallback(
        (croppedFile: File) => {
            if (cropSlot === 1) {
                onReferenceImage1Change({
                    file: croppedFile,
                    url: referenceImage1?.url,
                    path: referenceImage1?.path,
                });
            } else if (cropSlot === 2) {
                onReferenceImage2Change({
                    file: croppedFile,
                    url: referenceImage2?.url,
                    path: referenceImage2?.path,
                });
            }
            setCropFile(null);
            setCropSlot(null);
            setCropOpen(false);
        },
        [
            cropSlot,
            onReferenceImage1Change,
            onReferenceImage2Change,
            referenceImage1?.path,
            referenceImage1?.url,
            referenceImage2?.path,
            referenceImage2?.url,
        ],
    );

    return (
        <div className="flex flex-col gap-4">
            <Label className="text-sm font-medium text-foreground">
                Imagens de referência (opcional, até 2)
            </Label>
            <ReferenceImageSlot
                label="Imagem de referência 1"
                state={referenceImage1}
                onChange={onReferenceImage1Change}
                onRequestCrop={(file) => openCrop(1, file)}
            />
            <ReferenceImageSlot
                label="Imagem de referência 2"
                state={referenceImage2}
                onChange={onReferenceImage2Change}
                onRequestCrop={(file) => openCrop(2, file)}
            />

            <ImageCropModal
                open={cropOpen}
                onOpenChange={handleCropOpenChange}
                imageFile={cropFile}
                onConfirm={handleCropConfirm}
                title="Recortar imagem de referência"
            />
        </div>
    );
}
