// Regras do DsTimepicker do Vue. O valor é texto "HH:MM" (24h); enquanto o
// usuário digita, pode ficar incompleto ("09", "09:3") ou fora da faixa ("99:99"):
// a máscara só arruma os dígitos, quem valida é o formulário.

export const HOURS = Array.from({ length: 24 }, (_, index) =>
    String(index).padStart(2, '0'),
);

export const MINUTES = Array.from({ length: 60 }, (_, index) =>
    String(index).padStart(2, '0'),
);

/**
 * Texto digitado → máscara HH:MM. Fica só com os dígitos (no máximo 4) e põe
 * ":" depois dos dois primeiros: "0930" → "09:30", "930" → "93:0".
 */
export function formatTypedTime(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);

    if (digits.length <= 2) return digits;

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** "09:30" → { hour: '09', minute: '30' }; null se não for um horário da lista. */
export function parseTime(
    value: string,
): { hour: string; minute: string } | null {
    const [hour, minute] = value.split(':');
    if (!HOURS.includes(hour) || !MINUTES.includes(minute)) return null;

    return { hour, minute };
}
