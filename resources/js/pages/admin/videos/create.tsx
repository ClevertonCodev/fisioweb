import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ImagePlus,
    Loader2,
    Upload,
    X,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { ImageCropModal } from '@/components/ImageCropModal';
import { MetadataFields } from '@/components/metadata-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePresignedUpload } from '@/hooks/use-presigned-upload';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vídeos',
        href: '/admin/videos',
    },
    {
        title: 'Enviar vídeo',
        href: '/admin/videos/create',
    },
];

const ALLOWED_THUMBNAIL_ACCEPT = 'image/jpeg,image/png,image/webp';

export default function CreateVideo() {
    const { upload, abort, status, progress, error, reset } = usePresignedUpload();
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [originalFilename, setOriginalFilename] = useState('');
    const [duration, setDuration] = useState<string>('');
    const [metadata, setMetadata] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [metadataHasError, setMetadataHasError] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropModalFile, setCropModalFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const handleVideoSelect = useCallback((file: File | null) => {
        setVideoFile(file);
        if (file) setOriginalFilename(file.name);
        else setOriginalFilename('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleThumbnailChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                setCropModalFile(file);
                setCropModalOpen(true);
            }
            if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
        },
        [],
    );

    const handleCropConfirm = useCallback((croppedFile: File) => {
        setThumbnailFile(croppedFile);
        setCropModalFile(null);
        setCropModalOpen(false);
    }, []);

    const handleCropOpenChange = useCallback((open: boolean) => {
        if (!open) {
            setCropModalFile(null);
            if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
        }
        setCropModalOpen(open);
    }, []);

    const clearThumbnail = useCallback(() => {
        setThumbnailFile(null);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }, []);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleVideoSelect(file);
        },
        [handleVideoSelect],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleVideoSelect(file);
        },
        [handleVideoSelect],
    );

    const handleSubmitUpload = useCallback(() => {
        if (!videoFile) return;
        setFormError(null);
        const cleanMetadata: Record<string, string> = {};
        for (const [key, value] of Object.entries(metadata)) {
            if (key.startsWith('new_') || !value?.trim()) continue;
            cleanMetadata[key] = value.trim();
        }
        const options = {
            original_filename: originalFilename.trim() || undefined,
            duration: duration.trim() ? parseInt(duration, 10) : undefined,
            metadata:
                Object.keys(cleanMetadata).length > 0 ? cleanMetadata : undefined,
        };
        upload(videoFile, thumbnailFile ?? undefined, options).then((result) => {
            if (result) {
                router.visit('/admin/videos');
            }
        });
    }, [upload, videoFile, thumbnailFile, originalFilename, duration, metadata]);

    const clearVideo = useCallback(() => {
        setVideoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleCancel = useCallback(() => {
        router.visit('/admin/videos');
    }, []);

    const isUploading =
        status === 'requesting' || status === 'uploading' || status === 'confirming';

    const statusLabels: Record<string, string> = {
        requesting: 'Solicitando URL...',
        uploading: `Enviando... ${progress}%`,
        confirming: 'Confirmando upload...',
        completed: 'Upload concluído!',
        error: 'Erro no upload',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Enviar vídeo - Biblioteca de Vídeos" />
            <div className="flex h-full flex-1 flex-col overflow-x-auto">
                <div className="flex-1 overflow-auto p-6">
                    <div className="mb-6 flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="shrink-0"
                        >
                            <Link href="/admin/videos">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Enviar vídeo
                        </h1>
                    </div>

                    <div className="mx-auto max-w-2xl rounded-xl border border-sidebar-border/70 bg-card p-6">
                        <h2 className="mb-4 text-lg font-semibold text-foreground">
                            Novo vídeo
                        </h2>

                        {isUploading ? (
                            <div className="flex flex-col items-center gap-3 py-8">
                                <Loader2 className="size-10 animate-spin text-primary" />
                                <p className="text-sm font-medium">
                                    {statusLabels[status]}
                                </p>
                                {status === 'uploading' && (
                                    <div className="w-full max-w-xs">
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <Button variant="outline" size="sm" onClick={abort}>
                                    <X className="mr-1 size-3" />
                                    Cancelar
                                </Button>
                            </div>
                        ) : status === 'completed' ? (
                            <div className="flex flex-col items-center gap-3 py-8">
                                <CheckCircle2 className="size-10 text-green-500" />
                                <p className="text-sm font-medium text-green-600">
                                    Upload concluído!
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={reset}>
                                        Enviar outro
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link href="/admin/videos">Ir para lista</Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/x-flv,video/x-matroska"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <input
                                    ref={thumbnailInputRef}
                                    type="file"
                                    accept={ALLOWED_THUMBNAIL_ACCEPT}
                                    onChange={handleThumbnailChange}
                                    className="hidden"
                                />

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Vídeo (obrigatório)
                                    </label>
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 transition-colors ${
                                            dragOver
                                                ? 'border-primary bg-primary/5'
                                                : 'border-sidebar-border/70 bg-muted/30 hover:border-primary/50'
                                        }`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {videoFile ? (
                                            <div className="flex items-center gap-3">
                                                <Upload className="size-5 text-muted-foreground" />
                                                <span className="text-sm font-medium text-foreground">
                                                    {videoFile.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        clearVideo();
                                                    }}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="size-10 text-muted-foreground" />
                                                <p className="mt-2 text-sm font-medium text-foreground">
                                                    Arraste o vídeo ou clique para
                                                    selecionar
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    MP4, MPEG, MOV, AVI, WebM, FLV,
                                                    MKV — Máx. 20MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {videoFile && (
                                    <div>
                                        <Label htmlFor="original_filename">
                                            Nome do arquivo (opcional)
                                        </Label>
                                        <Input
                                            id="original_filename"
                                            value={originalFilename}
                                            onChange={(e) =>
                                                setOriginalFilename(e.target.value)
                                            }
                                            placeholder={videoFile.name}
                                            className="mt-1"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Thumbnail (opcional)
                                    </label>
                                    <div
                                        className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-sidebar-border/70 bg-muted/30 py-4 transition-colors hover:border-primary/50"
                                        onClick={() =>
                                            thumbnailInputRef.current?.click()
                                        }
                                    >
                                        {thumbnailFile ? (
                                            <div className="flex w-full items-center justify-between gap-2 px-4">
                                                <div className="flex items-center gap-2">
                                                    <ImagePlus className="size-5 text-muted-foreground" />
                                                </div>
                                                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                                    {thumbnailFile.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        clearThumbnail();
                                                    }}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <ImagePlus className="size-8 text-muted-foreground" />
                                                <p className="mt-2 text-sm font-medium text-foreground">
                                                    Clique para escolher uma imagem
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    JPEG, PNG ou WebP — Máx. 5MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="duration">
                                        Duração em segundos (opcional)
                                    </Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min={0}
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="Ex: 120"
                                        className="mt-1"
                                    />
                                </div>

                                <MetadataFields
                                    value={metadata}
                                    onChange={setMetadata}
                                    onValidationChange={setMetadataHasError}
                                />

                                {(error || formError) && (
                                    <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800">
                                        <AlertCircle className="size-4 shrink-0" />
                                    <span>{error ?? formError}</span>
                                    <button
                                        onClick={() => {
                                            reset();
                                            setFormError(null);
                                        }}
                                        className="ml-auto"
                                    >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3 border-t border-sidebar-border/70 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleSubmitUpload}
                                        disabled={!videoFile || metadataHasError}
                                    >
                                        Enviar vídeo
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ImageCropModal
                open={cropModalOpen}
                onOpenChange={handleCropOpenChange}
                imageFile={cropModalFile}
                onConfirm={handleCropConfirm}
                title="Recortar thumbnail"
            />
        </AppLayout>
    );
}
