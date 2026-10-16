import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

import { dsCn } from '../utils/ds-cn';

export interface PaginationProps {
    /** Página atual (no Vue: modelValue). */
    page?: number;
    onPageChange?: (page: number) => void;
    total: number;
    perPage?: number;
    compact?: boolean;
    itemLabel?: string;
    className?: string;
}

type PageItem = number | '…';

/** Páginas visíveis: todas até 7; acima disso, 1 … vizinhas da atual … última. */
export function visiblePages(current: number, total: number): PageItem[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: PageItem[] = [1];
    if (current > 3) pages.push('…');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('…');
    pages.push(total);
    return pages;
}

const PAGE_BTN =
    'inline-flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1.5 rounded-ds-md border border-transparent bg-transparent px-2 font-ds text-[0.875rem] text-ds-content-muted transition-[background,border-color,color] duration-[120ms] focus-visible:shadow-ds-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40';
const PAGE_BTN_HOVER =
    'enabled:hover:bg-ds-surface-subtle enabled:hover:text-ds-content-primary';
const NAV_BTN =
    'border-ds-border-subtle bg-ds-surface-default px-3 enabled:hover:border-ds-primary-80 enabled:hover:text-ds-primary-80 ds-dark:enabled:hover:border-ds-primary-60 ds-dark:enabled:hover:text-ds-primary-60 [&_svg]:size-3.5';

export function DsPagination({
    page = 1,
    onPageChange,
    total: rawTotal,
    perPage: rawPerPage = 20,
    compact = false,
    itemLabel = 'itens',
    className,
}: PaginationProps) {
    // `total` NaN/Infinity (ex.: `Number(meta?.total)`) vale 0; `perPage` mínimo 1.
    const total =
        Number.isFinite(rawTotal) && rawTotal > 0 ? Math.trunc(rawTotal) : 0;
    const perPage =
        Number.isFinite(rawPerPage) && rawPerPage >= 1
            ? Math.trunc(rawPerPage)
            : 1;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    // `page` não numérico (lixo vindo da URL) vale como 1; decimal é truncado.
    const requested = Number.isFinite(page) ? Math.trunc(page) : 1;
    // Com `total` 0 a lista pode estar só carregando: não corrige a página do
    // pai (a tela mostra a 1 até o total chegar).
    const current =
        total > 0 ? Math.min(Math.max(1, requested), totalPages) : 1;
    const from = (current - 1) * perPage + 1;
    const to = Math.min(current * perPage, total);
    const format = (value: number) => value.toLocaleString('pt-BR');
    const summary =
        total > 0
            ? `${format(from)}–${format(to)} de ${format(total)} ${itemLabel}`
            : `0 de 0 ${itemLabel}`;

    // `page` fora do intervalo: avisa o pai da página corrigida. Só com `total`
    // conhecido (enquanto carrega, total 0 não diz nada) e só quando os dois
    // diferem, então um pai que aceita a correção não entra em loop.
    useEffect(() => {
        if (total > 0 && current !== page) onPageChange?.(current);
    }, [total, current, page, onPageChange]);

    function go(target: number) {
        if (target < 1 || target > totalPages) return;
        onPageChange?.(target);
    }

    const prevButton = (withText: boolean) => (
        <button
            type="button"
            aria-label="Página anterior"
            disabled={current === 1}
            onClick={() => go(current - 1)}
            className={dsCn(PAGE_BTN, NAV_BTN)}
        >
            <ChevronLeft aria-hidden="true" />
            {withText && <span>Anterior</span>}
        </button>
    );

    const nextButton = (withText: boolean) => (
        <button
            type="button"
            aria-label="Próxima página"
            disabled={current === totalPages}
            onClick={() => go(current + 1)}
            className={dsCn(PAGE_BTN, NAV_BTN)}
        >
            {withText && <span>Próxima</span>}
            <ChevronRight aria-hidden="true" />
        </button>
    );

    return (
        <nav
            aria-label="Paginação"
            className={dsCn(
                'box-border flex w-full flex-col items-stretch gap-4 font-ds ds-sm:flex-row ds-sm:flex-wrap ds-sm:items-center',
                compact ? 'ds-sm:justify-center' : 'ds-sm:justify-between',
                className,
            )}
        >
            {!compact && (
                <div className="order-2 text-center text-[0.8125rem] text-ds-content-muted ds-sm:order-none ds-sm:text-left">
                    <span>{summary}</span>
                </div>
            )}

            <div
                data-testid="ds-pagination-controls"
                className="hidden items-center gap-1 ds-sm:flex"
            >
                {prevButton(!compact)}
                <div className="flex items-center gap-0.5">
                    {visiblePages(current, totalPages).map((item, index) =>
                        item === '…' ? (
                            <span
                                key={`gap-${index}`}
                                aria-hidden="true"
                                data-ds-pagination-gap=""
                                className="inline-flex h-9 min-w-9 items-center justify-center px-2 font-ds text-[0.875rem] text-ds-content-subtle"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                aria-current={
                                    item === current ? 'page' : undefined
                                }
                                onClick={() => go(item)}
                                className={dsCn(
                                    PAGE_BTN,
                                    item === current
                                        ? 'border-ds-primary-80 bg-ds-primary-80 font-semibold text-ds-white ds-dark:border-ds-primary-60 ds-dark:bg-ds-primary-60'
                                        : PAGE_BTN_HOVER,
                                )}
                            >
                                {item}
                            </button>
                        ),
                    )}
                </div>
                {nextButton(!compact)}
            </div>

            <div className="order-1 flex w-full items-center justify-center gap-2 ds-sm:hidden">
                {prevButton(false)}
                <label className="flex items-center gap-2 text-ds-body-xs text-ds-content-muted">
                    <span className="whitespace-nowrap">Página</span>
                    <select
                        aria-label="Selecionar página"
                        value={current}
                        onChange={(event) => go(Number(event.target.value))}
                        className="min-h-10 cursor-pointer rounded-ds-md border border-ds-border-subtle bg-ds-surface-default px-2 font-ds text-ds-body-xs text-ds-content-primary ds-dark:[color-scheme:dark]"
                    >
                        {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                        ).map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                    <span className="whitespace-nowrap">de {totalPages}</span>
                </label>
                {nextButton(false)}
            </div>
        </nav>
    );
}
