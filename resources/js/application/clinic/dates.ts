/**
 * Datas que a API manda. `YYYY-MM-DD` é só o dia (início e fim de programa,
 * por exemplo): monta no fuso local, porque `new Date('2026-08-10')` é
 * meia-noite em UTC e vira o dia anterior em Brasília. Com hora, é instante.
 */
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
