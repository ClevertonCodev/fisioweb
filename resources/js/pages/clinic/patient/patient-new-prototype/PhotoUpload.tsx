import { Camera, Crop, ImageUp, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';

import { DsButton, dsCn } from '@/components/ds';

import { PhotoCropModal, type CropParams } from './PhotoCropModal';

/*
 * PROTOTYPE (throwaway) — campo de foto do paciente no DS v2: área de soltar
 * em círculo, recorte obrigatório ao escolher, "Ajustar" reabre o recorte a
 * partir da imagem original com o enquadramento anterior.
 */

const MIMES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
/** A original pode ser maior: o recorte sai com 512px e bem menos de 2 MB. */
const MAX_SOURCE = 10 * 1024 * 1024;
const MAX_RESULT = 2 * 1024 * 1024;

function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase();
}

export function PhotoUpload({
    value,
    onChange,
    name = '',
    size = 152,
}: {
    /** Foto já recortada (o que vai para a API). */
    value: File | null;
    onChange: (file: File | null) => void;
    /** Nome do paciente, para as iniciais enquanto não há foto. */
    name?: string;
    size?: number;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [source, setSource] = useState<File | null>(null);
    const [params, setParams] = useState<CropParams | undefined>();
    const [cropping, setCropping] = useState<File | null>(null);
    const [over, setOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const preview = useMemo(
        () => (value ? URL.createObjectURL(value) : null),
        [value],
    );
    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview);
        },
        [preview],
    );

    const accept = (file: File | undefined) => {
        setError(null);
        if (!file) return;
        if (!MIMES.includes(file.type)) {
            setError('Formato não aceito. Use JPEG, PNG ou WebP.');
            return;
        }
        if (file.size > MAX_SOURCE) {
            setError('Imagem grande demais (máximo 10 MB).');
            return;
        }
        setParams(undefined);
        setCropping(file);
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        accept(e.dataTransfer.files[0]);
    };

    const pick = () => inputRef.current?.click();
    const initials = initialsOf(name);

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
                <button
                    type="button"
                    onClick={value ? () => setCropping(source) : pick}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setOver(true);
                    }}
                    onDragLeave={() => setOver(false)}
                    onDrop={onDrop}
                    aria-label={
                        value
                            ? 'Ajustar o recorte da foto'
                            : 'Adicionar foto do paciente'
                    }
                    className={dsCn(
                        'group relative flex cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-full transition-[box-shadow,background-color,border-color] duration-200 focus-visible:shadow-ds-focus focus-visible:outline-0',
                        value
                            ? 'border border-ds-border-default shadow-ds-md'
                            : 'border-2 border-dashed border-ds-border-default bg-ds-surface-subtle hover:border-ds-primary-60 hover:bg-ds-surface-brand-subtle',
                        over &&
                            'border-ds-primary-80 bg-ds-surface-brand-subtle ring-4 ring-ds-primary-20 ds-dark:border-ds-primary-60',
                    )}
                    style={{ width: size, height: size }}
                >
                    {preview ? (
                        <>
                            <img
                                src={preview}
                                alt=""
                                className="size-full object-cover"
                            />
                            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ds-black/50 text-ds-caption font-medium text-ds-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                <Crop className="size-5" />
                                Ajustar
                            </span>
                        </>
                    ) : over ? (
                        <>
                            <ImageUp className="size-8 text-ds-content-brand ds-dark:text-ds-primary-60" />
                            <span className="text-ds-caption font-medium text-ds-content-brand ds-dark:text-ds-primary-60">
                                Solte aqui
                            </span>
                        </>
                    ) : initials ? (
                        <>
                            <span
                                className="font-semibold text-ds-content-brand ds-dark:text-ds-primary-60"
                                style={{ fontSize: size * 0.3 }}
                            >
                                {initials}
                            </span>
                            <span className="flex items-center gap-1 text-ds-caption text-ds-content-muted group-hover:text-ds-content-brand">
                                <Camera className="size-3.5" />
                                Adicionar
                            </span>
                        </>
                    ) : (
                        <>
                            <Camera className="size-8 text-ds-content-subtle transition-colors group-hover:text-ds-content-brand" />
                            <span className="text-ds-caption font-medium text-ds-content-muted group-hover:text-ds-content-brand">
                                Adicionar foto
                            </span>
                        </>
                    )}
                </button>
                {value && (
                    <span className="pointer-events-none absolute right-1 bottom-1 flex size-9 items-center justify-center rounded-full bg-ds-primary-80 text-ds-white ring-4 ring-ds-surface-default ds-dark:bg-ds-primary-70">
                        <Pencil className="size-4" />
                    </span>
                )}
            </div>

            {value ? (
                <div className="flex flex-wrap justify-center gap-2">
                    <DsButton
                        variant="secondary"
                        size="sm"
                        iconPosition="left"
                        icon={<Crop />}
                        label="Ajustar"
                        onClick={() => setCropping(source)}
                    />
                    <DsButton
                        variant="secondary"
                        size="sm"
                        iconPosition="left"
                        icon={<ImageUp />}
                        label="Trocar"
                        onClick={pick}
                    />
                    <DsButton
                        variant="destructive-tertiary"
                        size="sm"
                        iconPosition="only"
                        icon={<Trash2 />}
                        label="Remover foto"
                        onClick={() => {
                            onChange(null);
                            setSource(null);
                            setParams(undefined);
                        }}
                    />
                </div>
            ) : (
                <p className="max-w-56 text-ds-caption text-ds-content-muted">
                    Arraste uma imagem ou{' '}
                    <button
                        type="button"
                        onClick={pick}
                        className="cursor-pointer font-medium text-ds-content-brand underline-offset-2 hover:underline ds-dark:text-ds-primary-60"
                    >
                        escolha um arquivo
                    </button>
                    . JPEG, PNG ou WebP.
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="text-ds-caption text-ds-status-danger-content"
                >
                    {error}
                </p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={MIMES.join(',')}
                className="hidden"
                onChange={(e) => {
                    accept(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />

            <PhotoCropModal
                file={cropping}
                initial={cropping === source ? params : undefined}
                onCancel={() => setCropping(null)}
                onConfirm={(cropped, next) => {
                    if (cropped.size > MAX_RESULT) {
                        setError('A foto recortada passou de 2 MB.');
                        return;
                    }
                    setSource(cropping);
                    setParams(next);
                    setCropping(null);
                    onChange(cropped);
                }}
            />
        </div>
    );
}
