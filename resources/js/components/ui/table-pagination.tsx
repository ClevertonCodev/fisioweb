import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from './button';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface TablePaginationProps {
    currentPage: number;
    lastPage: number;
    links: PaginationLink[];
    className?: string;
    preserveState?: boolean;
    preserveScroll?: boolean;
}

export function TablePagination({
    lastPage,
    links,
    className,
    preserveState = true,
    preserveScroll = true,
}: TablePaginationProps) {
    if (lastPage <= 1) return null;

    // Links from Laravel: first is "prev", last is "next", middle are page numbers
    const prevLink = links[0];
    const nextLink = links[links.length - 1];
    const pageLinks = links.slice(1, -1);

    const navigate = (url: string | null) => {
        if (!url) return;
        router.visit(url, { preserveState, preserveScroll });
    };

    return (
        <div className={cn('flex items-center justify-center gap-1.5 py-4', className)}>
            <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={!prevLink.url}
                onClick={() => navigate(prevLink.url)}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageLinks.map((link, idx) => {
                if (link.label === '...') {
                    return (
                        <span
                            key={`ellipsis-${idx}`}
                            className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
                        >
                            …
                        </span>
                    );
                }
                return (
                    <Button
                        key={link.label}
                        variant={link.active ? 'default' : 'outline'}
                        size="icon"
                        className="h-9 w-9 text-sm font-medium"
                        onClick={() => navigate(link.url)}
                        disabled={!link.url}
                    >
                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                    </Button>
                );
            })}

            <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={!nextLink.url}
                onClick={() => navigate(nextLink.url)}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
