import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef } from 'react';

import { dsCn } from '../utils/ds-cn';

/** Props comuns ao DsModal e ao DsDrawer (o controlado vira `open` + `onOpenChange`). */
export interface OverlayCommonProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Equivale ao ao fechar: chamado sempre que o overlay fecha. */
    onClose?: () => void;
    title?: string;
    meta?: string;
    closeOnBackdrop?: boolean;
    /** `footer` (ações). Sem ele, o rodapé não é renderizado. */
    footer?: ReactNode;
    children?: ReactNode;
}

/** Repassa a mudança ao pai e, quando fecha, avisa pelo `onClose`. */
export function overlayOpenChangeHandler(
    onOpenChange: OverlayCommonProps['onOpenChange'],
    onClose: OverlayCommonProps['onClose'],
) {
    return (next: boolean) => {
        onOpenChange?.(next);
        if (!next) onClose?.();
    };
}

/**
 * Com closeOnBackdrop=false, o clique fora não fecha. O Esc continua fechando,
 *
 */
export function backdropGuard(closeOnBackdrop: boolean) {
    return closeOnBackdrop
        ? undefined
        : (event: Event) => event.preventDefault();
}

/**
 * Sem Dialog.Trigger, o Radix devolve o foco ao `body` ao fechar. Guarda quem
 * tinha o foco na abertura (o botão que abriu) e devolve a ele.
 */
export function useReturnFocus() {
    const previous = useRef<HTMLElement | null>(null);
    return {
        onOpenAutoFocus: () => {
            previous.current = document.activeElement as HTMLElement | null;
        },
        onCloseAutoFocus: (event: Event) => {
            const target = previous.current;
            previous.current = null;
            if (target?.isConnected && target !== document.body) {
                event.preventDefault();
                target.focus();
            }
        },
    };
}

export function OverlayBackdrop({ blur = false }: { blur?: boolean }) {
    return (
        <DialogPrimitive.Overlay
            data-testid="ds-overlay-backdrop"
            className={dsCn(
                'fixed inset-0 z-[1000] bg-[var(--ds-overlay-backdrop)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
                blur && 'backdrop-blur-[2px]',
            )}
        />
    );
}

interface OverlayHeadProps {
    title?: string;
    meta?: string;
    /** O botão de fechar do drawer tem canto md; o do modal, pill. */
    closeRounded?: 'pill' | 'md';
}

export function OverlayHead({
    title,
    meta,
    closeRounded = 'pill',
}: OverlayHeadProps) {
    return (
        <div className="flex items-start justify-between gap-3 px-6 pt-5">
            <div className="flex flex-col gap-1">
                {/* Sem título visível, o Radix ainda precisa de um nome para o dialog. */}
                <DialogPrimitive.Title
                    className={
                        title
                            ? 'm-0 text-[1.0625rem] leading-[1.4] font-semibold text-ds-content-primary'
                            : 'sr-only'
                    }
                >
                    {title || 'Janela'}
                </DialogPrimitive.Title>
                {meta && (
                    <DialogPrimitive.Description className="text-[0.8125rem] text-ds-content-muted">
                        {meta}
                    </DialogPrimitive.Description>
                )}
            </div>
            <DialogPrimitive.Close
                aria-label="Fechar"
                className={dsCn(
                    'flex size-8 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent text-ds-content-muted transition-[background,color] duration-150 hover:bg-ds-surface-subtle hover:text-ds-content-primary focus-visible:shadow-ds-focus focus-visible:outline-none',
                    closeRounded === 'pill'
                        ? 'rounded-ds-pill'
                        : 'rounded-ds-md',
                )}
            >
                <X aria-hidden="true" className="size-[18px]" />
            </DialogPrimitive.Close>
        </div>
    );
}

export function OverlayBody({ children }: { children?: ReactNode }) {
    return (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-[0.875rem] leading-[1.6] text-ds-content-primary">
            {children}
        </div>
    );
}

export function OverlayFooter({
    children,
    className,
}: {
    children?: ReactNode;
    className?: string;
}) {
    return (
        <div
            data-slot="footer"
            className={dsCn(
                'flex shrink-0 items-center justify-end gap-2 border-t border-ds-border-subtle px-6 pt-4 pb-5',
                className,
            )}
        >
            {children}
        </div>
    );
}
