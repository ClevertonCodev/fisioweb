import type { ReactNode } from 'react';

import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProgramWizardNavBarProps = {
    title: string;
    onBack: () => void;
    onNext?: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
    showNext?: boolean;
    progress?: { configured: number; total: number };
    className?: string;
    trailing?: ReactNode;
};

export function ProgramWizardNavBar({
    title,
    onBack,
    onNext,
    nextLabel = 'Avançar',
    nextDisabled = false,
    showNext = true,
    progress,
    className,
    trailing,
}: ProgramWizardNavBarProps) {
    const progressPercent =
        progress && progress.total > 0
            ? (progress.configured / progress.total) * 100
            : 0;

    return (
        <header
            className={cn(
                'sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur',
                className,
            )}
        >
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
                        {title}
                    </h1>
                    {progress && (
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="shrink-0 text-sm text-muted-foreground">
                                {progress.configured} de {progress.total}{' '}
                                editados
                            </span>
                            <div className="h-2 w-full max-w-40 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2">
                    {trailing}

                    <BackButton onClick={onBack} className="shrink-0" />

                    {showNext && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onNext}
                            disabled={nextDisabled}
                            className="shrink-0 cursor-pointer"
                        >
                            {nextLabel}
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
