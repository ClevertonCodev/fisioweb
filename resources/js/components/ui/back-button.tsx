import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BackButtonProps = {
    to?: string;
    onClick?: () => void;
    label?: string;
    className?: string;
};

/**
 * Padrão canônico de "Voltar" no fisioweb:
 * Button outline (borda) + ArrowLeft + label.
 */
export function BackButton({
    to,
    onClick,
    label = 'Voltar',
    className,
}: BackButtonProps) {
    const classes = cn(
        'cursor-pointer gap-1 border-border bg-background shadow-none',
        className,
    );

    if (to) {
        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                className={classes}
                asChild
            >
                <Link to={to} onClick={onClick}>
                    <ArrowLeft className="h-4 w-4" />
                    {label}
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClick}
            className={classes}
        >
            <ArrowLeft className="h-4 w-4" />
            {label}
        </Button>
    );
}
