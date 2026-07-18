import {
    AlertCircle,
    CheckCircle2,
    ImagePlus,
    Loader2,
    Upload,
    X,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { uploadAndSyncVideoReferenceImages } from '@/application/admin/upload-video-reference-images';
import { usePresignedUpload } from '@/application/admin/use-admin-videos';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    AdminVideoReferenceImageFields,
    type ReferenceImageState,
} from '@/components/admin/AdminVideoReferenceImageFields';
import { ImageCropModal } from '@/components/ImageCropModal';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ACCEPT_VIDEO =
    'video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/x-flv,video/x-matroska';
const ACCEPT_THUMB = 'image/jpeg,image/png,image/webp';

export default function AdminVideoCreatePage() {
    const { upload, abort, status, progress, error, reset } =
        usePresignedUpload();
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [referenceImage1, setReferenceImage1] = useState<ReferenceImageState>(null);
    const [referenceImage2, setReferenceImage2] = useState<ReferenceImageState>(null);
    const [originalFilename, setOriginalFilename] = useState('');
    const [duration, setDuration] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropModalFile, setCropModalFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const handleVideoSelect = useCallback((file: File | null) => {
        setVideoFile(file);
        setOriginalFilename(file ? file.name : '');
        if (fileInputRef.current) fileInputRef.current.value = '';
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

    const handleSubmitUpload = useCallback(async () => {
        if (!videoFile) return;
        const confirmed = await upload(videoFile, thumbnailFile ?? undefined, {
            original_filename: originalFilename.trim() || undefined,
            duration: duration.trim() ? parseInt(duration, 10) : undefined,
        });
        if (!confirmed) return;
        if (referenceImage1 || referenceImage2) {
            try {
                await uploadAndSyncVideoReferenceImages(
                    confirmed.id,
                    [referenceImage1, referenceImage2],
                    { isNewVideo: true },
                );
            } catch (err) {
                toast.error(
                    err instanceof Error
                        ? err.message
                        : 'Vídeo enviado, mas falha ao salvar imagens de referência.',
                );
            }
        }
    }, [
        upload,
        videoFile,
        thumbnailFile,
        referenceImage1,
        referenceImage2,
        originalFilename,
        duration,
    ]);

    const clearVideo = useCallback(() => {
        setVideoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const clearThumbnail = useCallback(() => {
        setThumbnailFile(null);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
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

    const isUploading =
        status === 'requesting' ||
        status === 'uploading' ||
        status === 'confirming';

    const statusLabels: Record<string, string> = {
        requesting: 'Solicitando URL...',
        uploading: `Enviando... ${progress}%`,
        confirming: 'Confirmando upload...',
        completed: 'Upload concluído!',
        error: 'Erro no upload',
    };

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center justify-between gap-4 px-6 py-4">
                        <h1 className="text-2xl font-semibold text-foreground">
                            Enviar vídeo
                        </h1>
                        <BackButton to="/admin/videos" className="shrink-0" />
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6">
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
                                                style={{
                                                    width: `${progress}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={abort}
                                >
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={reset}
                                    >
                                        Enviar outro
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link to="/admin/videos">
                                            Ir para lista
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={ACCEPT_VIDEO}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <input
                                    ref={thumbnailInputRef}
                                    type="file"
                                    accept={ACCEPT_THUMB}
                                    onChange={handleThumbnailChange}
                                    className="hidden"
                                />

                                <div>
                                    <Label className="mb-2 block text-sm font-medium text-foreground">
                                        Vídeo (obrigatório)
                                    </Label>
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOver(true);
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            setDragOver(false);
                                        }}
                                        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 transition-colors ${
                                            dragOver
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border bg-muted/30 hover:border-primary/50'
                                        }`}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
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
                                                    Arraste o vídeo ou clique
                                                    para selecionar
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    MP4, MPEG, MOV, AVI, WebM,
                                                    FLV, MKV — Máx. 20MB
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
                                                setOriginalFilename(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={videoFile.name}
                                            className="mt-1"
                                        />
                                    </div>
                                )}

                                <div>
                                    <Label className="mb-2 block text-sm font-medium text-foreground">
                                        Thumbnail (opcional)
                                    </Label>
                                    <div
                                        className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 py-4 transition-colors hover:border-primary/50"
                                        onClick={() =>
                                            thumbnailInputRef.current?.click()
                                        }
                                    >
                                        {thumbnailFile ? (
                                            <div className="flex w-full items-center justify-between gap-2 px-4">
                                                <ImagePlus className="size-5 text-muted-foreground" />
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
                                                    Clique para escolher uma
                                                    imagem
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    JPEG, PNG ou WebP — Máx. 5MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <AdminVideoReferenceImageFields
                                    referenceImage1={referenceImage1}
                                    referenceImage2={referenceImage2}
                                    onReferenceImage1Change={setReferenceImage1}
                                    onReferenceImage2Change={setReferenceImage2}
                                />

                                <div>
                                    <Label htmlFor="duration">
                                        Duração em segundos (opcional)
                                    </Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min={0}
                                        value={duration}
                                        onChange={(e) =>
                                            setDuration(e.target.value)
                                        }
                                        placeholder="Ex: 120"
                                        className="mt-1"
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <span>{error}</span>
                                        <button
                                            onClick={() => reset()}
                                            className="ml-auto"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                                    <Button variant="outline" asChild>
                                        <Link to="/admin/videos">Cancelar</Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleSubmitUpload}
                                        disabled={!videoFile}
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
        </AdminLayout>
    );
}
