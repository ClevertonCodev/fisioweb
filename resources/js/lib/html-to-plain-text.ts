/** Converte HTML simples (ex.: description do Google Calendar) em texto puro. */
export function htmlToPlainText(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    const looksLikeHtml =
        /<[a-z][\s\S]*>/i.test(value) || /&(?:[a-z]+|#\d+);/i.test(value);

    if (!looksLikeHtml) {
        return value;
    }

    const withBreaks = value
        .replace(/<\s*br\s*\/?\s*>/gi, '\n')
        .replace(/<\s*\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, '\n');

    const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
    const text = doc.body.textContent ?? '';

    return text
        .replace(/[ \t]+/g, ' ')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
