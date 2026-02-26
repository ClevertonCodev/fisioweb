import { DateTime, Settings } from 'luxon';

Settings.defaultZone = 'America/Sao_Paulo';

export function formatMoney(val: number | string | null | undefined, typeMoney: 'BRL' | 'USD' | 'EUR' = 'BRL'): string {
    if (val === null || val === undefined) {
        return 'R$ 0,00';
    }
    if (typeof val !== 'number') {
        val = parseFloat(val);
    }

    switch (typeMoney) {
        case 'USD':
            return formatMoneyUSD(val);
        case 'EUR':
            return formatMoneyEUR(val);
        default:
            return formatMoneyBRL(val);
    }
}

export function formatMoneyBRL(val: number): string {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

export function formatMoneyUSD(val: number): string {
    const formatted = val.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
    return formatted.replace('$', '$ ');
}

export function formatMoneyEUR(val: number): string {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
}

export function formatPercent(val: number | string): string {
    if (typeof val !== 'number') {
        val = parseFloat(val);
    }
    return val.toLocaleString('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }) + '%';
}

/**
 * Formata uma data para o formato especificado, tentando múltiplos formatos de entrada.
 * @param date - A data de entrada (Date ou string)
 * @param outputFormat - O formato de saída (default: 'yyyy-MM-dd')
 * @param inputFormats - Os formatos de entrada para tentar (default: ['dd/MM/yyyy', 'yyyy-MM-dd'])
 * @returns A data formatada como string, ou DateTime, ou null se inválida
 */
export function toFormatDate(
    date: Date | string,
    outputFormat: string | null = 'yyyy-MM-dd',
    inputFormats: string[] = ['dd/MM/yyyy', 'yyyy-MM-dd'],
): string | DateTime | null {
    let dateTime: DateTime | null = null;

    if (date instanceof Date) {
        dateTime = DateTime.fromJSDate(date);
    } else if (typeof date === 'string') {
        const isoDateTime = DateTime.fromISO(date);
        if (isoDateTime.isValid) {
            dateTime = isoDateTime;
        } else {
            for (const format of inputFormats) {
                const tryDateTime = DateTime.fromFormat(date, format);
                if (tryDateTime.isValid) {
                    dateTime = tryDateTime;
                    break;
                }
            }
        }
    }

    if (!dateTime || !dateTime.isValid) {
        return null;
    }

    if (outputFormat === null) {
        return dateTime;
    }

    return dateTime.toFormat(outputFormat);
}

/**
 * Formata uma data/hora para o formato especificado, tentando múltiplos formatos de entrada.
 * @param date - A data/hora de entrada (Date ou string)
 * @param outputFormat - O formato de saída (default: 'dd/MM/yyyy HH:mm')
 * @param inputFormats - Os formatos de entrada para tentar (default: ['dd/MM/yyyy HH:mm:ss', 'yyyy-MM-dd HH:mm:ss'])
 * @returns A data/hora formatada como string, ou DateTime, ou null se inválida
 */
export function toFormatDateTime(
    date: Date | string,
    outputFormat: string | null = 'dd/MM/yyyy HH:mm',
    inputFormats: string[] = ['dd/MM/yyyy HH:mm:ss', 'yyyy-MM-dd HH:mm:ss'],
): string | DateTime | null {
    let dateTime: DateTime | null = null;

    if (date instanceof Date) {
        dateTime = DateTime.fromJSDate(date);
    } else if (typeof date === 'string') {
        const isoDateTime = DateTime.fromISO(date);
        if (isoDateTime.isValid) {
            dateTime = isoDateTime;
        } else {
            for (const format of inputFormats) {
                const tryDateTime = DateTime.fromFormat(date, format);
                if (tryDateTime.isValid) {
                    dateTime = tryDateTime;
                    break;
                }
            }
        }
    }

    if (!dateTime || !dateTime.isValid) {
        return null;
    }

    if (outputFormat === null) {
        return dateTime;
    }

    const formattedDateTime = dateTime.toFormat(outputFormat);

    if (outputFormat.includes('HH:mm') || outputFormat.includes('H:mm')) {
        return formattedDateTime + 'h';
    }

    return formattedDateTime;
}

export function now(): DateTime {
    return DateTime.now();
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('');
}

export function formatDate(
    date: string | null,
    options?: Intl.DateTimeFormatOptions,
): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(
        'pt-BR',
        options ?? { day: '2-digit', month: 'short', year: 'numeric' },
    );
}
