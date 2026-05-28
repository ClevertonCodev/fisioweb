import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function TablePagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: TablePaginationProps) {
    const getPages = (): (number | '...')[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | '...')[] = [1];

        if (currentPage > 3) {
            pages.push(2, '...');
        } else {
            pages.push(2, 3);
        }

        if (currentPage > 3 && currentPage < totalPages - 2) {
            pages.push(currentPage - 1, currentPage, currentPage + 1);
        }

        if (currentPage < totalPages - 2) {
            pages.push('...', totalPages);
        } else {
            pages.push(totalPages - 2, totalPages - 1, totalPages);
        }

        const unique = [...new Set(pages)];
        return unique;
    };

    const pages = getPages();

    return (
        <div className={cn('flex items-center justify-center gap-1', className)}>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md"
                disabled={currentPage === 1}
                aria-label="Página anterior"
                onClick={() => onPageChange(currentPage - 1)}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {pages.map((page, idx) =>
                page === '...' ? (
                    <span
                        key={`ellipsis-${idx}`}
                        className="text-muted-foreground flex h-8 w-8 items-center justify-center text-sm select-none"
                    >
                        …
                    </span>
                ) : (
                    <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8 rounded-md text-sm font-medium"
                        aria-label={`Ir para página ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </Button>
                ),
            )}

            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md"
                disabled={currentPage === totalPages}
                aria-label="Próxima página"
                onClick={() => onPageChange(currentPage + 1)}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
