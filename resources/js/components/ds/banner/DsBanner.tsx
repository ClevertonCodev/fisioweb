import { Sparkles, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { dsCn } from '../utils/ds-cn';

export type BannerVariant = 'brand' | 'info' | 'warning';

export interface BannerProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    variant?: BannerVariant;
    ctaLabel?: string;
    dismissible?: boolean;
    /** Slot `actions` do Vue. */
    actions?: ReactNode;
    onCta?: () => void;
    onDismiss?: () => void;
    className?: string;
}

const VARIANT_CLASSES: Record<BannerVariant, string> = {
    brand: 'bg-[image:var(--ds-gradient-brand)] text-ds-white ds-dark:bg-[image:linear-gradient(135deg,var(--ds-color-primary-60)_0%,var(--ds-color-primary-100)_100%)]',
    info: 'border border-[var(--ds-color-info-border)] bg-[var(--ds-color-info-surface)] text-[var(--ds-color-info-content)] ds-dark:border-ds-status-info-border ds-dark:bg-ds-status-info-surface ds-dark:text-ds-status-info-content',
    warning:
        'border border-[var(--ds-color-warning-border)] bg-[var(--ds-color-warning-surface)] text-[var(--ds-color-warning-content)] ds-dark:border-ds-status-warning-border ds-dark:bg-ds-status-warning-surface ds-dark:text-ds-status-warning-content',
};

export function DsBanner({
    title,
    description,
    icon,
    variant = 'brand',
    ctaLabel,
    dismissible = true,
    actions,
    onCta,
    onDismiss,
    className,
}: BannerProps) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    const isBrand = variant === 'brand';

    function dismiss() {
        setDismissed(true);
        onDismiss?.();
    }

    return (
        <div
            role="status"
            data-variant={variant}
            className={dsCn(
                'flex items-center gap-4 rounded-ds-xl px-5 py-3.5 font-ds',
                VARIANT_CLASSES[variant],
                className,
            )}
        >
            <div
                aria-hidden="true"
                className={dsCn(
                    'flex size-10 shrink-0 items-center justify-center rounded-ds-md [&_svg]:size-[22px]',
                    isBrand
                        ? 'bg-white/20'
                        : 'bg-black/6 ds-dark:bg-ds-border-subtle',
                )}
            >
                {icon ?? <Sparkles />}
            </div>

            <div className="min-w-0 flex-1">
                <div className="text-[0.9375rem] leading-[1.4] font-semibold">
                    {title}
                </div>
                {description && (
                    <div className="mt-0.5 text-[0.8125rem] leading-[1.5] opacity-85">
                        {description}
                    </div>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {ctaLabel && (
                    <button
                        type="button"
                        onClick={onCta}
                        className={dsCn(
                            'cursor-pointer rounded-ds-md border-none bg-ds-white px-4 py-[7px] font-ds text-[0.8125rem] font-semibold transition-opacity duration-150 hover:opacity-90 focus-visible:shadow-ds-focus focus-visible:outline-none',
                            isBrand
                                ? 'text-ds-primary-100 ds-dark:bg-white/18 ds-dark:text-white ds-dark:hover:bg-white/28 ds-dark:hover:opacity-100'
                                : 'text-ds-content-primary ds-dark:border-[1.5px] ds-dark:border-solid ds-dark:border-current ds-dark:bg-transparent ds-dark:text-inherit ds-dark:opacity-90 ds-dark:hover:bg-white/8 ds-dark:hover:opacity-100',
                        )}
                    >
                        {ctaLabel}
                    </button>
                )}
                {actions}
                {dismissible && (
                    <button
                        type="button"
                        aria-label="Dispensar aviso"
                        onClick={dismiss}
                        className={dsCn(
                            'flex size-7 cursor-pointer items-center justify-center rounded-ds-md border-none bg-transparent text-inherit opacity-70 transition-[opacity,background] duration-150 hover:opacity-100 focus-visible:shadow-ds-focus focus-visible:outline-none [&_svg]:size-4',
                            isBrand
                                ? 'hover:bg-white/15'
                                : 'hover:bg-white/15 ds-dark:hover:bg-ds-border-subtle',
                        )}
                    >
                        <X aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
}
