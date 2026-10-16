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

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps extends OverlayCommonProps {
    size?: ModalSize;
}

const modalSurface = cva(
    'fixed top-1/2 left-1/2 z-[1000] flex max-h-[calc(100vh-48px)] w-[calc(100vw-48px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-ds-lg bg-ds-surface-default font-ds shadow-ds-md outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-3 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-3',
    {
        variants: {
            size: {
                sm: 'max-w-[480px]',
                md: 'max-w-[600px]',
                lg: 'max-w-[800px]',
                full: 'max-w-[calc(100vw-48px)]',
            },
        },
    },
);

/**
 * Janela modal centralizada. O Radix Dialog cuida do portal, do foco preso,
 * do Esc, de devolver o foco ao gatilho e de travar a rolagem da página.
 */
export function DsModal({
    open = false,
    onOpenChange,
    onClose,
    size = 'md',
    title,
    meta,
    closeOnBackdrop = true,
    footer,
    children,
}: ModalProps) {
    const returnFocus = useReturnFocus();
    return (
        <DialogPrimitive.Root
            open={open}
            onOpenChange={overlayOpenChangeHandler(onOpenChange, onClose)}
        >
            <DialogPrimitive.Portal>
                <OverlayBackdrop blur />
                <DialogPrimitive.Content
                    aria-modal="true"
                    data-size={size}
                    {...(meta ? {} : { 'aria-describedby': undefined })}
                    onInteractOutside={backdropGuard(closeOnBackdrop)}
                    {...returnFocus}
                    className={dsCn(modalSurface({ size }))}
                >
                    <OverlayHead title={title} meta={meta} />
                    <OverlayBody>{children}</OverlayBody>
                    {footer && <OverlayFooter>{footer}</OverlayFooter>}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
