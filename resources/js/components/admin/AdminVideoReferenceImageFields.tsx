import { ImagePlus, X } from 'lucide-react';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const ACCEPT_THUMB = 'image/jpeg,image/png,image/webp';

type SlotProps = {
    label: string;
    file: File | null;
    onSelect: (file: File | null) => void;
};

function ReferenceImageSlot({ label, file, onSelect }: SlotProps) {
    const inputRef = useRef<HTMLInputElement>(null);

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
                    onSelect(f);
                    if (inputRef.current) inputRef.current.value = '';
                }}
            />
            <div
                className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 py-3 transition-colors hover:border-primary/50"
                onClick={() => inputRef.current?.click()}
            >
                {file ? (
                    <div className="flex w-full items-center justify-between gap-2 px-4">
                        <ImagePlus className="size-5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                            {file.name}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(null);
                            }}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <ImagePlus className="size-7 text-muted-foreground" />
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
    referenceImage1: File | null;
    referenceImage2: File | null;
    onReferenceImage1Change: (file: File | null) => void;
    onReferenceImage2Change: (file: File | null) => void;
};

export function AdminVideoReferenceImageFields({
    referenceImage1,
    referenceImage2,
    onReferenceImage1Change,
    onReferenceImage2Change,
}: AdminVideoReferenceImageFieldsProps) {
    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-foreground">
                Imagens de referência (opcional, até 2)
            </p>
            <ReferenceImageSlot
                label="Imagem de referência 1"
                file={referenceImage1}
                onSelect={onReferenceImage1Change}
            />
            <ReferenceImageSlot
                label="Imagem de referência 2"
                file={referenceImage2}
                onSelect={onReferenceImage2Change}
            />
        </div>
    );
}
