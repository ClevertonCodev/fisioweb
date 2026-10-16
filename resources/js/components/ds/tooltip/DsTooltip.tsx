import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import type { TooltipProps } from './types';

/** Distância entre o gatilho e o balão. */
const GAP = 8;
/** Respiro mínimo entre o balão e a borda da viewport. */
const EDGE = 8;

/**
 * Balão de ajuda no hover e no foco. O Radix cuida do portal, de virar o lado
 * quando falta espaço e de manter o balão dentro da viewport.
 */
export function DsTooltip({
    content,
    placement = 'top',
    children,
    asChild = false,
}: TooltipProps) {
    if (content === null || content === undefined || content === '') {
        return <>{children}</>;
    }

    return (
        // disableHoverableContent: o balão não segura o ponteiro (no Vue é pointer-events: none).
        <TooltipPrimitive.Provider
            delayDuration={0}
            skipDelayDuration={0}
            disableHoverableContent
        >
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                    {asChild ? (
                        children
                    ) : (
                        <span
                            data-ds-tooltip-trigger=""
                            className="inline-flex items-center"
                        >
                            {children}
                        </span>
                    )}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        data-ds-tooltip-bubble=""
                        side={placement}
                        sideOffset={GAP}
                        collisionPadding={EDGE}
                        className="z-[11000] max-w-[min(260px,calc(100vw-1rem))] rounded-ds-md bg-ds-surface-inverse px-3 py-2 text-left font-ds text-ds-caption leading-[1.4] [overflow-wrap:break-word] whitespace-pre-line text-ds-content-on-inverse data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0"
                    >
                        {content}
                        <TooltipPrimitive.Arrow
                            width={10}
                            height={5}
                            className="fill-ds-surface-inverse"
                        />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}
