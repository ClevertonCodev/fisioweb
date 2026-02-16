import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { VideoData } from '@/types/video';

const ALLOWED_THUMBNAIL_ACCEPT = 'image/jpeg,image/png,image/webp';
const ALLOWED_THUMBNAIL_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_THUMBNAIL_SIZE = 5242880;

const TECHNICAL_METADATA_KEYS = [
    'original_name',
    'upload_method',
    'pending_thumbnail_path',
];

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

interface EditVideoProps {
    video: VideoData;
}

const breadcrumbs = (video: VideoData): BreadcrumbItem[] => [
    { title: 'Vídeos', href: '/admin/videos' },
    { title: 'Editar vídeo', href: `/admin/videos/${video.id}/edit` },
];

export default function EditVideo({ video }: EditVideoProps) {
    const [originalFilename, setOriginalFilename] = useState(
        video.original_filename || '',
    );
    const [duration, setDuration] = useState<string>(
        video.duration != null ? String(video.duration) : '',
    );
    const [metadata, setMetadata] = useState<Record<string, string>>(() => {
        const m = video.metadata;
        if (!m || typeof m !== 'object') return {};
        const r: Record<string, string> = {};
        for (const [k, v] of Object.entries(m)) {
            r[k] = typeof v === 'string' ? v : v != null ? String(v) : '';
        }
        return r;
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropModalFile, setCropModalFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [metadataHasError, setMetadataHasError] = useState(false);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

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

    const handleSubmit = useCallback(async () => {
        setError(null);
        const cleanMetadata: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(metadata)) {
            if (key.startsWith('new_') || !value?.trim()) continue;
            cleanMetadata[key] = value.trim();
        }
        const technical = (video.metadata || {}) as Record<string, unknown>;
        for (const k of TECHNICAL_METADATA_KEYS) {
            if (technical[k] !== undefined) cleanMetadata[k] = technical[k];
        }

        setSaving(true);
        let thumbnailPath: string | undefined;

        try {
            if (thumbnailFile) {
                if (!ALLOWED_THUMBNAIL_MIMES.includes(thumbnailFile.type)) {
                    setError('Thumbnail deve ser JPEG, PNG ou WebP.');
                    setSaving(false);
                    return;
                }
                if (thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
                    setError('A thumbnail não pode exceder 5MB.');
                    setSaving(false);
                    return;
                }

                const thumbRes = await fetch(
                    `/admin/videos/${video.id}/presigned-thumbnail-replace-request`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-XSRF-TOKEN': getCsrfToken(),
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            filename: thumbnailFile.name,
                            mime_type: thumbnailFile.type,
                            size: thumbnailFile.size,
                        }),
                    },
                );

                if (!thumbRes.ok) {
                    const err = await thumbRes.json().catch(() => ({}));
                    throw new Error(err.message || 'Erro ao solicitar upload da thumbnail');
                }

                const { data: thumbPresigned } = await thumbRes.json();

                const xhr = new XMLHttpRequest();
                await new Promise<void>((resolve, reject) => {
                    xhr.addEventListener('load', () => {
                        if (xhr.status >= 200 && xhr.status < 300) resolve();
                        else reject(new Error(`Upload falhou (${xhr.status})`));
                    });
                    xhr.addEventListener('error', () =>
                        reject(new Error('Erro de rede')),
                    );
                    xhr.open('PUT', thumbPresigned.upload_url);
                    xhr.setRequestHeader('Content-Type', thumbnailFile.type);
                    xhr.send(thumbnailFile);
                });

                thumbnailPath = thumbPresigned.path;
            }

            const updateRes = await fetch(`/admin/videos/${video.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    original_filename: originalFilename.trim() || undefined,
                    duration: duration.trim() ? parseInt(duration, 10) : null,
                    metadata:
                        Object.keys(cleanMetadata).length > 0
                            ? (cleanMetadata as Record<string, string>)
                            : undefined,
                    thumbnail_path: thumbnailPath,
                }),
            });

            if (!updateRes.ok) {
                const err = await updateRes.json().catch(() => ({}));
                throw new Error(err.message || 'Erro ao atualizar vídeo');
            }

            router.visit('/admin/videos');
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Erro ao salvar alterações',
            );
        } finally {
            setSaving(false);
        }
    }, [video.id, video.metadata, originalFilename, duration, metadata, thumbnailFile]);

    return (
        <AppLayout breadcrumbs={breadcrumbs(video)}>
            <Head title={`Editar vídeo - ${video.original_filename}`} />
            <div className="flex h-full flex-1 flex-col overflow-x-auto">
                <div className="flex-1 overflow-auto p-6">
                    <div className="mb-6 flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="shrink-0">
                            <Link href="/admin/videos">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Editar vídeo
                        </h1>
                    </div>

                    <div className="mx-auto max-w-2xl rounded-xl border border-sidebar-border/70 bg-card p-6">
                        <h2 className="mb-4 text-lg font-semibold text-foreground">
                            {video.original_filename}
                        </h2>

                        <div className="flex flex-col gap-4">
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept={ALLOWED_THUMBNAIL_ACCEPT}
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
                                    onChange={(e) => setOriginalFilename(e.target.value)}
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
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="Ex: 120"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit_thumbnail">
                                    Thumbnail (opcional)
                                </Label>
                                <div
                                    className="mt-1 flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-sidebar-border/70 bg-muted/30 py-4 transition-colors hover:border-primary/50"
                                    onClick={() => thumbnailInputRef.current?.click()}
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
                                                {thumbnailFile.name} (será substituída)
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

                            <MetadataFields
                                value={metadata}
                                onChange={setMetadata}
                                onValidationChange={setMetadataHasError}
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

                            <div className="flex items-center justify-end gap-3 border-t border-sidebar-border/70 pt-4">
                                <Button variant="outline" asChild disabled={saving}>
                                    <Link href="/admin/videos">Cancelar</Link>
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={saving || metadataHasError}
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
        </AppLayout>
    );
}
