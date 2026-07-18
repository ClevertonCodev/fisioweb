import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';

interface FinanceSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    debounceMs?: number;
}

export function FinanceSearchInput({
    value,
    onChange,
    debounceMs = 250,
}: FinanceSearchInputProps) {
    const [local, setLocal] = useState(value);
    // Ajuste de state durante o render (padrão recomendado pelo React) em vez de
    // efeito: quando o valor controlado muda por fora, o input reflete na hora.
    const [lastValue, setLastValue] = useState(value);
    if (lastValue !== value) {
        setLastValue(value);
        setLocal(value);
    }

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (local !== value) onChange(local);
        }, debounceMs);
        return () => window.clearTimeout(timer);
    }, [local, value, onChange, debounceMs]);

    return (
        <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                className="pl-9"
                placeholder="Pesquisar"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
            />
        </div>
    );
}
