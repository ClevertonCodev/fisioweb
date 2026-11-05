import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function isLocalPrototypeHost(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
}

/** `fisio-app build` is production Vite, but we still need the bar on localhost. */
function showPrototypeSwitcherBar(): boolean {
    if (import.meta.env.DEV) {
        return true;
    }
    return isLocalPrototypeHost();
}

export interface PrototypeVariantOption {
    key: string;
    label?: string;
}

interface PrototypeSwitcherProps {
    variants: PrototypeVariantOption[];
    current: string;
}

export function PrototypeSwitcher({
    variants,
    current,
}: PrototypeSwitcherProps) {
    const [, setSearchParams] = useSearchParams();

    const currentIndex = Math.max(
        0,
        variants.findIndex((v) => v.key === current),
    );
    const active = variants[currentIndex] ?? variants[0];

    const cycle = useCallback(
        (delta: number) => {
            if (variants.length === 0) return;
            const nextIndex =
                (currentIndex + delta + variants.length) % variants.length;
            const next = variants[nextIndex];
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    params.set('variant', next.key);
                    return params;
                },
                { replace: true },
            );
        },
        [currentIndex, setSearchParams, variants],
    );

    useEffect(() => {
        if (!showPrototypeSwitcherBar()) return;

        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable)
            ) {
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                cycle(-1);
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                cycle(1);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [cycle]);

    if (!showPrototypeSwitcherBar() || variants.length === 0) {
        return null;
    }

    const displayLabel = active.label
        ? `${active.key} (${active.label})`
        : active.key;

    return (
        <div
            className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-ds-pill border border-ds-border-strong bg-ds-gray-900 px-2 py-1.5 font-ds text-ds-body-xs text-ds-white shadow-ds-lg"
            role="toolbar"
            aria-label="Alternar variante do protótipo"
        >
            <button
                type="button"
                className="cursor-pointer rounded-ds-md p-1.5 hover:bg-ds-white/10"
                aria-label="Variante anterior"
                onClick={() => cycle(-1)}
            >
                <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[9rem] px-2 text-center font-medium">
                {displayLabel}
            </span>
            <button
                type="button"
                className="cursor-pointer rounded-ds-md p-1.5 hover:bg-ds-white/10"
                aria-label="Próxima variante"
                onClick={() => cycle(1)}
            >
                <ChevronRight className="size-4" />
            </button>
        </div>
    );
}
