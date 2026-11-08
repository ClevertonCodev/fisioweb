export function formatPatientProgramDate(date?: string): string {
    const match = date ? /^(\d{4})-(\d{2})-(\d{2})/.exec(date) : null;
    if (!match) return '—';

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}
