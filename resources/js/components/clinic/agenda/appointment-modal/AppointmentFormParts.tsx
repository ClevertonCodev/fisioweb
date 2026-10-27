import type { ReactNode } from 'react';

import { dsCn } from '@/components/ds';
import type { AppointmentStatus } from '@/domain/clinic';

import { DS_STATUS, statusLabel } from '../agenda-shared';

/** Rótulo de campo no padrão dos campos Ds* (os pickers não têm label). */
export function FieldLabel({
    children,
    error,
    className,
}: {
    children: ReactNode;
    error?: string;
    className?: string;
}) {
    return (
        <div className={dsCn('space-y-1.5', className)}>
            {children}
            {error && (
                <p className="text-ds-caption text-ds-content-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

export function LabelText({ children }: { children: ReactNode }) {
    return (
        <span className="block text-ds-body-xs font-medium text-ds-content-secondary">
            {children}
        </span>
    );
}

export function Chip({
    active,
    children,
    onClick,
}: {
    active: boolean;
    children: ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={dsCn(
                'cursor-pointer rounded-ds-pill border px-3 py-1 text-ds-body-xs transition-colors',
                active
                    ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-semibold text-ds-content-brand'
                    : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-strong',
            )}
        >
            {children}
        </button>
    );
}

export function PlaceOption({
    active,
    icon,
    title,
    sub,
    onClick,
}: {
    active: boolean;
    icon: ReactNode;
    title: string;
    sub: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={dsCn(
                'flex flex-1 cursor-pointer items-center gap-3 rounded-ds-lg border px-4 py-3 text-left transition-colors [&_svg]:size-5 [&_svg]:shrink-0',
                active
                    ? 'border-ds-primary-80 bg-ds-surface-brand-subtle text-ds-content-brand'
                    : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-strong',
            )}
        >
            {icon}
            <span>
                <span className="block text-ds-body-sm font-semibold">
                    {title}
                </span>
                <span className="block text-ds-caption opacity-80">{sub}</span>
            </span>
        </button>
    );
}

/** Status como pílulas nas cores do calendário; só as transições válidas. */
export function StatusPills({
    current,
    options,
    onChange,
    disabled,
}: {
    current: AppointmentStatus;
    options: AppointmentStatus[];
    onChange?: (s: AppointmentStatus) => void;
    disabled?: boolean;
}) {
    // Cancelar tem botão próprio (endpoint próprio).
    const shown = options.filter((s) => s !== 'cancelled' || s === current);
    return (
        <div className="flex flex-wrap gap-2">
            {shown.map((s) => {
                const tone = DS_STATUS[s];
                const active = s === current;
                return (
                    <button
                        key={s}
                        type="button"
                        disabled={disabled || active || !onChange}
                        aria-pressed={active}
                        onClick={() => onChange?.(s)}
                        className={dsCn(
                            'flex items-center gap-2 rounded-ds-pill border px-3 py-1.5 text-ds-body-xs font-medium transition-colors',
                            active
                                ? 'cursor-default'
                                : 'cursor-pointer border-ds-border-default bg-ds-surface-default text-ds-content-secondary hover:border-ds-border-strong disabled:cursor-not-allowed disabled:opacity-50',
                        )}
                        style={
                            active
                                ? {
                                      background: tone.surface,
                                      borderColor: tone.accent,
                                      color: tone.content,
                                  }
                                : undefined
                        }
                    >
                        <span
                            className="size-2.5 shrink-0 rounded-ds-full"
                            style={{ background: tone.accent }}
                        />
                        {statusLabel(s)}
                    </button>
                );
            })}
        </div>
    );
}
