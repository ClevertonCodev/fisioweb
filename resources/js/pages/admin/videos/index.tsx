import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    Search,
    SlidersHorizontal,
    Upload,
    X,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { VideoCard } from '@/components/admin/VideoCard';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import FlashMessage from '@/components/flash-message';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePresignedUpload } from '@/hooks/use-presigned-upload';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { VideoData } from '@/types/video';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vídeos',
        href: '/admin/videos',
    },
];

interface PaginatedVideos {
    data: VideoData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface VideosProps {
    videos: PaginatedVideos;
}

export default function Videos({ videos }: VideosProps) {
    const { upload, abort, status, progress, error, reset } = usePresignedUpload();
    const [dragOver, setDragOver] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredVideos = useMemo(() => {
        if (!search.trim()) return videos.data;
        const q = search.toLowerCase().trim();
        return videos.data.filter(
            (v) =>
                v.original_filename.toLowerCase().includes(q) ||
                v.filename.toLowerCase().includes(q),
        );
    }, [videos.data, search]);

    const handleFile = useCallback(
        async (file: File) => {
            const result = await upload(file);
            if (result) {
                router.reload({ only: ['videos'] });
            }
        },
        [upload],
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                handleFile(file);
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        [handleFile],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) {
                handleFile(file);
            }
        },
        [handleFile],
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleDelete = useCallback((video: VideoData) => {
        if (!confirm('Tem certeza que deseja excluir este vídeo?')) return;

        fetch(`/admin/videos/${video.id}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '',
                ),
            },
            credentials: 'same-origin',
        }).then((res) => {
            if (res.ok) {
                router.reload({ only: ['videos'] });
            }
        });
    }, []);

    const handlePlay = useCallback((video: VideoData) => {
        setSelectedVideo(video);
        setIsVideoModalOpen(true);
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
            <Head title="Biblioteca de Vídeos" />
            <div className="flex h-full flex-1 flex-col overflow-x-auto">
                <FlashMessage />

                {/* Header estilo Biblioteca de Exercícios */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-6 py-4 supports-[backdrop-filter]:bg-background/80">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-2xl font-semibold text-foreground">
                            Biblioteca de Vídeos
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Pesquisar"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                Filtros
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    {/* Upload Area compacta */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`mb-6 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                            dragOver
                                ? 'border-primary bg-primary/5'
                                : 'border-sidebar-border/70 bg-card'
                        } ${isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:border-primary/50'}`}
                        onClick={() =>
                            !isUploading && fileInputRef.current?.click()
                        }
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/x-flv,video/x-matroska"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {isUploading ? (
                            <div className="flex flex-col items-center gap-3">
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        abort();
                                    }}
                                >
                                    <X className="mr-1 size-3" />
                                    Cancelar
                                </Button>
                            </div>
                        ) : status === 'completed' ? (
                            <div className="flex flex-col items-center gap-3">
                                <CheckCircle2 className="size-10 text-green-500" />
                                <p className="text-sm font-medium text-green-600">
                                    Upload concluído!
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        reset();
                                    }}
                                >
                                    Enviar outro
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <Upload className="size-10 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Arraste um vídeo ou clique para
                                        selecionar
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        MP4, MPEG, MOV, AVI, WebM, FLV, MKV —
                                        Máx. 20MB
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                            <button onClick={reset} className="ml-auto">
                                <X className="size-4" />
                            </button>
                        </div>
                    )}

                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                            Total de vídeos: {videos.total} (
                            {videos.current_page} de {videos.last_page} páginas)
                        </p>
                    </div>

                    {filteredVideos.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                {filteredVideos.map((video) => (
                                    <VideoCard
                                        key={video.id}
                                        video={video}
                                        onPlay={handlePlay}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                            {videos.last_page > 1 && (
                                <Pagination
                                    links={videos.links}
                                    total={videos.total}
                                    currentCount={videos.data.length}
                                    label="vídeos"
                                />
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <Search className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium text-foreground">
                                Nenhum vídeo encontrado
                            </h3>
                            <p className="max-w-md text-muted-foreground">
                                {search.trim()
                                    ? 'Tente ajustar a busca ou limpar o filtro.'
                                    : 'Envie um vídeo usando a área acima.'}
                            </p>
                            {search.trim() && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setSearch('')}
                                >
                                    Limpar busca
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <VideoPlayerModal
                open={isVideoModalOpen}
                onOpenChange={setIsVideoModalOpen}
                video={selectedVideo}
            />
        </AppLayout>
    );
}
