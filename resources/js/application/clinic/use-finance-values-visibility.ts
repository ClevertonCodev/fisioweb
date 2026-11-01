import { useCallback, useState } from 'react';

const STORAGE_KEY = 'clinic.finance.hideValues';

export function useFinanceValuesVisibility() {
    const [hidden, setHidden] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(STORAGE_KEY) === 'true';
    });

    const toggle = useCallback(() => {
        setHidden((prev) => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, String(next));
            return next;
        });
    }, []);

    return { hidden, toggle };
}
