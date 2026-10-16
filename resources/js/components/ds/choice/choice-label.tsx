import type { ReactNode } from 'react';

import { dsCn } from '../utils/ds-cn';

// Rótulo compartilhado por checkbox, radio e switch (.ds-choice no Vue).

export function choiceIds(id: string) {
    return { titleId: `${id}-title`, descriptionId: `${id}-description` };
}

export function DsChoiceLabel({
    htmlFor,
    disabled,
    className,
    control,
    label,
    description,
    children,
    titleClassName,
}: {
    htmlFor: string;
    disabled?: boolean;
    className?: string;
    control: ReactNode;
    label?: string;
    description?: string;
    children?: ReactNode;
    titleClassName?: string;
}) {
    const { titleId, descriptionId } = choiceIds(htmlFor);

    return (
        <label
            htmlFor={htmlFor}
            aria-disabled={disabled || undefined}
            className={dsCn(
                'flex cursor-pointer items-start gap-2 font-ds text-ds-body-xs leading-[var(--ds-line-height-base)] text-ds-content-primary',
                disabled && 'pointer-events-none cursor-not-allowed opacity-50',
                className,
            )}
        >
            {control}
            {description ? (
                <span className="flex flex-col gap-1">
                    {label && (
                        <span
                            id={titleId}
                            className={dsCn(
                                'font-medium text-ds-content-primary',
                                titleClassName,
                            )}
                        >
                            {label}
                        </span>
                    )}
                    <span
                        id={descriptionId}
                        className="text-ds-caption text-ds-content-muted"
                    >
                        {description}
                    </span>
                </span>
            ) : label ? (
                <span id={titleId} className={titleClassName}>
                    {label}
                </span>
            ) : (
                children
            )}
        </label>
    );
}

/** aria-labelledby/aria-describedby do controle conforme o que foi renderizado. */
export function choiceAria(id: string, label?: string, description?: string) {
    const { titleId, descriptionId } = choiceIds(id);
    return {
        'aria-labelledby': label ? titleId : undefined,
        'aria-describedby': description ? descriptionId : undefined,
    };
}
