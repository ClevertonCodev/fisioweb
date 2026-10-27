import { useEffect, useState } from 'react';

/**
 * Hora atual que avança a cada `intervalMs`, para telas que ficam abertas
 * e mostram algo que depende do relógio (próxima sessão, data do dia).
 */
export function useNow(intervalMs = 60_000): Date {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);

    return now;
}
