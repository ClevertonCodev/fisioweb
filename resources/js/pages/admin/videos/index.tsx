import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { VideoCard } from '@/components/admin/video-card';
import FlashMessage from '@/components/flash-message';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoPlayerModal } from '@/components/video-player-modal';
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
    const [search, setSearch] = useState('');
    const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    const filteredVideos = useMemo(() => {
        if (!search.trim()) return videos.data;
        const q = search.toLowerCase().trim();
        return videos.data.filter(
            (v) =>
                v.original_filename.toLowerCase().includes(q) ||
                v.filename.toLowerCase().includes(q),
        );
    }, [videos.data, search]);

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

    const handleEdit = useCallback((video: VideoData) => {
        router.visit(`/admin/videos/${video.id}/edit`);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Biblioteca de Vídeos" />
            <div className="flex h-full flex-1 flex-col overflow-x-auto">
                <FlashMessage />

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
                            <Link href="/admin/videos/create">
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Enviar vídeo
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
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
                                        onEdit={handleEdit}
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
                                    : 'Envie um vídeo para começar.'}
                            </p>
                            {search.trim() ? (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setSearch('')}
                                >
                                    Limpar busca
                                </Button>
                            ) : (
                                <Button asChild className="mt-4 gap-2">
                                    <Link href="/admin/videos/create">
                                        <Plus className="h-4 w-4" />
                                        Enviar vídeo
                                    </Link>
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
