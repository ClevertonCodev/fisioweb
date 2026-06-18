import {
    ArrowLeft,
    Clock,
    FileText,
    Film,
    HardDrive,
    Pencil,
    Video,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { VIDEO_STATUS_LABELS } from '@/application/admin/exercise-constants';
import { useAdminVideo } from '@/application/admin/use-admin-videos';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminVideoDetailPage() {
    const { id } = useParams<{ id: string }>();
    const videoId = id ? parseInt(id, 10) : undefined;
    const { data: video, isLoading, isError } = useAdminVideo(videoId);

    if (isLoading || !videoId) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Carregando...</div>
                </div>
            </AdminLayout>
        );
    }

    if (isError || !video) {
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

    const statusLabel = VIDEO_STATUS_LABELS[video.status] ?? video.status;
    const canPlay =
        video.status === 'completed' && (video.cdn_url || video.url);

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center justify-between gap-4 px-6 py-4">
                        <div className="flex items-center gap-4">
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
                                Detalhes do vídeo
                            </h1>
                        </div>
                        <Button asChild size="sm" className="gap-2">
                            <Link to={`/admin/videos/${video.id}/editar`}>
                                <Pencil className="h-4 w-4" />
                                Editar
                            </Link>
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-4xl space-y-6">
                        {/* Preview / Thumbnail + Player */}
                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            <div className="relative aspect-video bg-muted">
                                {video.thumbnail_url ? (
                                    <img
                                        src={video.thumbnail_url}
                                        alt={
                                            video.original_filename ??
                                            video.filename
                                        }
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-muted">
                                        <Video className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                )}
                                {canPlay && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <a
                                            href={
                                                video.cdn_url ??
                                                video.url ??
                                                '#'
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90"
                                        >
                                            <Film className="ml-1 h-8 w-8" />
                                        </a>
                                    </div>
                                )}
                                <Badge
                                    className={cn(
                                        'absolute top-3 right-3',
                                        video.status === 'completed' &&
                                            'bg-green-600',
                                        video.status === 'pending' &&
                                            'bg-amber-600',
                                        video.status === 'processing' &&
                                            'bg-blue-600',
                                        video.status === 'failed' &&
                                            'bg-destructive',
                                    )}
                                >
                                    {statusLabel}
                                </Badge>
                            </div>
                        </div>

                        {/* Informações */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-border bg-card p-6">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                                    <FileText className="h-5 w-5" />
                                    Informações
                                </h2>
                                <dl className="space-y-3 text-sm">
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Nome do arquivo
                                        </dt>
                                        <dd className="font-medium text-foreground">
                                            {video.original_filename ||
                                                video.filename}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Arquivo interno
                                        </dt>
                                        <dd className="font-mono text-xs break-all text-foreground">
                                            {video.filename}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Tipo MIME
                                        </dt>
                                        <dd className="text-foreground">
                                            {video.mime_type ?? '—'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-6">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                                    <HardDrive className="h-5 w-5" />
                                    Tamanho e duração
                                </h2>
                                <dl className="space-y-3 text-sm">
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Tamanho
                                        </dt>
                                        <dd className="text-foreground">
                                            {video.human_size}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            Duração
                                        </dt>
                                        <dd className="text-foreground">
                                            {video.human_duration ?? '—'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Metadados */}
                        {video.metadata &&
                            Object.keys(video.metadata).length > 0 && (
                                <div className="rounded-xl border border-border bg-card p-6">
                                    <h2 className="mb-4 text-lg font-semibold text-foreground">
                                        Metadados
                                    </h2>
                                    <pre className="max-h-48 overflow-auto rounded bg-muted p-4 text-xs text-muted-foreground">
                                        {JSON.stringify(
                                            video.metadata,
                                            null,
                                            2,
                                        )}
                                    </pre>
                                </div>
                            )}

                        <div className="flex gap-2">
                            <Button asChild variant="outline">
                                <Link to="/admin/videos">Voltar à lista</Link>
                            </Button>
                            <Button asChild>
                                <Link to={`/admin/videos/${video.id}/editar`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar vídeo
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
