import {
    AlertCircle,
    ArrowLeft,
    ImagePlus,
    Loader2,
    Upload,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
    useAdminVideo,
    useUpdateAdminVideo,
} from '@/application/admin/use-admin-videos';
import { uploadAndSyncVideoReferenceImages } from '@/application/admin/upload-video-reference-images';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminVideoReferenceImageFields } from '@/components/admin/AdminVideoReferenceImageFields';
import { ImageCropModal } from '@/components/ImageCropModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiAdminVideosRepository } from '@/infrastructure/repositories';

const ACCEPT_THUMB = 'image/jpeg,image/png,image/webp';
const ALLOWED_THUMB_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_THUMB_SIZE = 5 * 1024 * 1024;

function uploadToPresignedUrl(
    url: string,
    file: File,
    signal?: AbortSignal,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload falhou (${xhr.status})`));
        });
        xhr.addEventListener('error', () => reject(new Error('Erro de rede')));
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
}

export default function AdminVideoEditPage() {
    const { id } = useParams<{ id: string }>();
    const videoId = id ? parseInt(id, 10) : undefined;
    const navigate = useNavigate();

    const {
        data: video,
        isLoading: loadingVideo,
        isError: errorVideo,
    } = useAdminVideo(videoId);
    const updateVideo = useUpdateAdminVideo(videoId ?? 0);

    const [originalFilename, setOriginalFilename] = useState('');
    const [duration, setDuration] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [referenceImage1, setReferenceImage1] = useState<File | null>(null);
    const [referenceImage2, setReferenceImage2] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropModalFile, setCropModalFile] = useState<File | null>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (video) {
            setOriginalFilename(video.original_filename ?? '');
            setDuration(video.duration != null ? String(video.duration) : '');
        }
    }, [video?.id]);

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

    const handleSubmit = useCallback(async () => {
        if (!videoId || !video) return;
        setError(null);
        setSaving(true);

        let thumbnailPath: string | undefined;

        try {
            if (thumbnailFile) {
                if (!ALLOWED_THUMB_MIMES.includes(thumbnailFile.type)) {
                    setError('Thumbnail deve ser JPEG, PNG ou WebP.');
                    setSaving(false);
                    return;
                }
                if (thumbnailFile.size > MAX_THUMB_SIZE) {
                    setError('A thumbnail não pode exceder 5MB.');
                    setSaving(false);
                    return;
                }
                const thumb =
                    await apiAdminVideosRepository.requestPresignedThumbnailReplace(
                        videoId,
                        {
                            filename: thumbnailFile.name,
                            mime_type: thumbnailFile.type,
                            size: thumbnailFile.size,
                        },
                    );
                await uploadToPresignedUrl(thumb.upload_url, thumbnailFile);
                thumbnailPath = thumb.path;
            }

            await updateVideo.mutateAsync({
                original_filename: originalFilename.trim() || undefined,
                duration: duration.trim() ? parseInt(duration, 10) : null,
                thumbnail_path: thumbnailPath,
            });

            if (referenceImage1 || referenceImage2) {
                await uploadAndSyncVideoReferenceImages(videoId, [
                    referenceImage1,
                    referenceImage2,
                ]);
            }

            toast.success('Vídeo atualizado.');
            navigate('/admin/videos');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    }, [
        videoId,
        video,
        thumbnailFile,
        originalFilename,
        duration,
        updateVideo,
        navigate,
        referenceImage1,
        referenceImage2,
    ]);

    if (loadingVideo || !videoId) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AdminLayout>
        );
    }

    if (errorVideo || !video) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Vídeo não encontrado.
                    </p>
                    <Button asChild variant="outline">
                        <Link to="/admin/videos">Voltar</Link>
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center gap-4 px-6 py-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="shrink-0"
                        >
                            <Link to="/admin/videos">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Editar vídeo
                        </h1>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6">
                        <h2 className="mb-4 text-lg font-semibold text-foreground">
                            {video.original_filename || video.filename}
                        </h2>

                        <div className="flex flex-col gap-4">
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept={ACCEPT_THUMB}
                                onChange={handleThumbnailChange}
                                className="hidden"
                            />

                            <div>
                                <Label htmlFor="original_filename">
                                    Nome do arquivo
                                </Label>
                                <Input
                                    id="original_filename"
                                    value={originalFilename}
                                    onChange={(e) =>
                                        setOriginalFilename(e.target.value)
                                    }
                                    placeholder="nome-do-video.mp4"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="duration">
                                    Duração em segundos
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

                            <div>
                                <Label>Thumbnail (opcional)</Label>
                                <div
                                    className="mt-1 flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 py-4 transition-colors hover:border-primary/50"
                                    onClick={() =>
                                        thumbnailInputRef.current?.click()
                                    }
                                >
                                    {video.thumbnail_url && !thumbnailFile && (
                                        <img
                                            src={video.thumbnail_url}
                                            alt="Thumbnail atual"
                                            className="mb-2 max-h-20 rounded object-cover"
                                        />
                                    )}
                                    {thumbnailFile ? (
                                        <div className="flex w-full items-center justify-between gap-2 px-4">
                                            <ImagePlus className="size-5 text-muted-foreground" />
                                            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                                {thumbnailFile.name} (será
                                                substituída)
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

                            <AdminVideoReferenceImageFields
                                referenceImage1={referenceImage1}
                                referenceImage2={referenceImage2}
                                onReferenceImage1Change={setReferenceImage1}
                                onReferenceImage2Change={setReferenceImage2}
                            />

                            {error && (
                                <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{error}</span>
                                    <button
                                        onClick={() => setError(null)}
                                        className="ml-auto"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                                <Button
                                    variant="outline"
                                    asChild
                                    disabled={saving}
                                >
                                    <Link to="/admin/videos">Cancelar</Link>
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={saving}
                                >
                                    {saving && (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    )}
                                    Salvar alterações
                                </Button>
                            </div>
                        </div>
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
