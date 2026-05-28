import { Smile, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ImageCropModal } from '@/components/ImageCropModal';
import { Button } from '@/components/ui/button';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 2 * 1024 * 1024;
const MIMES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

interface PatientPhotoSectionProps {
    value: File | null;
    onChange: (file: File | null) => void;
    currentPhotoUrl?: string;
}

export function PatientPhotoSection({
    value,
    onChange,
    currentPhotoUrl,
}: PatientPhotoSectionProps) {
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropModalFile, setCropModalFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const localPreviewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

    useEffect(() => {
        return () => {
            if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        };
    }, [localPreviewUrl]);

    const previewUrl = localPreviewUrl ?? currentPhotoUrl ?? null;

    const clearPhoto = useCallback(() => {
        onChange(null);
        setPhotoError(null);
        if (inputRef.current) inputRef.current.value = '';
    }, [onChange]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPhotoError(null);
        const file = e.target.files?.[0];
        if (inputRef.current) inputRef.current.value = '';
        if (!file) return;
        if (!MIMES.includes(file.type)) {
            setPhotoError('Use JPEG, PNG ou WebP.');
            return;
        }
        if (file.size > MAX_BYTES) {
            setPhotoError('A foto não pode exceder 2MB.');
            return;
        }
        setCropModalFile(file);
        setCropModalOpen(true);
    }, []);

    const handleCropConfirm = useCallback(
        (croppedFile: File) => {
            if (croppedFile.size > MAX_BYTES) {
                setPhotoError('A foto recortada ainda excede 2MB. Tente uma imagem menor.');
                return;
            }
            setPhotoError(null);
            onChange(croppedFile);
        },
        [onChange],
    );

    const handleCropOpenChange = useCallback((open: boolean) => {
        if (!open) {
            setCropModalFile(null);
            if (inputRef.current) inputRef.current.value = '';
        }
        setCropModalOpen(open);
    }, []);

    const openPicker = useCallback(() => inputRef.current?.click(), []);

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={handleChange}
            />
            <div className="mb-8 flex items-center gap-6">
                <button
                    type="button"
                    onClick={openPicker}
                    className="bg-primary/10 focus-visible:ring-ring ring-offset-background relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full transition hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <Smile className="text-primary/40 h-10 w-10" />
                    )}
                </button>
                <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground mb-2 text-sm">
                        JPEG, PNG ou WebP — Máx. 2MB
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={openPicker}>
                            Escolher uma foto
                        </Button>
                        {(value || currentPhotoUrl) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={clearPhoto}
                            >
                                <X className="mr-1 h-4 w-4" />
                                Remover
                            </Button>
                        )}
                    </div>
                    {photoError && (
                        <p className="text-destructive mt-2 text-sm" role="alert">
                            {photoError}
                        </p>
                    )}
                    {value && (
                        <p className="text-muted-foreground mt-1 truncate text-xs">{value.name}</p>
                    )}
                </div>
            </div>
            <ImageCropModal
                open={cropModalOpen}
                onOpenChange={handleCropOpenChange}
                imageFile={cropModalFile}
                onConfirm={handleCropConfirm}
                title="Recortar foto do paciente"
                aspect={16 / 9}
                hintText="Arraste a área para posicionar o recorte. Use + e − para zoom."
            />
        </>
    );
}
