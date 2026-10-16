import type { ReactNode } from 'react';

interface CatalogSectionProps {
    id: string;
    title: string;
    description?: string;
    children: ReactNode;
}

export function CatalogSection({
    id,
    title,
    description,
    children,
}: CatalogSectionProps) {
    return (
        <section
            id={id}
            aria-labelledby={`${id}-title`}
            className="scroll-mt-6 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-6 shadow-ds-xs"
        >
            <h2
                id={`${id}-title`}
                className="text-ds-body-lg font-semibold text-ds-content-primary"
            >
                {title}
            </h2>
            {description && (
                <p className="mt-1 text-ds-body-xs text-ds-content-muted">
                    {description}
                </p>
            )}
            <div className="mt-6 flex flex-col gap-6">{children}</div>
        </section>
    );
}

interface CatalogRowProps {
    label: string;
    children: ReactNode;
}

export function CatalogRow({ label, children }: CatalogRowProps) {
    return (
        <div className="flex flex-col gap-3">
            <span className="font-ds-mono text-ds-caption tracking-wide text-ds-content-subtle uppercase">
                {label}
            </span>
            <div className="flex flex-wrap items-start gap-4">{children}</div>
        </div>
    );
}
