export function parseDate(value: string | null): Date | null {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number) as [
            number,
            number,
            number,
        ];
        return new Date(y, m - 1, d);
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** A data local como `YYYY-MM-DD`, sem passar por UTC (não vira o dia anterior). */
export function toDateOnly(date: Date | null): string | null {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
