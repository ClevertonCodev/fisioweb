import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface FinanceToggleHiddenProps {
    hidden: boolean;
    onToggle: () => void;
}

export function FinanceToggleHidden({ hidden, onToggle }: FinanceToggleHiddenProps) {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={onToggle}
            className="cursor-pointer shrink-0"
            aria-pressed={hidden}
            aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
        >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
    );
}
