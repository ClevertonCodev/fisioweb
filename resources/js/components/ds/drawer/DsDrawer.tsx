import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';

import {
    backdropGuard,
    OverlayBackdrop,
    OverlayBody,
    type OverlayCommonProps,
    OverlayFooter,
    OverlayHead,
    overlayOpenChangeHandler,
    useReturnFocus,
} from '../overlay/overlay-parts';
import { dsCn } from '../utils/ds-cn';

export type DrawerPlacement = 'right' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DrawerProps extends OverlayCommonProps {
    placement?: DrawerPlacement;
    size?: DrawerSize;
    /** Classe extra na superfície do drawer. */
    surfaceClass?: string;
}

const drawerSurface = cva(
    'fixed z-[1000] flex min-h-0 flex-col overflow-hidden bg-ds-surface-default font-ds text-[0.875rem] text-ds-content-primary outline-none data-[state=closed]:animate-out data-[state=closed]:duration-250 data-[state=open]:animate-in data-[state=open]:duration-250',
    {
        variants: {
            placement: {
                // Abaixo de 768px o drawer lateral ocupa a largura toda, sem cantos.
                right: 'inset-y-0 right-0 h-[100dvh] max-h-[100dvh] rounded-l-ds-xl shadow-[-4px_0_24px_rgba(26,26,47,0.1)] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right max-md:w-full! max-md:max-w-full max-md:rounded-none',
                bottom: 'inset-x-0 bottom-0 max-h-[80vh] w-full rounded-t-ds-xl shadow-[0_-4px_24px_rgba(26,26,47,0.1)] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            },
            size: { sm: '', md: '', lg: '', xl: '' },
        },
        compoundVariants: [
            { placement: 'right', size: 'sm', class: 'w-[min(33vw,380px)]' },
            { placement: 'right', size: 'md', class: 'w-[min(50vw,600px)]' },
            { placement: 'right', size: 'lg', class: 'w-[min(70vw,1000px)]' },
            { placement: 'right', size: 'xl', class: 'w-[min(82vw,1180px)]' },
        ],
    },
);

// No celular, botões vêm antes do texto de status e dividem a linha; evita o
// CTA principal fora da tela no Android (mesma regra do Vue).
const MOBILE_FOOTER =
    'max-md:flex-wrap max-md:items-stretch max-md:justify-stretch max-md:gap-x-3 max-md:gap-y-2 max-md:bg-ds-surface-default max-md:pb-[calc(20px+env(safe-area-inset-bottom,0px))] max-md:shadow-[0_-6px_20px_rgba(26,26,47,0.08)] max-md:[&>button]:order-1 max-md:[&>button]:max-w-full max-md:[&>button]:min-w-0 max-md:[&>button]:flex-[1_1_calc(50%-6px)] max-md:[&>div]:order-1 max-md:[&>div]:min-w-0 max-md:[&>div]:flex-[1_1_100%] max-md:[&>p]:order-2 max-md:[&>p]:m-0 max-md:[&>p]:flex-[1_1_100%] max-md:[&>span]:order-2 max-md:[&>span]:m-0 max-md:[&>span]:flex-[1_1_100%]';

/**
 * Painel lateral (direita) ou de baixo. O Radix Dialog cuida do portal, do
 * foco preso, do Esc só no drawer de cima quando há mais de um aberto e da
 * rolagem travada enquanto qualquer um estiver aberto.
 */
export function DsDrawer({
    open = false,
    onOpenChange,
    onClose,
    placement = 'right',
    size = 'md',
    title,
    meta,
    surfaceClass,
    closeOnBackdrop = true,
    footer,
    children,
}: DrawerProps) {
    const returnFocus = useReturnFocus();
    return (
        <DialogPrimitive.Root
            open={open}
            onOpenChange={overlayOpenChangeHandler(onOpenChange, onClose)}
        >
            <DialogPrimitive.Portal>
                <OverlayBackdrop />
                <DialogPrimitive.Content
                    aria-modal="true"
                    data-placement={placement}
                    data-size={size}
                    // Sem meta não há descrição; avisa o Radix para não reclamar.
                    {...(meta ? {} : { 'aria-describedby': undefined })}
                    onInteractOutside={backdropGuard(closeOnBackdrop)}
                    {...returnFocus}
                    className={dsCn(
                        drawerSurface({ placement, size }),
                        surfaceClass,
                    )}
                >
                    <OverlayHead title={title} meta={meta} closeRounded="md" />
                    <OverlayBody>{children}</OverlayBody>
                    {footer && (
                        <OverlayFooter className={MOBILE_FOOTER}>
                            {footer}
                        </OverlayFooter>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
