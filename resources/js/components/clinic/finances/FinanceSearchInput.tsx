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

    useEffect(() => {
        setLocal(value);
    }, [value]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (local !== value) onChange(local);
        }, debounceMs);
        return () => window.clearTimeout(timer);
    }, [local, value, onChange, debounceMs]);

    return (
        <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
                className="pl-9"
                placeholder="Pesquisar"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
            />
        </div>
    );
}
