export function formatDateTimeAt(iso: string): string {
    const format = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    const parts = Object.fromEntries(
        format.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
    );
    return `${parts.day}/${parts.month}/${parts.year} às ${parts.hour}:${parts.minute}`;
}
