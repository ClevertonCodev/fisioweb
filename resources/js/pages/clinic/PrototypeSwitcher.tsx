import { Branch as DismissableBranch } from '@radix-ui/react-dismissable-layer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface PrototypeVariant {
    key: string;
    name: string;
}

interface PrototypeSwitcherProps {
    variants: readonly PrototypeVariant[];
    current: string;
    /** Parâmetro da URL que a barra controla (padrão `variant`). */
    param?: string;
    /**
     * `page`: barra da página; ignora o teclado com um diálogo aberto.
     * `dialog`: barra por cima de um modal; clicar nela não fecha o modal.
     */
    scope?: 'page' | 'dialog';
    /** Texto antes da chave (ex.: "Modal"). */
    prefix?: string;
}

/**
 * Barra flutuante de protótipo de UI. Só existe em desenvolvimento.
 * Atualiza `?variant=` (shareable) e aceita ← → fora de campos de texto.
 */
export function PrototypeSwitcher({
    variants,
    current,
    param = 'variant',
    scope = 'page',
    prefix,
}: PrototypeSwitcherProps) {
    const [, setSearchParams] = useSearchParams();

    const setVariant = useCallback(
        (key: string) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set(param, key);
                    return next;
                },
                { replace: true },
            );
        },
        [param, setSearchParams],
    );

    const cycle = useCallback(
        (direction: 1 | -1) => {
            const keys = variants.map((v) => v.key);
            const index = keys.indexOf(current);
            const from = index < 0 ? 0 : index;
            const next = keys[(from + direction + keys.length) % keys.length];
            if (next) setVariant(next);
        },
        [current, setVariant, variants],
    );

    useEffect(() => {
        function onKey(event: KeyboardEvent) {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
            }
            const dialogOpen = !!document.querySelector('[role="dialog"]');
            if ((scope === 'page') === dialogOpen) return;
            const target = event.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'SELECT' ||
                    target.isContentEditable ||
                    target.closest(
                        '[role="listbox"],[role="option"],[role="menu"],[role="radiogroup"],[role="combobox"]',
                    ) ||
                    target.closest('[contenteditable="true"]'))
            ) {
                return;
            }
            event.preventDefault();
            cycle(event.key === 'ArrowRight' ? 1 : -1);
        }

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [cycle, scope]);

    if (!import.meta.env.DEV) return null;

    const active =
        variants.find((v) => v.key === current) ?? variants[0] ?? null;
    if (!active) return null;

    const bar = (
        <div
            role="group"
            aria-label="Trocar variante do protótipo"
            className={
                scope === 'dialog'
                    ? 'pointer-events-none fixed inset-x-0 top-3 z-[1100] flex justify-center px-4'
                    : 'pointer-events-none fixed inset-x-0 bottom-5 z-[200] flex justify-center px-4'
            }
        >
            <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#111118] px-1.5 py-1.5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
                <button
                    type="button"
                    aria-label="Variante anterior"
                    onClick={() => cycle(-1)}
                    className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-white/10"
                >
                    <ChevronLeft className="size-5" />
                </button>
                <p className="min-w-[196px] px-2 text-center text-[13px] font-medium tracking-wide">
                    {prefix ? `${prefix} ` : ''}
                    {active.key}{' '}
                    <span className="font-normal text-white/70">
                        ({active.name})
                    </span>
                </p>
                <button
                    type="button"
                    aria-label="Próxima variante"
                    onClick={() => cycle(1)}
                    className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-white/10"
                >
                    <ChevronRight className="size-5" />
                </button>
            </div>
        </div>
    );
    // Branch: o Radix trata cliques aqui como "dentro" do modal aberto.
    return scope === 'dialog' ? (
        <DismissableBranch asChild>{bar}</DismissableBranch>
    ) : (
        bar
    );
}

export function usePrototypeVariant(
    variants: readonly PrototypeVariant[],
    fallback = 'A',
    param = 'variant',
): string {
    const [searchParams] = useSearchParams();
    const raw = (searchParams.get(param) ?? fallback).toUpperCase();
    return variants.some((v) => v.key === raw) ? raw : fallback;
}
