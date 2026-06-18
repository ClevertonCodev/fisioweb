import { Plus, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    VIDEO_STATUS_LABELS,
    VIDEO_STATUS_VARIANTS,
} from '@/application/admin/exercise-constants';
import type { AdminVideo } from '@/application/admin/ports';
import {
    useAdminVideos,
    useDeleteAdminVideo,
} from '@/application/admin/use-admin-videos';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ExerciseCard } from '@/components/ExerciseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

export default function AdminVideosPage() {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [search, setSearch] = useState('');

    const { data, isLoading, isError, error } = useAdminVideos({
        per_page: perPage,
        page,
    });
    const deleteVideo = useDeleteAdminVideo();
    const navigate = useNavigate();

    const filteredVideos = useMemo(() => {
        if (!data?.data || !search.trim()) return data?.data ?? [];
        const q = search.toLowerCase().trim();
        return data.data.filter(
            (v) =>
                (v.original_filename ?? '').toLowerCase().includes(q) ||
                v.filename.toLowerCase().includes(q),
        );
    }, [data?.data, search]);

    const meta = data?.meta;
    const totalPages = meta?.last_page ?? 1;

    const handleEdit = useCallback(
        (video: AdminVideo) => {
            navigate(`/admin/videos/${video.id}/editar`);
        },
        [navigate],
    );

    const handleDelete = useCallback(
        (video: AdminVideo) => {
            if (!confirm('Tem certeza que deseja excluir este vídeo?')) return;
            deleteVideo.mutate(video.id, {
                onSuccess: () => {
                    toast.success('Vídeo excluído.');
                },
                onError: (err) => {
                    toast.error(err.message ?? 'Erro ao excluir');
                },
            });
        },
        [deleteVideo],
    );

    if (isError) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Não foi possível carregar os vídeos.
                    </p>
                    <p className="text-sm text-destructive">
                        {error instanceof Error
                            ? error.message
                            : 'Erro desconhecido'}
                    </p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center justify-between gap-4 px-6 py-4">
                        <h1 className="text-2xl font-semibold text-foreground">
                            Biblioteca de Vídeos
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="relative w-64">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Pesquisar"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button asChild size="sm" className="gap-2">
                                <Link to="/admin/videos/novo">
                                    <Plus className="h-4 w-4" />
                                    Enviar vídeo
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    {isLoading ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Carregando...
                        </div>
                    ) : (
                        <>
                            {meta && (
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Total de vídeos: {meta.total} (página{' '}
                                    {meta.current_page} de {meta.last_page})
                                </p>
                            )}
                            {filteredVideos.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                        {filteredVideos.map((video) => (
                                            <ExerciseCard
                                                key={video.id}
                                                videoUrl={
                                                    video.cdn_url ?? video.url
                                                }
                                                thumbnailUrl={
                                                    video.thumbnail_url
                                                }
                                                title={
                                                    video.original_filename ??
                                                    video.filename
                                                }
                                                canPlay={
                                                    video.status ===
                                                        'completed' &&
                                                    !!video.cdn_url
                                                }
                                                badge={
                                                    <StatusBadge
                                                        variant={
                                                            VIDEO_STATUS_VARIANTS[
                                                                video.status
                                                            ] ?? 'neutral'
                                                        }
                                                    >
                                                        {VIDEO_STATUS_LABELS[
                                                            video.status
                                                        ] ?? video.status}
                                                    </StatusBadge>
                                                }
                                                onEdit={() => handleEdit(video)}
                                                onDelete={() =>
                                                    handleDelete(video)
                                                }
                                            />
                                        ))}
                                    </div>
                                    {!search.trim() && (
                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>Itens por página</span>
                                                <Select
                                                    value={String(perPage)}
                                                    onValueChange={(v) => {
                                                        setPerPage(Number(v));
                                                        setPage(1);
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 w-[5rem]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PAGE_SIZE_OPTIONS.map(
                                                            (n) => (
                                                                <SelectItem
                                                                    key={n}
                                                                    value={String(
                                                                        n,
                                                                    )}
                                                                >
                                                                    {n}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {totalPages > 1 && (
                                                <Pagination>
                                                    <PaginationContent>
                                                        <PaginationItem>
                                                            <PaginationPrevious
                                                                href="#"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    if (
                                                                        page > 1
                                                                    )
                                                                        setPage(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p -
                                                                                1,
                                                                        );
                                                                }}
                                                                aria-disabled={
                                                                    page <= 1
                                                                }
                                                                className={
                                                                    page <= 1
                                                                        ? 'pointer-events-none opacity-50'
                                                                        : ''
                                                                }
                                                            />
                                                        </PaginationItem>
                                                        {Array.from(
                                                            {
                                                                length: totalPages,
                                                            },
                                                            (_, i) => i + 1,
                                                        )
                                                            .filter(
                                                                (p) =>
                                                                    p === 1 ||
                                                                    p ===
                                                                        totalPages ||
                                                                    Math.abs(
                                                                        p -
                                                                            page,
                                                                    ) <= 1,
                                                            )
                                                            .map(
                                                                (
                                                                    p,
                                                                    idx,
                                                                    arr,
                                                                ) => (
                                                                    <PaginationItem
                                                                        key={p}
                                                                    >
                                                                        {idx >
                                                                            0 &&
                                                                            arr[
                                                                                idx -
                                                                                    1
                                                                            ] !==
                                                                                p -
                                                                                    1 && (
                                                                                <span className="px-2">
                                                                                    …
                                                                                </span>
                                                                            )}
                                                                        <PaginationLink
                                                                            href="#"
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.preventDefault();
                                                                                setPage(
                                                                                    p,
                                                                                );
                                                                            }}
                                                                            isActive={
                                                                                page ===
                                                                                p
                                                                            }
                                                                        >
                                                                            {p}
                                                                        </PaginationLink>
                                                                    </PaginationItem>
                                                                ),
                                                            )}
                                                        <PaginationItem>
                                                            <PaginationNext
                                                                href="#"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    if (
                                                                        page <
                                                                        totalPages
                                                                    )
                                                                        setPage(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p +
                                                                                1,
                                                                        );
                                                                }}
                                                                aria-disabled={
                                                                    page >=
                                                                    totalPages
                                                                }
                                                                className={
                                                                    page >=
                                                                    totalPages
                                                                        ? 'pointer-events-none opacity-50'
                                                                        : ''
                                                                }
                                                            />
                                                        </PaginationItem>
                                                    </PaginationContent>
                                                </Pagination>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <p className="mb-2 text-lg font-medium text-foreground">
                                        Nenhum vídeo encontrado
                                    </p>
                                    <p className="max-w-md text-muted-foreground">
                                        {search.trim()
                                            ? 'Tente ajustar a busca ou limpar o filtro.'
                                            : 'Envie um vídeo para começar. Depois vincule aos exercícios na tela de Exercícios.'}
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
                                            <Link to="/admin/videos/novo">
                                                <Plus className="h-4 w-4" />
                                                Enviar vídeo
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
